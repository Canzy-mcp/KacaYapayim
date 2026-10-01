"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { saveActualCosts, type ActualCostInput } from "@/app/actions/job-lifecycle";
import { formatMoney, formatPercent } from "@/lib/costs/format";
import { actualProfitSummary } from "@/lib/jobs/lifecycle";
import type { ActualJobCost, JobCostBreakdown } from "@/types/database";

type Line = { key: string; estimatedId: string | null; name: string; category: string; estimated: number; amount: string };
const toAmount = (value: string) => Number(value.replace(",", "."));
const validAmount = (value: string) => /^\d+(?:[.,]\d{1,2})?$/.test(value.trim()) && toAmount(value) <= 99999999999999.99;

export function ActualCostForm({ id, breakdown, actualCosts, salePrice, estimatedCost, notes: initialNotes, completed }: {
  id: string; breakdown: JobCostBreakdown[]; actualCosts: ActualJobCost[];
  salePrice: number; estimatedCost: number; notes: string | null; completed: boolean;
}) {
  const router = useRouter();
  const saved = new Map(actualCosts.filter((row) => row.estimated_breakdown_id).map((row) => [row.estimated_breakdown_id, row]));
  const [lines, setLines] = useState<Line[]>([
    ...breakdown.map((row) => ({ key: row.id, estimatedId: row.id, name: row.name,
      category: row.category, estimated: row.total_cost,
      amount: String(saved.get(row.id)?.total_cost ?? row.total_cost) })),
    ...actualCosts.filter((row) => !row.estimated_breakdown_id).map((row) => ({ key: row.id, estimatedId: null,
      name: row.name, category: row.category, estimated: 0, amount: String(row.total_cost) })),
  ]);
  const [notes, setNotes] = useState(initialNotes || "");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const valid = lines.every((line) => validAmount(line.amount) && (line.estimatedId || line.name.trim().length > 0));
  const total = lines.reduce((sum, line) => sum + (validAmount(line.amount) ? Math.round(toAmount(line.amount) * 100) : 0), 0) / 100;
  const summary = actualProfitSummary(salePrice, estimatedCost, total);
  const update = (key: string, patch: Partial<Line>) => setLines((rows) => rows.map((row) => row.key === key ? { ...row, ...patch } : row));
  const submit = async () => {
    if (!valid || busy) return;
    setBusy(true); setError("");
    const payload: ActualCostInput[] = lines.map((line) => ({ estimatedId: line.estimatedId,
      name: line.name, category: line.category, totalCost: toAmount(line.amount) }));
    const result = await saveActualCosts(id, payload, notes);
    setBusy(false);
    if (!result.ok) { setError(result.error); return; }
    router.push(`/jobs/${id}?completed=1`); router.refresh();
  };
  return <div className="space-y-6"><div className="space-y-3">{lines.map((line) => <div key={line.key} className="rounded-[16px] border border-[#e6e6e9] bg-white p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0 flex-1">{line.estimatedId ? <h3 className="font-semibold">{line.name}</h3> : <label className="block text-xs font-medium text-[#6E6E73]">Yeni maliyet adı<input value={line.name} maxLength={160} onChange={(event) => update(line.key, { name: event.target.value })} className="mt-1 min-h-11 w-full rounded-xl border border-[#d2d2d7] px-3 text-sm text-[#1D1D1F]" placeholder="Örn. Otopark" /></label>}<p className="mt-1 text-xs text-[#6E6E73]">{line.estimatedId ? `Tahmini: ${formatMoney(line.estimated)}` : "Ek gerçek maliyet"}</p></div>{!line.estimatedId && <button type="button" onClick={() => setLines((rows) => rows.filter((row) => row.key !== line.key))} aria-label="Maliyeti kaldır" className="rounded-lg p-2 text-[#6E6E73]"><Trash2 size={17} /></button>}</div><label className="mt-4 block text-xs font-medium text-[#6E6E73]">Gerçek tutar (TL)<input inputMode="decimal" value={line.amount} onChange={(event) => update(line.key, { amount: event.target.value })} className="mt-1 min-h-12 w-full rounded-xl border border-[#d2d2d7] px-3 text-base font-semibold text-[#1D1D1F] outline-none focus:border-[#0071E3]" /></label>{line.estimatedId && validAmount(line.amount) && <p className="mt-2 text-xs text-[#6E6E73]">Fark: {formatMoney(toAmount(line.amount) - line.estimated)}</p>}</div>)}</div>
    <button type="button" onClick={() => setLines((rows) => [...rows, { key: crypto.randomUUID(), estimatedId: null, name: "", category: "other", estimated: 0, amount: "0" }])} className="flex min-h-11 items-center gap-2 rounded-xl border border-[#d2d2d7] bg-white px-4 text-sm font-medium"><Plus size={16} />Ek Maliyet Ekle</button>
    <label className="block text-sm font-medium">Tamamlama notu (isteğe bağlı)<textarea value={notes} maxLength={2000} onChange={(event) => setNotes(event.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-[#d2d2d7] bg-white px-3 py-2" /></label>
    <div className="sticky bottom-3 rounded-[18px] border border-[#e6e6e9] bg-white/95 p-5 shadow-lg backdrop-blur"><div className="grid grid-cols-2 gap-3 text-sm"><div><p className="text-[#6E6E73]">Tahmini maliyet</p><p className="font-semibold">{formatMoney(estimatedCost)}</p></div><div><p className="text-[#6E6E73]">Gerçek maliyet</p><p className="font-semibold">{formatMoney(total)}</p></div><div><p className="text-[#6E6E73]">Teklif</p><p className="font-semibold">{formatMoney(salePrice)}</p></div><div><p className="text-[#6E6E73]">{summary.actualProfit < 0 ? "Gerçek zarar" : "Gerçek kâr"}</p><p className="font-semibold">{formatMoney(summary.actualProfit)}</p></div></div><p className="mt-3 text-xs text-[#6E6E73]">Gerçek marj: {formatPercent(summary.actualMargin)}</p><button type="button" disabled={!valid || busy} onClick={() => setConfirm(true)} className="mt-4 min-h-[52px] w-full rounded-[13px] bg-[#1D1D1F] text-sm font-semibold text-white disabled:opacity-50">{completed ? "Gerçek Maliyeti Güncelle" : "İşi Tamamla"}</button>{!valid && <p className="mt-2 text-xs text-[#ae4439]">Tutarları ve ek maliyet adlarını kontrol edin.</p>}</div>
    {confirm && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center"><div role="dialog" aria-modal="true" aria-labelledby="complete-title" className="w-full max-w-md rounded-[22px] bg-white p-6"><h2 id="complete-title" className="text-xl font-semibold">{completed ? "Gerçek maliyetleri güncellemek istiyor musun?" : "Bu işi tamamlandı olarak işaretlemek istiyor musun?"}</h2><dl className="mt-5 space-y-2 text-sm"><div className="flex justify-between"><dt>Teklif</dt><dd className="font-semibold">{formatMoney(salePrice)}</dd></div><div className="flex justify-between"><dt>Gerçek maliyet</dt><dd className="font-semibold">{formatMoney(total)}</dd></div><div className="flex justify-between"><dt>{summary.actualProfit < 0 ? "Gerçek zarar" : "Gerçek kâr"}</dt><dd className="font-semibold">{formatMoney(summary.actualProfit)}</dd></div></dl>{error && <p role="alert" className="mt-4 text-sm text-[#ae4439]">{error}</p>}<div className="mt-6 grid gap-2"><button type="button" disabled={busy} onClick={submit} className="min-h-12 rounded-xl bg-[#1D1D1F] text-sm font-semibold text-white disabled:opacity-60">{busy ? "Kaydediliyor..." : completed ? "Güncelle" : "İşi Tamamla"}</button><button type="button" disabled={busy} onClick={() => setConfirm(false)} className="min-h-11 text-sm">Vazgeç</button></div></div></div>}
  </div>;
}
