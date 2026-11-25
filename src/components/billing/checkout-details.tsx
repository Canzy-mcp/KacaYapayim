"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { startEntryCheckout } from "@/app/actions/billing";
import { ENTRY_FEE_LABEL } from "@/lib/billing/catalog";

export type CheckoutDefaults = { name: string; surname: string; email: string; city: string; gsmNumber?: string };

const control = "mt-1 min-h-11 w-full rounded-xl border border-muted bg-white px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const fields = [
  { key: "name", label: "Ad", autocomplete: "given-name", type: "text", maxLength: 80, required: true },
  { key: "surname", label: "Soyad", autocomplete: "family-name", type: "text", maxLength: 80, required: true },
  { key: "email", label: "E-posta", autocomplete: "email", type: "email", maxLength: 254, required: true },
  { key: "city", label: "Şehir", autocomplete: "address-level1", type: "text", maxLength: 80, required: true },
  { key: "gsmNumber", label: "Cep telefonu", autocomplete: "tel", type: "tel", maxLength: 25, required: true },
] as const;

export function CheckoutDetails({ defaults, close }: { defaults: CheckoutDefaults; close: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  useEffect(() => { heading.current?.focus(); }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const details = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    try {
      const result = await startEntryCheckout(details);
      if (result.ok) {
        window.location.assign(result.url);
        return;
      }
      setError(result.error);
    } catch {
      setError("Ödeme sayfası açılamadı. Lütfen tekrar dene.");
    }
    setPending(false);
  }

  return <form onSubmit={submit} aria-labelledby="billing-details-title" className="mt-6 rounded-2xl border border-line bg-surface-2 p-5 text-ink sm:p-6">
    <h3 id="billing-details-title" ref={heading} tabIndex={-1} className="text-xl font-semibold">Fatura bilgileri</h3>
    <p className="mt-2 text-ink-2">Usta Üyelik · {ENTRY_FEE_LABEL} tek seferlik</p>
    <p className="mt-2 text-sm text-ink-2">Ödeme bilgilerini iyzico sayfasında gireceksin.</p>
    <fieldset disabled={pending} className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2">
      {fields.map(field => <label key={field.key} className="min-w-0 text-sm font-medium">
        {field.label}
        <input className={control} name={field.key} type={field.type} autoComplete={field.autocomplete}
          defaultValue={defaults[field.key]} maxLength={field.maxLength} required={field.required}
          placeholder={field.key === "gsmNumber" ? "+90 5XX XXX XX XX" : undefined} />
      </label>)}
      <label className="text-sm font-medium">TCKN veya VKN
        <input className={control} name="identityNumber" autoComplete="off" inputMode="numeric" maxLength={11} pattern="[0-9]{10,11}" required />
      </label>
      <label className="text-sm font-medium sm:col-span-2">Fatura adresi
        <textarea className={control} name="address" autoComplete="street-address" minLength={5} maxLength={300} rows={2} required />
      </label>
    </fieldset>
    {error && <p role="alert" className="mt-3 text-sm text-danger-ink">{error}</p>}
    <div className="mt-5 flex flex-wrap gap-2">
      <button disabled={pending} className="min-h-11 rounded-xl bg-primary px-4 font-semibold text-white hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60">
        {pending ? "Ödeme sayfası açılıyor…" : "iyzico ile ödemeye geç"}
      </button>
      <button type="button" disabled={pending} onClick={close} className="min-h-11 rounded-xl px-4 font-medium text-primary focus-visible:outline-2 focus-visible:outline-primary">
        Vazgeç
      </button>
    </div>
  </form>;
}
