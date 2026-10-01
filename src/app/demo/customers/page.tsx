import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Card } from "@/components/ui";
import { demoCustomers } from "@/lib/demo/data";

export const metadata = { title: "Demo Müşteriler" };
export default function DemoCustomersPage() {
  return <><PageHeader title="Müşteriler" description="İletişim bilgilerini, tekliflerini ve işleri bir arada tut." /><Card className="overflow-hidden"><div className="flex items-center justify-between border-b border-[#ececf0] px-5 py-4 sm:px-6"><h2 className="text-[17px] font-semibold">Aktif müşteriler</h2><span className="text-[13px] text-[#6E6E73]">3 müşteri</span></div><div className="divide-y divide-[#ececf0]">{demoCustomers.map((customer) => <Link href={`/demo/customers/${customer.id}`} key={customer.id} className="flex items-center justify-between gap-4 px-5 py-5 hover:bg-[#fafafa] sm:px-6"><div className="flex min-w-0 items-center gap-4"><div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#edf5ff] text-[13px] font-semibold text-[#0071E3]">{customer.name.split(" ").map((part) => part[0]).join("")}</div><div className="min-w-0"><p className="truncate text-[15px] font-semibold">{customer.name}</p><p className="mt-1 truncate text-[13px] text-[#6E6E73]">{customer.company || customer.city} · {customer.phone}</p></div></div><div className="flex shrink-0 items-center gap-3"><span className="hidden text-[12px] text-[#6E6E73] sm:block">{customer.jobs} iş</span><ArrowRight size={17} className="text-[#9b9ba1]" /></div></Link>)}</div></Card></>;
}
