import { effectiveQuoteStatus } from "@/lib/quotes/service";
import type { Quote } from "@/types/database";

export const quoteStatusCopy = {
  draft: "Taslak", ready: "Hazır", sent: "Gönderildi", viewed: "Görüldü", accepted: "Kabul Edildi",
  rejected: "Reddedildi", expired: "Süresi Doldu", cancelled: "İptal",
} as const;

export function QuoteStatusBadge({ quote }: { quote: Pick<Quote, "status" | "valid_until"> }) {
  const status = effectiveQuoteStatus(quote);
  const tone = status === "ready" || status === "accepted" ? "bg-success-soft text-success-ink" :
    status === "draft" ? "bg-line text-muted" :
    status === "rejected" || status === "cancelled" || status === "expired" ? "bg-danger-soft text-danger-ink" :
    "bg-primary-soft text-primary";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone}`}>{quoteStatusCopy[status]}</span>;
}
