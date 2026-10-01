import { Card } from "@/components/ui";
import { formatMoney } from "@/lib/costs/format";
import { formatQuantity } from "@/lib/jobs/format";
import { unitDisplay } from "@/lib/costs/catalog";
import type { PainterCalculation } from "@/lib/jobs/painter-calculation";

export function JobCostSummary({ calculation }: { calculation: PainterCalculation }) {
  const groups = [
    { title: "Malzeme", type: "material", total: calculation.material_total },
    { title: "İşçilik", type: "labor", total: calculation.labor_total },
    { title: "Diğer", type: "other", total: calculation.other_total },
  ] as const;
  return <><Card className="border-[#c7def6] bg-[#f7fbff] p-6 sm:p-8"><p className="text-[14px] font-medium text-[#4b6884]">Gerçek maliyetin</p><p className="mt-3 break-words text-[clamp(2.3rem,7vw,3.5rem)] font-semibold leading-tight tracking-[-0.06em] tabular-nums">{formatMoney(calculation.grand_total)}</p><p className="mt-3 text-[14px] leading-6 text-[#6E6E73]">Bu işi yapmanın sana tahmini maliyeti.</p><div className="mt-7 space-y-3 border-t border-[#d8e8f8] pt-5">{groups.map((group) => <div key={group.title} className="flex items-center justify-between gap-3 text-[15px]"><span className="text-[#515159]">{group.title}</span><span className="font-semibold tabular-nums">{formatMoney(group.total)}</span></div>)}</div></Card>
    {calculation.warnings.map((warning) => <p key={warning} className="mt-4 rounded-[13px] border border-[#f4dcaa] bg-[#fffaf0] px-4 py-3 text-[13px] text-[#76510c]">{warning}</p>)}
    <details className="mt-5 overflow-hidden rounded-[20px] border border-[#e5e5e9] bg-white"><summary className="min-h-14 cursor-pointer px-5 py-4 text-[15px] font-semibold focus-visible:outline-2 focus-visible:outline-[#0071E3] sm:px-6">Maliyet detaylarını gör</summary><div className="border-t border-[#ececf0]">{groups.map((group) => {
      const lines = calculation.breakdown.filter((line) => group.type === "other" ? line.source_type === "fixed" || line.source_type === "extra" : line.source_type === group.type);
      if (!lines.length) return null;
      return <section key={group.title} className="border-b border-[#ececf0] px-5 py-5 last:border-0 sm:px-6"><h3 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-[#6E6E73]">{group.title}</h3><div className="space-y-4">{lines.map((line, index) => <div key={`${line.cost_item_id}-${index}`} className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[14px] font-medium">{line.name}</p><p className="mt-1 text-[12px] text-[#6E6E73]">{line.source_type === "labor" && line.metadata.worker_count !== undefined ? `${formatQuantity(line.metadata.worker_count)} kişi × ${formatQuantity(line.metadata.days)} gün` : `${formatQuantity(line.quantity)} ${unitDisplay(line.unit)} × ${formatMoney(line.unit_cost)}`}</p></div><p className="shrink-0 text-[14px] font-semibold tabular-nums">{formatMoney(line.total_cost)}</p></div>)}</div><p className="mt-4 border-t border-[#ececf0] pt-3 text-right text-[13px] font-semibold">Ara toplam: {formatMoney(group.total)}</p></section>;
    })}</div></details>
  </>;
}
