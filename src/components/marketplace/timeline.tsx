import { Check } from "lucide-react";
import type { MarketState } from "@kacayapayim/core/marketplace";
import { requestStages } from "@/lib/marketplace/prefill";

const index = (state: MarketState) => requestStages.findIndex((step) => step.state === state);

export function MiniProgress({ state }: { state: MarketState }) {
  const active = index(state);
  if (active < 0) return null;
  return <div className="mt-4" aria-hidden="true">
    <div className="grid grid-cols-5 gap-1">{requestStages.map((step, i) => <span key={step.state} className={`h-1.5 rounded-full ${i <= active ? "bg-[#075D54]" : "bg-[#d2d2d7]"}`} />)}</div>
  </div>;
}

export function RequestTimeline({ state }: { state: MarketState }) {
  if (state === "cancelled") return <p className="mb-5 rounded-2xl border border-[#E7D3A9] bg-[#FBF3E2] px-4 py-3 text-sm text-[#5A3E0E]">Bu talep iptal edildi. Teklif ve randevu işlemleri kapandı.</p>;
  const active = index(state);
  return <ol aria-label="Talebin ilerleyişi" className="mb-5 grid grid-cols-1 gap-2 rounded-2xl border border-[#d2d2d7] bg-white p-3 sm:grid-cols-5">
    {requestStages.map((step, i) => {
      const current = i === active;
      const done = i < active;
      return <li key={step.state} aria-current={current ? "step" : undefined} className={`flex min-w-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm ${current ? "bg-[#E4EFEC] font-semibold text-[#075D54]" : done ? "text-[#1d1d1f]" : "text-[#515154]"}`}>
        <span aria-hidden="true" className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold ${done ? "bg-[#075D54] text-white" : current ? "border-2 border-[#075D54] text-[#075D54]" : "border border-[#d2d2d7] text-[#515154]"}`}>{done ? <Check size={13} /> : i + 1}</span>
        <span className="min-w-0">{step.label}{done && <span className="sr-only">, tamamlandı</span>}{current && <span className="sr-only">, şu anki adım</span>}</span>
      </li>;
    })}
  </ol>;
}
