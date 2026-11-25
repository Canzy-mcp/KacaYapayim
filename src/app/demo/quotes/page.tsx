import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Card } from "@/components/ui";
import { formatMoney } from "@/lib/costs/format";
import { demoQuotes } from "@/lib/demo/data";

export const metadata = { title: "Demo Teklifler" };
export default function DemoQuotesPage() {
  return <><PageHeader title="Teklifler" description="Hazırladığın teklifleri ve müşterilerinin yanıtlarını tek yerden takip et." action={{ label: "Yeni Teklif", href: "/demo/new-quote" }} /><Card className="overflow-hidden"><div className="border-b border-line px-5 py-4 sm:px-6"><h2 className="text-[17px] font-semibold">Tüm teklifler <span className="ml-1 text-[13px] font-normal text-muted">3</span></h2></div><div className="divide-y divide-line">{demoQuotes.map((quote) => <Link key={quote.id} href={`/demo/quotes/${quote.id}`} className="flex items-center justify-between gap-4 px-5 py-5 hover:bg-surface-2 sm:px-6"><div className="min-w-0"><p className="truncate text-[15px] font-semibold">{quote.title}</p><p className="mt-1 truncate text-[13px] text-muted">{quote.customer} · {quote.number} · {quote.date}</p></div><div className="flex shrink-0 items-center gap-4"><div className="text-right"><p className="text-[14px] font-semibold tabular-nums">{formatMoney(quote.amount)}</p><p className={`mt-1 text-[12px] font-medium ${quote.tone === "green" ? "text-success-ink" : quote.tone === "blue" ? "text-primary" : "text-muted"}`}>{quote.status}</p></div><ArrowRight size={17} className="text-subtle" /></div></Link>)}</div></Card></>;
}
