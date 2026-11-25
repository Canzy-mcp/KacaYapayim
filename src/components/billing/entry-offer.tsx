"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";
import { CheckoutDetails, type CheckoutDefaults } from "./checkout-details";
import { ENTRY_FEATURES, ENTRY_FEE_LABEL } from "@/lib/billing/catalog";

// Single usta entry offer. `checkout` is set only when the owner can pay right now.
export function EntryOffer({ checkout, marketing = false, note }: { checkout?: CheckoutDefaults; marketing?: boolean; note?: string }) {
  const [open, setOpen] = useState(false);
  return <div className={marketing ? "marketing-plans" : undefined}>
    <section className="mx-auto flex max-w-[560px] min-w-0 flex-col rounded-2xl border border-primary bg-white p-6 shadow-card sm:p-8">
      <h3 className="text-[23px] font-semibold tracking-tight">Usta Üyelik</h3>
      <p className="mt-2 text-[13px] leading-5 text-ink-2">Tek seferlik ödeme, süresiz erişim. Abonelik ve aylık ücret yok.</p>
      <p className="mt-5"><span className="text-[44px] font-semibold tracking-display">{ENTRY_FEE_LABEL}</span>
        <span className="ml-2 text-[13px] text-ink-2">tek seferlik · süresiz</span></p>
      <ul className="mt-6 space-y-3 border-t border-line pt-5">{ENTRY_FEATURES.map(label =>
        <li key={label} className="flex items-start gap-2 text-[13px] leading-5"><Check size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-success-ink" />{label}</li>)}</ul>
      <div className="mt-7">
        {checkout ? <button type="button" aria-expanded={open}
          className="min-h-11 w-full rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          onClick={() => setOpen(true)}>Üyeliği başlat — {ENTRY_FEE_LABEL} tek seferlik</button>
          : marketing ? <Link href="/register?hesap=usta" className="marketing-primary w-full">Usta olarak katıl</Link>
          : <span className="flex min-h-11 items-center justify-center rounded-xl bg-line px-4 text-center text-[13px] font-medium text-ink-2">{note ?? "Çok yakında"}</span>}
      </div>
    </section>
    {open && checkout && <CheckoutDetails defaults={checkout} close={() => setOpen(false)} />}
    <p className="mt-4 text-center text-[12px] leading-5 text-ink-2">Fiyat TL cinsindendir. Ödeme koşullarını iyzico sayfasında görebilirsin. Müşteriler için usta bulmak, ilan açmak ve teklif almak ücretsizdir.</p>
  </div>;
}
