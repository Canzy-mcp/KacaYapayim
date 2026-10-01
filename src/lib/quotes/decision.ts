import type { QuoteStatus } from "../../types/database.ts";

export const rejectionReasons = [
  { value: "price_high", label: "Fiyat yüksek" },
  { value: "not_now", label: "Şimdilik düşünmüyorum" },
  { value: "other_company", label: "Başka bir firma ile anlaştım" },
  { value: "scope_mismatch", label: "Kapsam uygun değil" },
  { value: "other", label: "Diğer" },
] as const;
export type RejectionReason = typeof rejectionReasons[number]["value"];
export const isRejectionReason = (value: string) => rejectionReasons.some((reason) => reason.value === value);
export const rejectionReasonLabel = (value: string | null) => rejectionReasons.find((reason) => reason.value === value)?.label || "Belirtilmedi";
export function canRespondToQuote(status: QuoteStatus, validUntil: string, today: string) {
  return ["ready", "sent", "viewed"].includes(status) && validUntil >= today;
}
