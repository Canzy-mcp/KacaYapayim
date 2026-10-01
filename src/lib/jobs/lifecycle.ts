import type { JobStatus } from "../../types/database.ts";

export const jobStatusLabel: Record<JobStatus, string> = {
  draft: "Taslak", calculated: "Hesaplandı", quoted: "Teklif Verildi",
  accepted: "Kabul Edildi", scheduled: "Planlandı", in_progress: "Devam Ediyor",
  completed: "Tamamlandı", cancelled: "İptal",
};
export const canStartJob = (status: JobStatus) => status === "accepted" || status === "scheduled";
export const canSaveActualCosts = (status: JobStatus) => status === "in_progress" || status === "completed";

export function actualProfitSummary(salePrice: number, estimatedCost: number, actualCost: number) {
  const cost = Math.round(actualCost * 100) / 100;
  const sale = Math.round(salePrice * 100) / 100;
  const estimated = Math.round(estimatedCost * 100) / 100;
  const profit = Math.round((sale - cost) * 100) / 100;
  return { actualCost: cost, actualProfit: profit,
    actualMargin: sale > 0 ? (profit / sale) * 100 : null,
    costVariance: Math.round((cost - estimated) * 100) / 100,
    profitVariance: Math.round((estimated - cost) * 100) / 100 };
}
