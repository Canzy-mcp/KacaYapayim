"use client";

import { useState } from "react";
import { cancelBillingSubscription } from "@/app/actions/billing";

const button = "min-h-11 rounded-xl border border-[#E7E1D6] px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#075D54]";

export function CancelSubscription() {
  const [confirm, setConfirm] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function cancel() {
    setPending(true);
    setError("");
    try {
      const result = await cancelBillingSubscription(true);
      if (result.ok) setConfirm(false);
      else setError(result.error);
    } catch {
      setError("Abonelik durumu güncellenemedi. Lütfen tekrar dene.");
    } finally {
      setPending(false);
    }
  }

  return <div className="mt-5">
    {confirm ? <div role="group" aria-label="Abonelik iptalini onayla">
      <p className="text-sm text-[#5B6460]">Aboneliği iptal edersen işletmen hemen Ücretsiz pakete geçer.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={`${button} border-red-800 bg-red-800 text-white`} disabled={pending} onClick={cancel}>
          {pending ? "İptal ediliyor…" : "Evet, aboneliği iptal et"}
        </button>
        <button type="button" className={button} disabled={pending} onClick={() => { setConfirm(false); setError(""); }}>Vazgeç</button>
      </div>
    </div> : <button type="button" className={`${button} text-red-800`} onClick={() => setConfirm(true)}>Aboneliği iptal et</button>}
    {error && <p role="alert" className="mt-3 text-sm text-red-800">{error}</p>}
  </div>;
}
