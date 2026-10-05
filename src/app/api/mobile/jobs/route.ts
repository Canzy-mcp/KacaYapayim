import {readJsonBody} from "@/lib/security/body";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createServiceClient } from "@/lib/supabase/admin";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { calculateProfessionJob, compileTemplate } from "@/lib/professions/engine";
import { TemplateError, type FieldValues, type ProfessionTemplate } from "@/lib/professions/schema";
import type { Database } from "@/types/database";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Mobile cannot call Next server actions. All monetary results are recomputed here from
// the authenticated business costs and the published (or saved) template.
export async function POST(request: NextRequest) {
  if (!await consumeRateLimit("mobile-job-save", 30, 60))
    return NextResponse.json({ error: "Çok fazla deneme yapıldı." }, { status: 429 });
  if (Number(request.headers.get("content-length") || 0) > 32_000)
    return NextResponse.json({ error: "İş bilgileri çok büyük." }, { status: 413 });
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  try {
    const { url, key } = getSupabaseConfig();
    const auth = createClient<Database>(url, key, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: authError } = await auth.auth.getUser(token);
    if (authError || !userData.user) return NextResponse.json({ error: "Oturum geçersiz." }, { status: 401 });
    const {value:payload,tooLarge}=await readJsonBody(request,32000);
    if(tooLarge)return NextResponse.json({error:"İş bilgileri çok büyük."},{status:413});
    if (!payload || typeof payload !== "object" || Array.isArray(payload))
      return NextResponse.json({ error: "İş bilgileri geçersiz." }, { status: 400 });
    const input = payload as Record<string, unknown>;
    const title = typeof input.title === "string" ? input.title.trim() : "";
    const description = typeof input.description === "string" ? input.description.trim() : "";
    const jobId = input.jobId === null || input.jobId === undefined ? null : input.jobId;
    const customerId = input.customerId === null || input.customerId === undefined ? null : input.customerId;
    if (!title || title.length > 160 || description.length > 2000 ||
      jobId !== null && (typeof jobId !== "string" || !uuid.test(jobId)) ||
      customerId !== null && (typeof customerId !== "string" || !uuid.test(customerId)) ||
      !input.fields || typeof input.fields !== "object" || Array.isArray(input.fields))
      return NextResponse.json({ error: "İş bilgilerini kontrol et." }, { status: 400 });

    const { data: business } = await auth.from("businesses").select("*")
      .eq("owner_id", userData.user.id).maybeSingle();
    if (!business?.onboarding_completed || !business.profession_id)
      return NextResponse.json({ error: "Önce işletme kurulumunu tamamla." }, { status: 403 });
    if (customerId) {
      const { data } = await auth.from("customers").select("id").eq("id", customerId as string)
        .eq("business_id", business.id).eq("is_archived", false).maybeSingle();
      if (!data) return NextResponse.json({ error: "Müşteri bulunamadı." }, { status: 404 });
    }
    let template: ProfessionTemplate | null = null;
    let savedSettings: Record<string, number> | null = null;
    if (jobId) {
      const { data: existing } = await auth.from("jobs")
        .select("id,status,profession_id,template_snapshot,settings_snapshot")
        .eq("id", jobId as string).eq("business_id", business.id).maybeSingle();
      if (!existing || existing.profession_id !== business.profession_id || !["draft", "calculated"].includes(existing.status))
        return NextResponse.json({ error: "Bu iş düzenlenemiyor." }, { status: 409 });
      template = existing.template_snapshot as ProfessionTemplate | null;
      savedSettings = existing.settings_snapshot as Record<string, number> | null;
    }
    if (!template) {
      const { data: profession } = await auth.from("professions")
        .select("current_version,is_active,is_public").eq("id", business.profession_id).maybeSingle();
      if (!profession?.is_active || !profession.is_public || !profession.current_version)
        return NextResponse.json({ error: "Meslek şablonu bulunamadı." }, { status: 404 });
      const { data: version } = await auth.from("profession_template_versions").select("template")
        .eq("profession_id", business.profession_id).eq("version", profession.current_version)
        .eq("status", "published").maybeSingle();
      template = version?.template as ProfessionTemplate | null;
    }
    if (!template) return NextResponse.json({ error: "Meslek şablonu bulunamadı." }, { status: 404 });
    compileTemplate(template);
    const { error: initializeError } = await auth.rpc("ensure_my_cost_defaults");
    if (initializeError) throw new Error("Cost initialization failed");
    const [costsResult, settingsResult] = await Promise.all([
      auth.from("business_cost_items").select("*").eq("business_id", business.id),
      auth.from("business_profession_settings").select("settings").eq("business_id", business.id)
        .eq("profession_id", business.profession_id).maybeSingle(),
    ]);
    if (costsResult.error || settingsResult.error) throw new Error("Cost lookup failed");
    const settings = savedSettings || settingsResult.data?.settings as Record<string, number> || {};
    const calculation = calculateProfessionJob({ template, fieldValues: input.fields as FieldValues,
      businessCosts: costsResult.data || [], businessSettings: settings });
    const { data: id, error: saveError } = await createServiceClient().rpc("save_generic_job", {
      p_user_id: userData.user.id, p_business_id: business.id, p_job_id: jobId as string | null,
      p_customer_id: customerId as string | null, p_title: title, p_description: description || null,
      p_profession_id: business.profession_id, p_version: template.version,
      p_input_data: calculation.normalizedFields as Record<string, unknown>,
      p_template_snapshot: template as unknown as Record<string, unknown>,
      p_settings_snapshot: Object.fromEntries(template.settings.map(item => [item.key, settings[item.key] ?? item.defaultValue])),
      p_calculation_snapshot: { computedValues: calculation.computedValues, quoteScope: calculation.quoteScope,
        quoteExclusions: template.quoteExclusions, warnings: calculation.warnings, totalCost: calculation.totalCost },
      p_lines: calculation.costBreakdown as unknown as Array<Record<string, unknown>>, p_total: calculation.totalCost,
    });
    if (saveError || !id) throw new Error("Job save failed");
    return NextResponse.json({ id, totalCost: calculation.totalCost, warnings: calculation.warnings });
  } catch (error) {
    if (error instanceof TemplateError) return NextResponse.json({ error: error.message, field: error.key }, { status: 400 });
    return NextResponse.json({ error: "İş kaydedilemedi. Tekrar dene." }, { status: 500 });
  }
}
