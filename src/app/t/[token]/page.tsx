import {quoteAmounts} from "@/lib/quotes/tax";
import Link from "next/link";
import {formatMoney} from "@/lib/costs/format";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { QuotePreview } from "@/components/quotes/quote-preview";
import { PublicViewTracker } from "@/components/quotes/public-view-tracker";
import { PublicQuoteDecision } from "@/components/quotes/public-quote-decision";
import { todayInIstanbul } from "@/lib/quotes/defaults";
import { getPublicQuote } from "@/lib/quotes/public-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Özel teklif",
    description: "Özel teklif bağlantısı.",
    robots: { index: false, follow: false, noarchive: true },
    referrer: "no-referrer",
  };
}

export default async function PublicQuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const quote = await getPublicQuote(token);
  if (!quote) notFound();
  const expired = quote.validUntil < todayInIstanbul() || quote.status === "expired";
  return <main className="public-quote-page min-h-screen bg-[#F5F5F7] px-3 py-5 text-[#1D1D1F] sm:px-6 sm:py-10">
    <div className="mx-auto max-w-[760px]">
      {quote.status === "cancelled" ? <p role="status" className="mb-4 rounded-2xl border border-[#e7d2cf] bg-[#fff8f6] px-5 py-4 text-sm font-medium text-[#8b4237]">Bu teklif artık geçerli değil.</p> : expired ? <p role="status" className="mb-4 rounded-2xl border border-[#e8ddc2] bg-[#fffbf2] px-5 py-4 text-sm font-medium text-[#856323]">Bu teklifin geçerlilik süresi dolmuş. <span className="ml-1 rounded-full bg-[#f3e7ca] px-2 py-1 text-xs">Süresi doldu</span></p> : null}
      {quote.packageOptions&&quote.packageOptions.length>1&&<section className="mb-5 rounded-2xl bg-white p-5"><h1 className="text-xl font-semibold">Hizmet paketlerini karşılaştırın</h1><p className="mt-2 text-sm text-[#6E6E73]">Kapsamları inceleyin; istediğiniz paketi açıp kabul edin. Yalnızca bir paket seçilebilir.</p><div className="mt-4 grid gap-3 sm:grid-cols-3">{quote.packageOptions.map(o=><div key={o.token} className="rounded-xl border p-4"><h2 className="font-semibold">{o.title}</h2><p className="mt-2 whitespace-pre-wrap text-sm">{o.description}</p><p className="mt-3 font-semibold">{formatMoney(quoteAmounts(o.salePrice,o.taxMode,o.taxRate??null).total)}</p>{!["cancelled","rejected","expired"].includes(o.status)&&<Link href={`/t/${o.token}`} aria-current={o.token===token?"page":undefined} className="mt-3 block min-h-11 py-3 text-sm text-[#0071E3]">{o.token===token?"Bu paket açık":o.status==="accepted"?"Seçilen paketi aç":"Paketi incele"}</Link>}</div>)}</div></section>}<QuotePreview quote={quote} />
      <PublicQuoteDecision token={token} quote={quote} />
      <a href={`/api/public/quotes/${token}/pdf`} className="public-quote-action mt-5 flex min-h-12 items-center justify-center rounded-[13px] bg-[#1D1D1F] px-5 text-sm font-semibold text-white transition hover:bg-[#38383b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071E3]">PDF İndir</a>
    </div>
    <PublicViewTracker token={token} eventId={crypto.randomUUID()} />
  </main>;
}
