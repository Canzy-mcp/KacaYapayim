import { effectiveQuoteStatus } from "@/lib/quotes/service";
import type { Quote } from "@/types/database";

export const quoteStatusCopy = {
  draft: "Taslak", ready: "Hazır", sent: "Gönderildi", viewed: "Görüldü", accepted: "Kabul Edildi",
  rejected: "Reddedildi", expired: "Süresi Doldu", cancelled: "İptal",
} as const;

export function QuoteStatusBadge({ quote }: { quote: Pick<Quote, "status" | "valid_until"> }) {
  const status = effectiveQuoteStatus(quote);
  const tone = status === "ready" || status === "accepted" ? "bg-[#eaf7ee] text-[#247344]" :
    status === "draft" ? "bg-[#f0f0f2] text-[#62626a]" :
    status === "rejected" || status === "cancelled" || status === "expired" ? "bg-[#fff0ee] text-[#ae4439]" :
    "bg-[#edf4fd] text-[#2366a5]";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone}`}>{quoteStatusCopy[status]}</span>;
}
