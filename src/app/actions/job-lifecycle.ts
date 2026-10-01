"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCompletedViewer } from "@/lib/viewer";
import { isJobId } from "@/lib/jobs/service";

export type ActualCostInput = { estimatedId: string | null; name: string; category: string; totalCost: number };
export type LifecycleResult = { ok: true } | { ok: false; error: string };

export async function startJob(id: string): Promise<LifecycleResult> {
  await requireCompletedViewer();
  if (!isJobId(id)) return { ok: false, error: "İş bulunamadı." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("start_job", { p_job_id: id });
  if (error) return { ok: false, error: "İş başlatılamadı. Sayfayı yenileyip tekrar deneyin." };
  revalidatePath(`/jobs/${id}`); revalidatePath("/jobs"); revalidatePath("/dashboard");
  return { ok: true };
}

export async function saveActualCosts(id: string, lines: ActualCostInput[], notes: string): Promise<LifecycleResult> {
  await requireCompletedViewer();
  if (!isJobId(id) || !Array.isArray(lines) || lines.length > 100 || typeof notes !== "string" || notes.length > 2000 ||
      lines.some((line) => !line || typeof line.name !== "string" || line.name.trim().length > 160 ||
        typeof line.category !== "string" || typeof line.totalCost !== "number" || !Number.isFinite(line.totalCost) ||
        line.totalCost < 0 || line.totalCost > 99999999999999.99 ||
        Math.abs(Math.round(line.totalCost * 100) - line.totalCost * 100) > 1e-6 ||
        line.estimatedId !== null && (typeof line.estimatedId !== "string" || !isJobId(line.estimatedId))) ||
      lines.reduce((sum, line) => sum + (typeof line?.totalCost === "number" ? line.totalCost : 0), 0) > 99999999999999.99)
    return { ok: false, error: "Gerçek maliyetleri kontrol edin." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_actual_job_costs", { p_job_id: id,
    p_lines: lines.map((line) => ({ estimatedId: line.estimatedId, name: line.name.trim(),
      category: line.category, totalCost: line.totalCost.toFixed(2) })), p_notes: notes.trim() || null });
  if (error) return { ok: false, error: "Gerçek maliyetler kaydedilemedi. Tekrar deneyin." };
  revalidatePath(`/jobs/${id}`); revalidatePath(`/jobs/${id}/complete`); revalidatePath("/jobs"); revalidatePath("/dashboard");
  return { ok: true };
}
