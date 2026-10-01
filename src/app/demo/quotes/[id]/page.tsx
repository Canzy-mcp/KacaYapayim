import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { QuotePreview } from "@/components/quotes/quote-preview";
import { Card } from "@/components/ui";
import { formatMoney } from "@/lib/costs/format";
import { demoQuotePreview, demoQuotes } from "@/lib/demo/data";

export const metadata = { title: "Demo Teklif" };
export default async function DemoQuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quote = demoQuotes.find((item) => item.id === id);
  if (!quote) notFound();
  const preview = { ...demoQuotePreview, quoteNumber: quote.number, title: quote.title, customer: { name: quote.customer, companyName: null }, salePrice: quote.amount };
  return <div className="mx-auto max-w-[1180px]"><Link href="/demo/quotes" className="mb-5 inline-flex min-h-10 items-center gap-2 text-[13px] font-medium text-[#6E6E73]"><ArrowLeft size={16} />Teklifler</Link><div className="mb-7"><h1 className="text-[34px] font-semibold tracking-[-0.055em]">{quote.number}</h1><p className="mt-2 text-[15px] text-[#6E6E73]">{quote.title} · {quote.status}</p></div><div className="grid gap-6 xl:grid-cols-[minmax(0,0.7fr)_minmax(420px,1fr)] xl:items-start"><div className="space-y-5"><Card className="p-5 sm:p-6"><h2 className="text-[18px] font-semibold">Teklif Bilgileri</h2><div className="mt-5 grid grid-cols-2 gap-5 text-[14px]"><div><p className="text-[#6E6E73]">Müşteri</p><p className="mt-1 font-semibold">{quote.customer}</p></div><div><p className="text-[#6E6E73]">Durum</p><p className="mt-1 font-semibold">{quote.status}</p></div><div><p className="text-[#6E6E73]">Teklif fiyatı</p><p className="mt-1 font-semibold">{formatMoney(quote.amount)}</p></div><div><p className="text-[#6E6E73]">Tarih</p><p className="mt-1 font-semibold">{quote.date}</p></div></div></Card><Card className="p-5 sm:p-6"><p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#6E6E73]">Yalnızca sana görünen finansal özet</p><div className="mt-4 grid grid-cols-2 gap-5 text-[14px]"><div><p className="text-[#6E6E73]">Tahmini maliyet</p><p className="mt-1 font-semibold">{formatMoney(Math.round(quote.amount * 0.69))}</p></div><div><p className="text-[#6E6E73]">Tahmini kâr</p><p className="mt-1 font-semibold">{formatMoney(quote.amount - Math.round(quote.amount * 0.69))}</p></div></div></Card></div><section><h2 className="mb-3 text-[14px] font-semibold">Müşterinin göreceği önizleme</h2><QuotePreview quote={preview} /></section></div></div>;
}
