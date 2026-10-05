import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Card } from "@/components/ui";
import { formatMoney } from "@/lib/costs/format";
import { dateInIstanbul, formatQuoteDate } from "@/lib/quotes/defaults";
import { QuoteStatusBadge } from "@/lib/quotes/format";
import { searchQuotes } from "@/lib/quotes/service";

export const metadata = { title: "Teklifler" };
const tabs = [
  { label: "Tümü", value: "all" }, { label: "Taslak", value: "draft" },
  { label: "Hazır", value: "ready" }, { label: "Gönderildi", value: "sent" }, { label: "Görüldü", value: "viewed" }, { label: "Kabul", value: "accepted" }, { label: "Reddedildi", value: "rejected" }, { label: "Süresi doldu", value: "expired" }, { label: "İptal", value: "cancelled" },
] as const;

export default async function QuotesPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; page?: string }> }) {
  const params = await searchParams;
  const status = tabs.some((tab) => tab.value === params.status) ? params.status! : "all";
  const query = (params.q || "").trim().toLocaleLowerCase("tr-TR").slice(0, 80);
  const result = await searchQuotes(query, status, Number(params.page || 1));
  const visible = result.rows;
  const pageHref = (page: number) => '/quotes?' + new URLSearchParams({ status, q: query, page: String(page) }).toString();
  return <><PageHeader title="Teklifler" description="Hazırladığın teklifleri ve durumlarını buradan takip et." action={{ label: "Yeni Teklif", href: "/new-quote" }} />
    <a href="/api/export/quotes" className="mb-5 inline-flex min-h-11 items-center rounded-xl border bg-white px-4 text-sm">CSV Dışa Aktar</a>
    <><form action="/quotes" method="get" className="mb-5"><label htmlFor="quote-search" className="sr-only">Teklif ara</label><input type="hidden" name="status" value={status} /><input id="quote-search" name="q" defaultValue={params.q || ""} placeholder="Müşteri, teklif no veya iş ara" className="h-12 w-full max-w-[420px] rounded-[13px] border border-[#d5d5da] bg-white px-4 text-[14px] outline-none focus:border-[#0071E3]" /><button type="submit" className="ml-2 min-h-11 rounded-[13px] bg-[#0071E3] px-4 text-[13px] font-semibold text-white">Ara</button></form><nav aria-label="Teklif durumu" className="mb-5 flex gap-2 overflow-x-auto pb-1">{tabs.map((tab) => <Link key={tab.value} href={`/quotes?status=${tab.value}${query ? `&q=${encodeURIComponent(query)}` : ""}`} aria-current={status === tab.value ? "page" : undefined} className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-medium ${status === tab.value ? "bg-[#1D1D1F] text-white" : "border border-[#dedee2] bg-white text-[#5c5c64]"}`}>{tab.label}</Link>)}</nav>
      {visible.length ? <Card className="overflow-hidden"><div className="hidden grid-cols-[1fr_1.4fr_1.4fr_1fr_0.8fr_1fr_20px] gap-4 border-b border-[#ececf0] px-6 py-4 text-[11px] font-semibold uppercase tracking-wide text-[#8a8a91] md:grid"><span>Teklif No</span><span>Müşteri</span><span>İş</span><span>Tutar</span><span>Durum</span><span>Tarih</span><span /></div><div className="divide-y divide-[#ececf0]">{visible.map(({ quote, customerName }) => <Link key={quote.id} href={`/quotes/${quote.id}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-[#fafafa] md:grid md:grid-cols-[1fr_1.4fr_1.4fr_1fr_0.8fr_1fr_20px] md:px-6"><div className="min-w-0 md:contents"><div className="md:order-1"><p className="text-[12px] font-semibold text-[#0071E3]">{quote.quote_number}</p><p className="mt-1 text-[15px] font-semibold md:hidden">{customerName}</p><p className="mt-1 truncate text-[13px] text-[#6E6E73] md:hidden">{quote.title}</p></div><p className="hidden truncate text-[14px] font-medium md:block">{customerName}</p><p className="hidden truncate text-[14px] text-[#6E6E73] md:block">{quote.title}</p></div><div className="flex shrink-0 flex-col items-end gap-1 md:contents"><p className="text-[15px] font-semibold tabular-nums md:text-[14px]">{formatMoney(quote.sale_price)}</p><QuoteStatusBadge quote={quote} /><p className="text-[11px] text-[#8a8a91] md:text-[13px]">{formatQuoteDate(dateInIstanbul(quote.created_at))}</p></div><ArrowRight size={16} className="hidden text-[#a0a0a7] md:block" /></Link>)}</div></Card> : <Card className="p-9 text-center"><p className="text-[15px] font-medium">Bu aramaya uygun teklif yok.</p><Link href="/quotes" className="mt-3 inline-block text-[13px] font-semibold text-[#0071E3]">Tüm teklifleri göster</Link></Card>}</>
    <nav aria-label="Teklif sayfaları" className="mt-5 flex items-center justify-between gap-3 text-sm">{result.page > 1 ? <Link className="min-h-11 rounded-xl border bg-white p-3" href={pageHref(result.page - 1)}>Önceki</Link> : <span />}<span>{result.count} teklif · Sayfa {result.page}</span>{result.page * result.pageSize < result.count && <Link className="min-h-11 rounded-xl border bg-white p-3" href={pageHref(result.page + 1)}>Sonraki</Link>}</nav>
  </>;
}
