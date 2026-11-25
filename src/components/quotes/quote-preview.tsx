import { taxLabels,quoteAmounts } from "@/lib/quotes/tax";

import { BrandLogo } from "@/components/brand-logo";
import { Check } from "lucide-react";
import { formatMoney } from "@/lib/costs/format";
import { formatQuoteDate } from "@/lib/quotes/defaults";
import type { CustomerQuotePreview } from "@/lib/quotes/public-preview";

function safeDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T12:00:00Z`).getTime())
    ? formatQuoteDate(value) : "Tarih seçilmedi";
}

export function QuotePreview({ quote }: { quote: CustomerQuotePreview }) {
  const amounts=quoteAmounts(quote.salePrice,quote.taxMode,quote.taxRate??null);
  return <article aria-label="Müşteri teklif önizlemesi" className="quote-paper w-full rounded-xl border border-line bg-white px-6 py-7 text-ink shadow-card sm:px-8 sm:py-9">
    <header className="flex flex-wrap items-start justify-between gap-5 border-b border-line pb-7"><div className="min-w-0">{quote.business.logoUrl && <img src={quote.business.logoUrl} alt={quote.business.name} className="mb-3 max-h-12 max-w-[160px] object-contain object-left" />}<p className="text-[22px] font-semibold tracking-display">{quote.business.name}</p><p className="mt-1 text-[12px] text-muted">{[quote.business.phone, quote.business.city].filter(Boolean).join(" · ")}</p></div><div className="text-left sm:text-right"><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Teklif</p><p className="mt-2 text-[12px] font-semibold tabular-nums">{quote.quoteNumber}</p><p className="mt-1 text-[12px] text-muted">{safeDate(quote.date)}</p></div></header>
    <section className="break-inside-avoid border-b border-line py-6"><p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Müşteri</p><p className="mt-2 text-[17px] font-semibold">{quote.customer?.name || "Müşteri seçilmedi"}</p>{quote.customer?.companyName && <p className="mt-1 text-[13px] text-muted">{quote.customer.companyName}</p>}</section>
    <section className="break-inside-avoid py-7"><h2 className="text-[24px] font-semibold leading-tight tracking-display">{quote.title || "Teklif başlığı"}</h2>{quote.description && <p className="mt-3 whitespace-pre-wrap text-[13px] leading-6 text-ink-2">{quote.description}</p>}</section>
    <section className="break-inside-avoid border-t border-line py-6"><h3 className="text-[12px] font-semibold uppercase tracking-wider text-muted">Teklife Dahil</h3><ul className="mt-4 space-y-3">{quote.items.map((item, index) => <li key={`${index}-${item.name}`} className="flex gap-3 text-[13px] leading-5"><Check size={16} className="mt-0.5 shrink-0 text-success" /><span><span className="font-medium">{item.name}</span>{item.description && <span className="mt-0.5 block text-muted">{item.description}</span>}</span></li>)}</ul></section>
    {quote.exclusions.length > 0 && <section className="break-inside-avoid border-t border-line py-6"><h3 className="text-[12px] font-semibold uppercase tracking-wider text-muted">Teklife Dahil Değil</h3><ul className="mt-4 space-y-2 text-[13px] leading-5 text-muted">{quote.exclusions.map((item, index) => <li key={`${index}-${item}`}>— {item}</li>)}</ul></section>}
    {quote.estimatedDuration && <section className="break-inside-avoid border-t border-line py-5"><p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Tahmini Süre</p><p className="mt-2 text-[14px] font-medium">{quote.estimatedDuration}</p></section>}
    <section className="break-inside-avoid rounded-xl bg-surface-2 px-5 py-6"><p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Toplam Teklif</p><p className="mt-2 break-words text-[clamp(2rem,6vw,2.8rem)] font-semibold leading-tight tracking-display tabular-nums">{formatMoney(amounts.total)}</p><p className="mt-2 text-xs text-muted">{amounts.rate!==null ? "Toplam tutara KDV dahildir" : taxLabels[quote.taxMode ?? "unspecified"]}</p>{amounts.rate!==null&&<p className="mt-2 text-xs text-muted">Vergisiz: {formatMoney(amounts.subtotal)} · KDV %{amounts.rate}: {formatMoney(amounts.tax)}</p>}</section>
    <div className="mt-6 grid gap-5 border-b border-line pb-7 sm:grid-cols-2"><section className="break-inside-avoid"><h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted">Ödeme Koşulları</h3><p className="mt-2 whitespace-pre-wrap text-[13px] leading-5">{quote.paymentTerms || "Belirtilmedi"}</p></section><section className="break-inside-avoid"><h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted">Geçerlilik</h3><p className="mt-2 text-[13px]">{safeDate(quote.validUntil)} tarihine kadar</p></section></div>
    {quote.notes && <section className="break-inside-avoid border-b border-line py-6"><h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted">Not</h3><p className="mt-2 whitespace-pre-wrap text-[13px] leading-6">{quote.notes}</p></section>}
    <footer className="flex flex-wrap items-end justify-between gap-4 pt-6"><div><p className="text-[13px] font-semibold">{quote.business.name}</p><p className="mt-1 text-[11px] text-muted">{[quote.business.phone, quote.business.city].filter(Boolean).join(" · ")}</p></div>{quote.showBranding !== false && <div className="flex items-center gap-2 text-[11px] text-muted"><BrandLogo size={27} wordmark={false}/><span>KaçaYapayım ile hazırlandı</span></div>}</footer>
  </article>;
}
