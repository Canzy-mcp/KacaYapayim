"use client";

import {quoteAmounts} from "@/lib/quotes/tax";
import { PublicRevisionRequest } from "./public-revision-request";
import { useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { formatMoney } from "@/lib/costs/format";
import { canRespondToQuote, rejectionReasons } from "@/lib/quotes/decision";
import { todayInIstanbul } from "@/lib/quotes/defaults";
import type { PublicQuote } from "@/lib/quotes/public-preview";

export function PublicQuoteDecision({ token, quote }: { token: string; quote: PublicQuote }) {
  const router = useRouter();
  const [status, setStatus] = useState(quote.status);
  const [modal, setModal] = useState<"accept" | "reject" | null>(null);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(()=>setStatus(quote.status),[quote.status]);
  const eligible = canRespondToQuote(status, quote.validUntil, todayInIstanbul());
  const submit = async () => {
    if (!modal || busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/public/quotes/${token}/decision`, {
        method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
        body: JSON.stringify({ action: modal, reason: reason || null, note: note.trim() || null }),
      });
      if (response.status === 429) { setError('Çok fazla deneme yapıldı. Bir süre sonra yeniden deneyin.'); return; }
      if (response.status === 409) { setError('Teklifin durumu değişmiş olabilir. Güncel durumu görmek için sayfayı yenileyin.'); router.refresh(); return; }
      if (response.status === 404) { setError('Teklif artık kullanılamıyor. İşletmeyle iletişime geçin.'); return; }
      const result = await response.json();
      if (!response.ok || (result.status !== "accepted" && result.status !== "rejected")) throw new Error();
      setStatus(result.status); setModal(null);
    } catch { setError("Teklif yanıtınız kaydedilemedi. Tekrar deneyin."); }
    finally { setBusy(false); }
  };
  return <section className="public-quote-action mt-5 rounded-[20px] border border-[#e6e6e9] bg-white p-5 sm:p-6" aria-label="Teklif yanıtı">
    {status === "accepted" ? <div className="flex items-start gap-3"><Check className="mt-0.5 text-[#247344]" size={22} /><div><h2 className="text-lg font-semibold">Teklif kabul edildi.</h2><p className="mt-1 text-sm leading-6 text-[#6E6E73]">{quote.business.name} teklifinizi aldı. İşletme sizinle sonraki adımlar için iletişime geçecektir.</p></div></div>
    : status === "rejected" ? <div><h2 className="text-lg font-semibold">Teklif reddedildi.</h2><p className="mt-1 text-sm text-[#6E6E73]">Yanıtınız {quote.business.name}&apos;ya iletildi.</p></div>
    : !eligible ? quote.validUntil < todayInIstanbul() || status === "expired" ? <div><h2 className="text-base font-semibold">Bu teklifin geçerlilik süresi dolmuş.</h2><p className="mt-1 text-sm text-[#6E6E73]">Güncel teklif için işletmeyle iletişime geçebilirsiniz.</p></div> : null
    : <><h2 className="text-base font-semibold">Teklifi değerlendirdiniz mi?</h2><p className="mt-1 text-sm text-[#6E6E73]">Yanıtınız işletmeye iletilecek.</p><div className="mt-5 grid gap-2 sm:grid-cols-2"><button type="button" onClick={() => setModal("accept")} className="min-h-[52px] rounded-[13px] bg-[#1D1D1F] px-5 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071E3]">Teklifi Kabul Et</button><button type="button" onClick={() => setModal("reject")} className="min-h-[52px] rounded-[13px] border border-[#d2d2d7] px-5 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071E3]">Teklifi Reddet</button></div></>}
    {eligible && <PublicRevisionRequest token={token} />}
    {modal && <Dialog title={modal === "accept" ? "Teklifi kabul ediyor musunuz?" : "Teklifi reddetmek istiyor musunuz?"} onClose={() => setModal(null)} busy={busy}>{modal === "accept" ? <div className="mt-5 rounded-2xl bg-[#f5f5f7] p-4 text-sm"><p className="font-medium">{quote.title}</p><p className="mt-2 text-xl font-semibold">{formatMoney(quoteAmounts(quote.salePrice,quote.taxMode,quote.taxRate??null).total)}</p><p className="mt-2 whitespace-pre-wrap text-[#6E6E73]">Ödeme: {quote.paymentTerms || "Belirtilmedi"}</p></div> : <div className="mt-5 space-y-4"><label className="block text-sm font-medium">Sebep (isteğe bağlı)<select value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[#d2d2d7] bg-white px-3"><option value="">Seçmek istemiyorum</option>{rejectionReasons.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label className="block text-sm font-medium">Not ekle (isteğe bağlı)<textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} rows={3} className="mt-2 w-full rounded-xl border border-[#d2d2d7] px-3 py-2" /></label></div>}{error && <p role="alert" className="mt-4 text-sm text-[#ae4439]">{error}<button type="button" onClick={() => window.location.reload()} className="ml-2 min-h-11 underline">Güncel Durumu Aç</button></p>}<div className="mt-6 grid gap-2"><button type="button" disabled={busy} onClick={submit} className="min-h-[52px] rounded-[13px] bg-[#1D1D1F] px-5 text-sm font-semibold text-white disabled:opacity-60">{busy ? "Kaydediliyor..." : modal === "accept" ? "Evet, Teklifi Kabul Et" : "Teklifi Reddet"}</button><button type="button" disabled={busy} onClick={() => setModal(null)} className="min-h-12 rounded-[13px] text-sm font-medium">Vazgeç</button></div></Dialog>}
  </section>;
}
