"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { CheckoutDetails, type CheckoutDefaults } from "./checkout-details";
import type { BillingInterval } from "@/lib/billing/provider";
import type { Plan, PlanId } from "@/types/database";

const featureLabels = [
  ["public_quotes", "Paylaşılabilir teklif bağlantısı"], ["pdf", "PDF teklif"],
  ["whatsapp", "WhatsApp ile paylaşım"], ["actual_profit", "Gerçek kâr takibi"],
  ["advanced_reports", "Gelişmiş raporlar"], ["remove_branding", "KaçaYapayım ibaresini kaldırma"],
  ["business_logo", "Teklifte işletme logosu"],
] as const;

export function PlanCards({ plans, currentPlan, marketing = false, checkout }: {
  plans: Plan[];
  currentPlan?: PlanId;
  marketing?: boolean;
  checkout?: CheckoutDefaults;
}) {
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [selected, setSelected] = useState<Plan | null>(null);
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null);
  const money = new Intl.NumberFormat("tr-TR");

  return <div className={marketing ? "marketing-plans" : undefined}>
    <div className="mb-6 inline-flex flex-wrap rounded-[14px] bg-[#eaeaee] p-1" role="group" aria-label="Ödeme dönemi">
      {(["monthly", "yearly"] as const).map(value => <button key={value} type="button" aria-pressed={interval === value}
        onClick={() => { setInterval(value); setSelected(null); }}
        className={`min-h-11 rounded-[11px] px-5 text-[13px] font-semibold focus-visible:outline-2 focus-visible:outline-[#075D54] ${interval === value ? "bg-white shadow-sm" : "text-[#5B6460]"}`}>
        {value === "monthly" ? "Aylık" : "Yıllık"}
      </button>)}
    </div>
    <div className="grid gap-4 lg:grid-cols-3">
      {plans.map(plan => {
        const paid = plan.id !== "free";
        const price = interval === "monthly" ? plan.monthly_price_kurus : plan.yearly_price_kurus;
        return <section key={plan.id} className={`relative flex min-w-0 flex-col rounded-[22px] border bg-white p-6 shadow-[0_8px_30px_rgba(29,29,31,.035)] sm:p-7 ${plan.id === "usta" ? (marketing ? "border-[#0071E3]" : "border-[#075D54]") : "border-[#E7E1D6]"}`}>
          {plan.id === "usta" && <span className={`absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold text-white ${marketing ? "bg-[#0071E3]" : "bg-[#075D54]"}`}>
            <Sparkles size={12} aria-hidden="true" />{marketing ? "Düzenli işler için" : "Önerilen"}
          </span>}
          <h3 className="text-[23px] font-semibold tracking-tight">{plan.name}</h3>
          <p className="mt-2 min-h-10 text-[13px] leading-5 text-[#5B6460]">{plan.description}</p>
          <div className="mt-5">
            <span className="text-[34px] font-semibold tracking-[-0.05em]">{money.format(price / 100)} ₺</span>
            <span className="ml-1 text-[13px] text-[#5B6460]">/{interval === "monthly" ? "ay" : "yıl"}</span>
          </div>
          {paid && interval === "yearly" && <p className="mt-1 text-[12px] text-[#5B6460]">Aylık karşılığı {new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(price / 1200)} ₺</p>}
          <div className="mt-6 border-t border-[#E7E1D6] pt-5">
            <p className="text-[13px] font-semibold">{plan.limits.monthly_quotes === null ? "Sınırsız teklif" : `Ayda ${plan.limits.monthly_quotes} teklif`}</p>
            <p className="mt-1 text-[13px] text-[#5B6460]">{plan.limits.active_customers === null ? "Sınırsız müşteri" : `${plan.limits.active_customers} aktif müşteri`}</p>
          </div>
          <ul className="mt-5 flex-1 space-y-3">{featureLabels.filter(([key]) => plan.features[key]).map(([key, label]) =>
            <li key={key} className="flex items-start gap-2 text-[13px] leading-5"><Check size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-[#23804d]" />{label}</li>
          )}</ul>
          <div className="mt-7">
            {currentPlan === plan.id ? <span className="flex min-h-11 items-center justify-center rounded-xl bg-[#f0f0f3] px-4 text-[13px] font-semibold">Mevcut paketin</span>
              : marketing && !paid ? <Link href="/register" className="marketing-primary w-full">Ücretsiz Başla</Link>
              : checkout && paid && price > 0 ? <button type="button"
                className="min-h-11 w-full rounded-xl bg-[#075D54] px-4 text-sm font-semibold text-white hover:bg-[#064A43] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#075D54]"
                onClick={event => { setTrigger(event.currentTarget); setSelected(plan); }}>
                {plan.name} paketini seç
              </button> : marketing && <span className="flex min-h-11 items-center justify-center rounded-xl bg-[#f0f0f3] px-4 text-center text-[13px] font-medium text-[#5B6460]">Ödeme bağlantısı hazırlanıyor</span>}
          </div>
        </section>;
      })}
    </div>
    {selected && checkout && <CheckoutDetails key={selected.id} plan={selected} interval={interval} defaults={checkout}
      close={() => { setSelected(null); trigger?.focus(); }} />}
    <p className="mt-4 text-[12px] leading-5 text-[#5B6460]">{checkout ? "Fiyatlar TL cinsindendir. Ödeme koşullarını iyzico sayfasında görebilirsin." : "Fiyatlar TL cinsindendir."}</p>
  </div>;
}
