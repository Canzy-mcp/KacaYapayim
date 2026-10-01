"use server";
import { logFailure } from "@/lib/observability/log";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { requireCompletedViewer } from "@/lib/viewer";
import { isJobId } from "@/lib/jobs/service";
import { isCustomerId } from "@/lib/customers/service";
import { getBusinessCosts } from "@/lib/costs/service";
import { calculateProfessionJob } from "@/lib/professions/engine";
import { getPublishedTemplate } from "@/lib/professions/service";
import { TemplateError, type FieldValues } from "@/lib/professions/schema";
import type { ProfessionTemplate } from "@/lib/professions/schema";
import { recordEvent } from "@/lib/analytics/events";

export async function saveProfessionJob(input: { jobId: string | null; customerId: string | null;
  title: string; description: string; fields: FieldValues }) {
  const viewer = await requireCompletedViewer();
  const business = viewer.business!;
  if (!business.profession_id) return { ok: false, error: "Meslek seçimi eksik." } as const;
  if (input.jobId && !isJobId(input.jobId) || input.customerId && !isCustomerId(input.customerId))
    return { ok: false, error: "İş veya müşteri bulunamadı." } as const;
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const description = typeof input.description === "string" ? input.description.trim() : "";
  if (!title || title.length > 160 || description.length > 2000)
    return { ok: false, error: "Başlık veya açıklama uzunluğunu kontrol et." } as const;
  const supabase = await createClient();
  let existingTemplate: ProfessionTemplate | null = null;
  let existingSettings: Record<string, number> | null = null;
  if (input.jobId) {
    const { data: existing } = await supabase.from("jobs").select("id,status,profession_id,template_snapshot,settings_snapshot")
      .eq("id", input.jobId).eq("business_id", business.id).maybeSingle();
    if (!existing || existing.profession_id !== business.profession_id || !["draft", "calculated"].includes(existing.status))
      return { ok: false, error: "Bu iş düzenlenemiyor." } as const;
    existingTemplate = existing.template_snapshot as unknown as ProfessionTemplate | null;
    existingSettings = existing.settings_snapshot as Record<string, number> | null;
  }
  const template = existingTemplate || await getPublishedTemplate(business.profession_id);
  if (!template) return { ok: false, error: "Bu meslek için yayınlanmış iş şablonu bulunamadı." } as const;
  if (input.customerId) {
    const { data: customer } = await supabase.from("customers").select("id")
      .eq("id", input.customerId).eq("business_id", business.id).maybeSingle();
    if (!customer) return { ok: false, error: "Müşteri bulunamadı." } as const;
  }
  const costData = await getBusinessCosts();
  const effectiveSettings = existingSettings || costData.settings;
  try {
    const calculation = calculateProfessionJob({ template, fieldValues: input.fields,
      businessCosts: costData.costs, businessSettings: effectiveSettings });
    const service = createServiceClient();
    const { data: id, error } = await service.rpc("save_generic_job", {
      p_user_id: viewer.id, p_business_id: business.id, p_job_id: input.jobId,
      p_customer_id: input.customerId, p_title: title, p_description: description || null,
      p_profession_id: business.profession_id, p_version: template.version,
      p_input_data: calculation.normalizedFields as Record<string, unknown>,
      p_template_snapshot: template as unknown as Record<string, unknown>,
      p_settings_snapshot: Object.fromEntries(template.settings.map((item) => [item.key, effectiveSettings[item.key] ?? item.defaultValue])),
      p_calculation_snapshot: { computedValues: calculation.computedValues, quoteScope: calculation.quoteScope,
        quoteExclusions: template.quoteExclusions, warnings: calculation.warnings, totalCost: calculation.totalCost },
      p_lines: calculation.costBreakdown as unknown as Array<Record<string, unknown>>, p_total: calculation.totalCost,
    });
    if (error || !id) { logFailure("Profession job save failed"); return { ok: false, error: "İş kaydedilemedi." } as const; }
    revalidatePath("/jobs"); revalidatePath(`/jobs/${id}`);
    if (input.customerId) revalidatePath(`/customers/${input.customerId}`);
    if (!input.jobId) await recordEvent("job_created", "/jobs");
    return { ok: true, id, totalCost: calculation.totalCost, warnings: calculation.warnings } as const;
  } catch (error) {
    if (error instanceof TemplateError) return { ok: false, error: error.message,
      fieldErrors: error.key ? { [error.key]: error.message } : undefined } as const;
    logFailure("Profession job calculation failed");
    return { ok: false, error: "İş hesaplanamadı. Bilgileri kontrol et." } as const;
  }
}
