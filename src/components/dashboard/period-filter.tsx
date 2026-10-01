"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DashboardRange, DashboardPeriod } from "@/lib/dashboard/range";

const choices: Array<{ value: DashboardPeriod; label: string }> = [
  { value: "this_month", label: "Bu Ay" }, { value: "last_month", label: "Geçen Ay" },
  { value: "last_30", label: "Son 30 Gün" }, { value: "this_year", label: "Bu Yıl" },
  { value: "custom", label: "Özel Tarih" },
];

export function DashboardPeriodFilter({ range }: { range: DashboardRange }) {
  const router = useRouter();
  const [period, setPeriod] = useState<DashboardPeriod>(range.period);
  const [start, setStart] = useState(range.startDate);
  const [end, setEnd] = useState(range.endDate);
  return <div className="flex flex-wrap items-end gap-2"><label className="text-xs font-medium text-[#6E6E73]">Dönem<select value={period} onChange={(event) => {
    const next = event.target.value as DashboardPeriod;
    setPeriod(next);
    if (next !== "custom") router.push(`/dashboard?period=${next}`);
  }} className="mt-1 block min-h-11 min-w-[150px] rounded-[12px] border border-[#d2d2d7] bg-white px-3 text-sm font-medium text-[#1D1D1F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0071E3]">{choices.map((choice) => <option key={choice.value} value={choice.value}>{choice.label}</option>)}</select></label>
    {period === "custom" && <form action="/dashboard" method="get" className="flex flex-wrap items-end gap-2"><input type="hidden" name="period" value="custom" /><label className="text-xs font-medium text-[#6E6E73]">Başlangıç<input type="date" name="start" required value={start} max={end} onChange={(event) => setStart(event.target.value)} className="mt-1 block min-h-11 rounded-[12px] border border-[#d2d2d7] bg-white px-2 text-sm text-[#1D1D1F]" /></label><label className="text-xs font-medium text-[#6E6E73]">Bitiş<input type="date" name="end" required value={end} min={start} onChange={(event) => setEnd(event.target.value)} className="mt-1 block min-h-11 rounded-[12px] border border-[#d2d2d7] bg-white px-2 text-sm text-[#1D1D1F]" /></label><button type="submit" className="min-h-11 rounded-[12px] bg-[#1D1D1F] px-4 text-sm font-semibold text-white">Uygula</button></form>}
  </div>;
}
