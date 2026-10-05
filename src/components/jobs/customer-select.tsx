"use client";
import { useEffect, useState } from "react";
import { Check, Plus, Search } from "lucide-react";
import { searchJobCustomers, type CustomerChoice } from "@/app/actions/jobs";
import { formatTurkishPhone } from "@/lib/customers/format";
import { CustomerForm } from "@/components/customers/customer-form";
import { Dialog } from "@/components/ui/dialog";
export function CustomerSelect({ initialCustomers, selected, onSelect, demo = false }: {
  initialCustomers: CustomerChoice[]; selected: CustomerChoice | null;
  onSelect: (value: CustomerChoice | null) => void; demo?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(initialCustomers);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState<CustomerChoice[]>([]);
  useEffect(() => {
    setError(""); setLoading(false);
    if (!query.trim()) { setResults([...added, ...initialCustomers.filter(c => !added.some(a => a.id === c.id))]); return; }
    if (demo) { setResults(initialCustomers.filter(c => `${c.name} ${c.company_name ?? ""} ${c.phone ?? ""}`.toLocaleLowerCase("tr-TR").includes(query.toLocaleLowerCase("tr-TR")))); return; }
    let active = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try { const choices = await searchJobCustomers(query); if (active) setResults(choices); }
      catch { if (active) setError("Müşteriler yüklenemedi. Bağlantını kontrol edip yeniden dene."); }
      finally { if (active) setLoading(false); }
    }, 300);
    return () => { active = false; window.clearTimeout(timer); };
  }, [query, initialCustomers, added, demo, retry]);
  return <div><label className="relative block"><span className="sr-only">Müşteri ara</span><Search size={19} aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8a8a91]" /><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Ad, telefon veya firma ile ara" className="h-12 w-full rounded-[13px] border border-[#D2D2D7] bg-white pl-11 pr-4 text-base" /></label>
    {selected && <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[#b8d8f7] bg-[#eef6ff] px-4 py-3"><div><p className="text-sm font-semibold">{selected.name}</p><p className="text-xs text-[#6E6E73]">Seçili müşteri</p></div><Check size={18} className="text-[#0071E3]" /></div>}
    {error ? <div role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}<button type="button" onClick={() => setRetry(v => v + 1)} className="ml-2 min-h-11 underline">Yeniden Dene</button></div> : <div aria-busy={loading} className="mt-4 max-h-[320px] overflow-y-auto rounded-[15px] border border-[#e5e5e9] bg-white"><p role="status" className="border-b border-[#ececf0] px-4 py-3 text-xs text-[#6E6E73]">{loading ? "Aranıyor..." : results.length ? "Müşteriler" : "Müşteri bulunamadı"}</p>{!loading && results.map(c => <button key={c.id} type="button" onClick={() => onSelect(c)} className="flex min-h-[62px] w-full items-center justify-between gap-3 border-b border-[#ececf0] px-4 py-3 text-left last:border-0 hover:bg-[#f9f9fb]"><span className="min-w-0"><span className="block truncate text-sm font-semibold">{c.name}</span><span className="mt-0.5 block truncate text-xs text-[#6E6E73]">{c.company_name || formatTurkishPhone(c.phone)}</span></span>{selected?.id === c.id && <Check size={17} className="text-[#0071E3]" />}</button>)}</div>}
    <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => setAdding(true)} disabled={demo} className="inline-flex min-h-11 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-semibold disabled:opacity-50"><Plus size={17} />Yeni müşteri oluştur</button><button type="button" onClick={() => onSelect(null)} className="min-h-11 rounded-xl px-4 text-sm text-[#6E6E73]">Müşterisiz devam et</button></div>
    {adding && <Dialog title="Yeni müşteri" className="max-w-3xl" onClose={() => setAdding(false)}><CustomerForm onCreated={c => { setAdded(a => [c, ...a]); onSelect(c); setQuery(""); setAdding(false); }} onCancel={() => setAdding(false)} /></Dialog>}
  </div>;
}
