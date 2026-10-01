"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Plus, Search } from "lucide-react";
import { searchJobCustomers, type CustomerChoice } from "@/app/actions/jobs";
import { formatTurkishPhone } from "@/lib/customers/format";

export function CustomerSelect({ initialCustomers, selected, onSelect }: {
  initialCustomers: CustomerChoice[]; selected: CustomerChoice | null;
  onSelect: (value: CustomerChoice | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(initialCustomers);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!query.trim()) { setResults(initialCustomers); return; }
    let active = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try { const choices = await searchJobCustomers(query); if (active) setResults(choices); }
      catch { if (active) setResults([]); }
      finally { if (active) setLoading(false); }
    }, 300);
    return () => { active = false; window.clearTimeout(timer); };
  }, [query, initialCustomers]);
  return <div><label className="relative block"><span className="sr-only">Müşteri ara</span><Search size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8a8a91]" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ad, telefon veya firma ile ara" className="h-12 w-full rounded-[13px] border border-[#D2D2D7] bg-white pl-11 pr-4 text-[16px] outline-none focus:border-[#0071E3] focus:ring-3 focus:ring-[#0071E3]/15" /></label>
    {selected && <div className="mt-4 flex items-center justify-between gap-3 rounded-[13px] border border-[#b8d8f7] bg-[#eef6ff] px-4 py-3"><div><p className="text-[14px] font-semibold">{selected.name}</p><p className="text-[12px] text-[#6E6E73]">Seçili müşteri</p></div><Check size={18} className="text-[#0071E3]" /></div>}
    <div className="mt-4 max-h-[320px] overflow-y-auto rounded-[15px] border border-[#e5e5e9] bg-white"><p className="border-b border-[#ececf0] px-4 py-3 text-[12px] font-medium text-[#6E6E73]">{loading ? "Aranıyor..." : results.length ? "Müşteriler" : "Müşteri bulunamadı"}</p>{results.map((customer) => <button key={customer.id} type="button" onClick={() => onSelect(customer)} className="flex min-h-[62px] w-full items-center justify-between gap-3 border-b border-[#ececf0] px-4 py-3 text-left last:border-0 hover:bg-[#f9f9fb]"><span className="min-w-0"><span className="block truncate text-[14px] font-semibold">{customer.name}</span><span className="mt-0.5 block truncate text-[12px] text-[#6E6E73]">{customer.company_name || formatTurkishPhone(customer.phone)}</span></span>{selected?.id === customer.id && <Check size={17} className="shrink-0 text-[#0071E3]" />}</button>)}</div>
    <div className="mt-4 flex flex-col gap-2 sm:flex-row"><Link href="/customers/new" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[13px] border border-[#D2D2D7] bg-white px-4 text-[14px] font-semibold"><Plus size={17} />Yeni müşteri oluştur</Link><button type="button" onClick={() => onSelect(null)} className="min-h-11 rounded-[13px] px-4 text-[14px] font-medium text-[#6E6E73] hover:bg-black/5">Müşterisiz devam et</button></div>
  </div>;
}
