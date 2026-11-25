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
import { quoteAccess } from "@/lib/quotes/public-access";
import { PublicAccessForm } from "@/components/quotes/public-access-form";

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
  const access=await quoteAccess(token);
  if(access.state==="locked")return <PublicAccessForm token={token}/>;
  if(access.state==="unavailable")notFound();
  const quote = await getPublicQuote(token);
  if (!quote) notFound();
  const expired = quote.validUntil < todayInIstanbul() || quote.status === "expired";
  return <main className="public-quote-page min-h-screen bg-canvas px-3 py-5 text-ink sm:px-6 sm:py-10">
    <div className="mx-auto max-w-[760px]">
      {quote.status === "cancelled" ? <p role="status" className="mb-4 rounded-2xl border border-danger-200 bg-danger-soft px-5 py-4 text-sm font-medium text-danger-ink">Bu teklif artık geçerli değil.</p> : expired ? <p role="status" className="mb-4 rounded-2xl border border-warning-soft bg-warning-soft px-5 py-4 text-sm font-medium text-warning-ink">Bu teklifin geçerlilik süresi dolmuş. <span className="ml-1 rounded-full bg-warning-soft px-2 py-1 text-xs">Süresi doldu</span></p> : null}
      {quote.packageOptions&&quote.packageOptions.length>1&&<section className="mb-5 rounded-2xl bg-white p-5"><h1 className="text-xl font-semibold">Hizmet paketlerini karşılaştırın</h1><p className="mt-2 text-sm text-muted">Kapsamları inceleyin; istediğiniz paketi açıp kabul edin. Yalnızca bir paket seçilebilir.</p><div className="mt-4 grid gap-3 sm:grid-cols-3">{quote.packageOptions.map(o=><div key={o.token} className="rounded-xl border p-4"><h2 className="font-semibold">{o.title}</h2><p className="mt-2 whitespace-pre-wrap text-sm">{o.description}</p><p className="mt-3 font-semibold">{formatMoney(quoteAmounts(o.salePrice,o.taxMode,o.taxRate??null).total)}</p>{!["cancelled","rejected","expired"].includes(o.status)&&<Link href={`/t/${o.token}`} aria-current={o.token===token?"page":undefined} className="mt-3 block min-h-11 py-3 text-sm text-primary">{o.token===token?"Bu paket açık":o.status==="accepted"?"Seçilen paketi aç":"Paketi incele"}</Link>}</div>)}</div></section>}<QuotePreview quote={quote} />
      <PublicQuoteDecision token={token} quote={quote} />
      <a href={`/api/public/quotes/${token}/pdf`} className="public-quote-action mt-5 flex min-h-12 items-center justify-center rounded-lg bg-ink px-5 text-sm font-semibold text-white transition hover:bg-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">PDF İndir</a>
    </div>
    <PublicViewTracker token={token} eventId={crypto.randomUUID()} />
  </main>;
}
