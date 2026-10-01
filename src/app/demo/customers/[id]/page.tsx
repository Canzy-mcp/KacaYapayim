import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui";
import { demoCustomers, demoQuotes } from "@/lib/demo/data";
import { formatMoney } from "@/lib/costs/format";

export const metadata = { title: "Demo Müşteri" };
export default async function DemoCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = demoCustomers.find((item) => item.id === id);
  if (!customer) notFound();
  const quotes = demoQuotes.filter((item) => item.customer === customer.name || item.customer === customer.company);
  return <div className="mx-auto max-w-[980px]"><Link href="/demo/customers" className="mb-5 inline-flex min-h-10 items-center gap-2 text-[13px] font-medium text-[#6E6E73]"><ArrowLeft size={16} />Müşteriler</Link><h1 className="text-[35px] font-semibold tracking-[-0.055em]">{customer.name}</h1><p className="mt-2 text-[15px] text-[#6E6E73]">{customer.company || customer.city} · {customer.status}</p><div className="mt-8 grid gap-5 md:grid-cols-2"><Card className="p-6"><h2 className="text-[18px] font-semibold">İletişim</h2><p className="mt-5 text-[13px] text-[#6E6E73]">Telefon</p><p className="mt-1 text-[15px] font-semibold">{customer.phone}</p><p className="mt-5 text-[13px] text-[#6E6E73]">Şehir</p><p className="mt-1 text-[15px] font-semibold">{customer.city}</p></Card><Card className="p-6"><h2 className="text-[18px] font-semibold">Özet</h2><p className="mt-5 text-[13px] text-[#6E6E73]">İş sayısı</p><p className="mt-1 text-[24px] font-semibold">{customer.jobs}</p><p className="mt-5 text-[13px] text-[#6E6E73]">Teklif sayısı</p><p className="mt-1 text-[24px] font-semibold">{quotes.length}</p></Card></div><Card className="mt-5 overflow-hidden"><h2 className="border-b border-[#ececf0] px-6 py-4 text-[18px] font-semibold">Teklifler</h2>{quotes.map((quote) => <Link href={`/demo/quotes/${quote.id}`} key={quote.id} className="flex items-center justify-between gap-3 px-6 py-5 hover:bg-[#fafafa]"><span className="text-[14px] font-semibold">{quote.title}</span><span className="text-[14px]">{formatMoney(quote.amount)}</span></Link>)}{!quotes.length && <p className="px-6 py-5 text-[14px] text-[#6E6E73]">Henüz teklif yok.</p>}</Card></div>;
}
