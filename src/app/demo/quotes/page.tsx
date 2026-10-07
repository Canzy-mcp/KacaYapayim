import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Card } from "@/components/ui";
import { formatMoney } from "@/lib/costs/format";
import { demoQuotes } from "@/lib/demo/data";

export const metadata = { title: "Demo Teklifler" };
export default function DemoQuotesPage() {
  return <><PageHeader title="Teklifler" description="Hazırladığın teklifleri ve müşterilerinin yanıtlarını tek yerden takip et." action={{ label: "Yeni Teklif", href: "/demo/new-quote" }} /><Card className="overflow-hidden"><div className="border-b border-[#ececf0] px-5 py-4 sm:px-6"><h2 className="text-[17px] font-semibold">Tüm teklifler <span className="ml-1 text-[13px] font-normal text-[#62626a]">3</span></h2></div><div className="divide-y divide-[#ececf0]">{demoQuotes.map((quote) => <Link key={quote.id} href={`/demo/quotes/${quote.id}`} className="flex items-center justify-between gap-4 px-5 py-5 hover:bg-[#fafafa] sm:px-6"><div className="min-w-0"><p className="truncate text-[15px] font-semibold">{quote.title}</p><p className="mt-1 truncate text-[13px] text-[#6E6E73]">{quote.customer} · {quote.number} · {quote.date}</p></div><div className="flex shrink-0 items-center gap-4"><div className="text-right"><p className="text-[14px] font-semibold tabular-nums">{formatMoney(quote.amount)}</p><p className={`mt-1 text-[12px] font-medium ${quote.tone === "green" ? "text-[#247344]" : quote.tone === "blue" ? "text-[#0071E3]" : "text-[#6E6E73]"}`}>{quote.status}</p></div><ArrowRight size={17} className="text-[#9b9ba1]" /></div></Link>)}</div></Card></>;
}
