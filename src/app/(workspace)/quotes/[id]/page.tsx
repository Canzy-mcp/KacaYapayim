import { PublishPackages } from "@/components/quotes/publish-packages";
import { ServicePackages } from "@/components/quotes/service-packages";
import { RevisionComparison } from "@/components/quotes/revision-comparison";
import { RevisionHistory } from "@/components/quotes/revision-history";
import { WorkPanel } from "@/components/work/work-panel";
import { RecordTools } from "@/components/work/record-tools";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { QuotePreview } from "@/components/quotes/quote-preview";
import { QuoteShareCard } from "@/components/quotes/quote-share-card";
import { ButtonLink, Card } from "@/components/ui";
import { formatMoney, formatPercent } from "@/lib/costs/format";
import { dateInIstanbul, formatQuoteDate } from "@/lib/quotes/defaults";
import { QuoteStatusBadge } from "@/lib/quotes/format";
import { toCustomerQuotePreview } from "@/lib/quotes/public-preview";
import { getQuoteBundle } from "@/lib/quotes/service";
import { rejectionReasonLabel } from "@/lib/quotes/decision";
import { getEffectivePlan } from "@/lib/billing/service";

export const metadata = { title: "Teklif Detayı" };
export default async function QuoteDetailPage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const flags = await searchParams;
  const bundle = await getQuoteBundle(id);
  if (!bundle) notFound();
  const { quote, customer, business, items, exclusions } = bundle;
  const plan = await getEffectivePlan(business.id);
  const preview = toCustomerQuotePreview({ quote, customer, business, items, exclusions, showBranding: !plan.features.remove_branding, showLogo: plan.features.business_logo });
  return <div className="quote-detail-page mx-auto max-w-[1280px]"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><Link href="/quotes" className="inline-flex min-h-11 items-center gap-2 text-[14px] font-medium text-[#6E6E73] hover:text-[#1D1D1F]"><ArrowLeft size={17} />Teklifler</Link>{["draft","ready"].includes(quote.status) && <ButtonLink href={`/quotes/${id}/edit`} variant="secondary"><Pencil size={16} />Düzenle</ButtonLink>}</div>
    {flags.saved && <p role="status" className="mb-5 rounded-[13px] border border-[#cce6d3] bg-[#f2faf4] px-4 py-3 text-[13px] font-medium text-[#247344]">{flags.saved === "ready" ? "Teklif hazır olarak kaydedildi." : "Teklif taslak olarak kaydedildi."}</p>}
    {quote.package_group_id&&quote.status==="draft"&&<PublishPackages id={id}/>}<RecordTools id={id} type="quote" /><ServicePackages id={id} cost={quote.estimated_cost_snapshot} price={quote.sale_price} scope={preview.items.map(item=>item.name+(item.description?": "+item.description:"")).join("\n")}/><RevisionHistory quote={quote} /><RevisionComparison quote={quote} /><WorkPanel quoteId={id} />
    <div className="flex flex-wrap items-center gap-3"><h1 className="text-[33px] font-semibold tracking-[-0.05em] sm:text-[42px]">{quote.quote_number}</h1><QuoteStatusBadge quote={quote} /></div><p className="mt-2 text-[15px] text-[#6E6E73]">{quote.title}</p>
    {quote.status === "accepted" && <Card className="mt-5 p-5 sm:p-6"><h2 className="text-lg font-semibold">✓ Teklif kabul edildi</h2><p className="mt-1 text-sm text-[#6E6E73]">{quote.accepted_at ? new Date(quote.accepted_at).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", dateStyle: "medium", timeStyle: "short" }) : ""} · {customer?.name || "Müşteri"} · {formatMoney(quote.sale_price)}</p><ButtonLink href={`/jobs/${quote.job_id}`} className="mt-4">İşi Aç</ButtonLink></Card>}
    {quote.status === "rejected" && <Card className="mt-5 p-5 sm:p-6"><h2 className="text-lg font-semibold">Teklif reddedildi</h2><p className="mt-1 text-sm text-[#6E6E73]">{quote.rejected_at ? new Date(quote.rejected_at).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", dateStyle: "medium", timeStyle: "short" }) : ""}</p><p className="mt-3 text-sm">Sebep: {rejectionReasonLabel(quote.rejection_reason)}</p>{quote.rejection_note && <p className="mt-2 whitespace-pre-wrap text-sm text-[#6E6E73]">Müşteri notu: {quote.rejection_note}</p>}<ButtonLink href={`/quotes/new?job_id=${quote.job_id}`} variant="secondary" className="mt-4">Yeni Teklif Hazırla</ButtonLink></Card>}
    <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,0.7fr)_minmax(420px,1fr)] xl:items-start"><div className="min-w-0 space-y-5"><Card className="p-5 sm:p-6"><h2 className="text-[18px] font-semibold">Teklif Bilgileri</h2><div className="mt-5 grid gap-4 text-[14px] sm:grid-cols-2"><div><p className="text-[12px] text-[#6E6E73]">Müşteri</p><p className="mt-1 font-medium">{customer ? <Link href={`/customers/${customer.id}`} className="text-[#0071E3]">{customer.name}</Link> : "Müşteri seçilmedi"}</p></div><div><p className="text-[12px] text-[#6E6E73]">İş</p><p className="mt-1 font-medium"><Link href={`/jobs/${quote.job_id}`} className="text-[#0071E3]">İşi Gör</Link></p></div><div><p className="text-[12px] text-[#6E6E73]">Geçerlilik</p><p className="mt-1 font-medium">{formatQuoteDate(quote.valid_until)}</p></div><div><p className="text-[12px] text-[#6E6E73]">Durum</p><p className="mt-1 font-medium"><QuoteStatusBadge quote={quote} /></p></div></div></Card>
      <Card className="p-5 sm:p-6"><p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#6E6E73]">Yalnızca sana görünen finansal özet</p><p className="mt-3 text-[34px] font-semibold tracking-[-0.05em] tabular-nums">{formatMoney(quote.sale_price)}</p><div className="mt-5 grid grid-cols-2 gap-4 border-t border-[#ececf0] pt-5 text-[14px]"><div><p className="text-[#6E6E73]">Maliyet</p><p className="mt-1 font-semibold">{formatMoney(quote.estimated_cost_snapshot)}</p></div><div><p className="text-[#6E6E73]">Tahmini kâr</p><p className="mt-1 font-semibold">{formatMoney(quote.estimated_profit_snapshot)}</p></div><div><p className="text-[#6E6E73]">Kâr marjı</p><p className="mt-1 font-semibold">{formatPercent(quote.profit_margin_snapshot)}</p></div><div><p className="text-[#6E6E73]">Teklif tarihi</p><p className="mt-1 font-semibold">{formatQuoteDate(dateInIstanbul(quote.created_at))}</p></div></div></Card>
      {quote.status !== "draft" && <Card className="p-5 sm:p-6"><h2 className="text-[18px] font-semibold">Paylaşım</h2><p className={`mt-3 text-sm font-medium ${quote.viewed_at ? "text-[#247344]" : "text-[#6E6E73]"}`}>{quote.viewed_at ? "✓ Müşteri teklifi görüntüledi." : "Henüz görüntülenmedi."}</p><div className="mt-5"><QuoteShareCard disabled={quote.sharing_disabled || false} id={id} token={quote.public_token} quoteNumber={quote.quote_number} businessName={business.name} customerName={customer?.name || null} customerPhone={customer?.phone || null} /></div><div className="mt-6 border-t border-[#ececf0] pt-5"><h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-[#6E6E73]">Durum Geçmişi</h3><ol className="mt-4 space-y-4 border-l border-[#dedee3] pl-4 text-sm"><li><p className="font-medium">Hazırlandı</p><p className="text-[#6E6E73]">{formatQuoteDate(dateInIstanbul(quote.created_at))}</p></li><li><p className="font-medium">Gönderildi</p><p className="text-[#6E6E73]">{quote.sent_at ? new Date(quote.sent_at).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", dateStyle: "medium", timeStyle: "short" }) : "Henüz gönderilmedi"}</p></li><li><p className="font-medium">Görüldü</p><p className="text-[#6E6E73]">{quote.viewed_at ? new Date(quote.viewed_at).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", dateStyle: "medium", timeStyle: "short" }) : "Henüz görüntülenmedi"}</p></li></ol><p className="mt-4 text-xs text-[#6E6E73]">Görüntülenme: {quote.view_count}</p></div></Card>}</div>
      <section className="min-w-0"><h2 className="mb-3 text-[14px] font-semibold">Müşterinin göreceği önizleme</h2><QuotePreview quote={preview} /></section></div>
  </div>;
}
