"use server";
import { logFailure } from "@/lib/observability/log";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCompletedViewer } from "@/lib/viewer";
import { isJobId } from "@/lib/jobs/service";
import { calculatePricingSummary, validateMargins } from "@/lib/pricing/engine";
import type { Job } from "@/types/database";

export type SavePricingResult = { ok: true; job: Job } | { ok: false; error: string; needsConfirmation?: boolean };

export async function saveJobPricing(input: {
  jobId: string; targetMargin: number; minimumMargin: number; selectedPrice: number; acknowledgeRisk?: boolean;
}): Promise<SavePricingResult> {
  const viewer = await requireCompletedViewer();
  if (!isJobId(input.jobId)) return { ok: false, error: "İş bulunamadı." };
  if (!validateMargins(input.targetMargin, input.minimumMargin) ||
      Math.abs(Math.round(input.targetMargin * 100) - input.targetMargin * 100) > 1e-6 ||
      Math.abs(Math.round(input.minimumMargin * 100) - input.minimumMargin * 100) > 1e-6)
    return { ok: false, error: "Kâr marjlarını kontrol et." };
  if (!Number.isFinite(input.selectedPrice) || input.selectedPrice < 0 || input.selectedPrice > 99999999999999.99 ||
      Math.abs(Math.round(input.selectedPrice * 100) - input.selectedPrice * 100) > 1e-6)
    return { ok: false, error: "Teklif fiyatını kontrol et." };
  const supabase = await createClient();
  const { data: before, error: readError } = await supabase.from("jobs").select("*").eq("id", input.jobId)
    .eq("business_id", viewer.business!.id).maybeSingle();
  if (readError || !before) return { ok: false, error: "İş bulunamadı." };
  if (before.estimated_cost <= 0) return { ok: false, error: "Önce iş maliyetini hesaplamalısın." };
  const summary = calculatePricingSummary(before.estimated_cost, input.targetMargin, input.minimumMargin, input.selectedPrice);
  if (["loss", "below_minimum"].includes(summary.status) && !input.acknowledgeRisk)
    return { ok: false, error: "Bu fiyatı onaylaman gerekiyor.", needsConfirmation: true };
  const { error } = await supabase.rpc("save_job_pricing", {
    p_job_id: input.jobId, p_target_margin: input.targetMargin, p_minimum_margin: input.minimumMargin,
    p_selected_sale_price: input.selectedPrice, p_acknowledge_risk: Boolean(input.acknowledgeRisk),
  });
  if (error) { logFailure("Pricing save failed"); return { ok: false, error: "Fiyat bilgileri kaydedilemedi." }; }
  const { data: job, error: reloadError } = await supabase.from("jobs").select("*").eq("id", input.jobId)
    .eq("business_id", viewer.business!.id).single();
  if (reloadError || !job) return { ok: false, error: "Fiyat kaydedildi ancak sonuç yüklenemedi." };
  revalidatePath("/jobs"); revalidatePath(`/jobs/${input.jobId}`);
  return { ok: true, job };
}
