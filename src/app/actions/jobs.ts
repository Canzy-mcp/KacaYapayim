"use server";
import { logFailure } from "@/lib/observability/log";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCompletedViewer } from "@/lib/viewer";
import { getBusinessCosts } from "@/lib/costs/service";
import { getCustomers, isCustomerId } from "@/lib/customers/service";
import { calculatePainterJobCost, PainterCalculationError, validatePainterWork,
  type ExtraCostSelection, type PainterWorkInput, type PainterCalculation } from "@/lib/jobs/painter-calculation";
import { isJobId } from "@/lib/jobs/service";
import type { Job, JobCostBreakdown } from "@/types/database";
import { recordEvent } from "@/lib/analytics/events";

export type JobActionResult = { ok: boolean; id?: string; calculation?: PainterCalculation;
  job?: Job; error?: string; fieldErrors?: Record<string, string>; needsCosts?: boolean };
export type CustomerChoice = { id: string; name: string; company_name: string | null; phone: string | null };

export async function searchJobCustomers(query: string): Promise<CustomerChoice[]> {
  const result = await getCustomers({ query: query.slice(0, 80) });
  return result.customers.slice(0, 20).map(({ id, name, company_name, phone }) => ({ id, name, company_name, phone }));
}

export async function calculateAndSavePainterJob(input: {
  jobId: string | null; customerId: string | null; title: string; description: string;
  work: PainterWorkInput; extras: ExtraCostSelection[];
}): Promise<JobActionResult> {
  const viewer = await requireCompletedViewer();
  if (viewer.business?.profession !== "Boyacı" || !viewer.business.profession_id)
    return { ok: false, error: "İş hesaplama şu anda Boyacı mesleği için kullanılabilir." };
  if (input.jobId && !isJobId(input.jobId)) return { ok: false, error: "İş bulunamadı." };
  if (input.customerId && !isCustomerId(input.customerId)) return { ok: false, error: "Müşteri bulunamadı." };
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const description = typeof input.description === "string" ? input.description.trim() : "";
  const fieldErrors = input.work && typeof input.work === "object" ? validatePainterWork(input.work) : { work: "İş bilgilerini kontrol et." };
  if (!title || title.length > 160) fieldErrors.title = "İş başlığını gir (en fazla 160 karakter).";
  if (description.length > 2000) fieldErrors.description = "Açıklama en fazla 2.000 karakter olabilir.";
  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors };
  if (!Array.isArray(input.extras)) return { ok: false, error: "Ek maliyetleri kontrol et." };
  const supabase = await createClient();
  if (input.customerId) {
    const { data, error } = await supabase.from("customers").select("id").eq("id", input.customerId)
      .eq("business_id", viewer.business.id).maybeSingle();
    if (error || !data) return { ok: false, error: "Müşteri bulunamadı." };
  }
  const data = await getBusinessCosts();
  if (!data.painterSettings) return { ok: false, error: "Boyacı iş ayarları yüklenemedi." };
  try {
    calculatePainterJobCost({ work: input.work, settings: data.painterSettings, costs: data.costs, extras: input.extras });
  } catch (error) {
    if (error instanceof PainterCalculationError) return { ok: false, error: error.message,
      fieldErrors: error.field && error.code === "INVALID_WORK" ? { [error.field]: error.message } : undefined,
      needsCosts: ["MISSING_COST", "INACTIVE_COST", "INVALID_UNIT", "INVALID_COST", "INVALID_SETTINGS", "MISSING_EXTRA_COST"].includes(error.code) };
    return { ok: false, error: "Hesaplama tamamlanamadı. Bilgileri kontrol et." };
  }
  const { data: savedId, error: saveError } = await supabase.rpc("save_painter_job", {
    p_job_id: input.jobId, p_customer_id: input.customerId, p_title: title, p_description: description || null,
    p_details: { ...input.work }, p_extra_costs: input.extras.map((extra) => ({ cost_item_id: extra.cost_item_id, quantity: extra.quantity })),
  });
  if (saveError || !savedId) {
    logFailure("Painter job save failed");
    const technical = saveError?.message || "";
    const missing = technical.match(/(?:MISSING_COST|INACTIVE_COST):([a-z_]+)/);
    if (missing) return { ok: false, error: `${missing[1]} maliyetini Maliyetlerim sayfasında kontrol et.`, needsCosts: true };
    return { ok: false, error: "İş kaydedilemedi. Bilgileri kontrol edip tekrar dene." };
  }
  const [jobResult, breakdownResult] = await Promise.all([
    supabase.from("jobs").select("*").eq("id", savedId).eq("business_id", viewer.business.id).single(),
    supabase.from("job_cost_breakdown").select("*").eq("job_id", savedId).order("created_at").order("id"),
  ]);
  if (jobResult.error || breakdownResult.error || !jobResult.data) {
    logFailure("Saved job read failed");
    return { ok: false, id: savedId, error: "İş kaydedildi ancak sonuç yüklenemedi. Kayıtlı işi açabilirsin." };
  }
  const breakdown = (breakdownResult.data || []) as JobCostBreakdown[];
  const sum = (source: JobCostBreakdown["source_type"]) => breakdown.filter((line) => line.source_type === source)
    .reduce((total, line) => total + Math.round(line.total_cost * 100), 0) / 100;
  const calculation: PainterCalculation = {
    breakdown: breakdown.map((line) => ({ cost_item_id: line.cost_item_id || "", name: line.name, category: line.category,
      unit: line.unit, quantity: line.quantity, unit_cost: line.unit_cost, total_cost: line.total_cost,
      source_type: line.source_type, metadata: line.metadata as Record<string, number> })),
    material_total: sum("material"), labor_total: sum("labor"), other_total: sum("fixed") + sum("extra"),
    grand_total: jobResult.data.estimated_cost,
    warnings: input.work.master_count === 0 && input.work.helper_count === 0 ? ["Bu iş için işçilik eklemedin."] : [],
  };
  revalidatePath("/jobs"); revalidatePath(`/jobs/${savedId}`);
  if (input.customerId) revalidatePath(`/customers/${input.customerId}`);
  if (!input.jobId) await recordEvent("job_created", "/jobs");
  return { ok: true, id: savedId, calculation, job: jobResult.data };
}
