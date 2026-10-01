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
      <QuotePreview quote={quote} />
      <PublicQuoteDecision token={token} quote={quote} />
      <a href={`/api/public/quotes/${token}/pdf`} className="public-quote-action mt-5 flex min-h-12 items-center justify-center rounded-[13px] bg-[#1D1D1F] px-5 text-sm font-semibold text-white transition hover:bg-[#38383b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071E3]">PDF İndir</a>
    </div>
    <PublicViewTracker token={token} eventId={crypto.randomUUID()} />
  </main>;
}
