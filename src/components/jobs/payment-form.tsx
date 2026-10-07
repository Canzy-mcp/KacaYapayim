"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { savePayment, deletePayment } from "@/app/actions/payments";
import { Button, Input, Select } from "@/components/ui";
import { formatMoney } from "@/lib/costs/format";
type Payment = { id: string; amount: number; paid_at: string; method: string; note: string };
export function PaymentForm({ jobId, agreed, payments, hasMore, total }: { jobId: string; agreed: number | null; payments: Payment[]; hasMore: boolean; total: number }) {
  const requestId=useRef(""); const router = useRouter(); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  return <section className="mt-6 rounded-2xl border border-[#dedee3] bg-white p-5">
    <h2 className="text-xl font-semibold">Tahsilat takibi</h2><p className="mt-2 text-sm text-[#6e6e73]">Aldığın ödemeleri elle kaydet. Burada para transferi yapılmaz.</p>
    <div className="my-5 grid gap-3 sm:grid-cols-3"><p>Tahsilat <strong className="block">{formatMoney(total)}</strong></p><p>Anlaşılan tutar <strong className="block">{agreed === null ? "Kabul edilmiş teklif yok" : formatMoney(agreed)}</strong></p><p>{agreed !== null && total > agreed ? "Fazla ödeme" : "Kalan bakiye"}<strong className="block">{agreed === null ? "—" : formatMoney(Math.abs(agreed - total))}</strong></p></div>
    {hasMore && <p role="status">Son 100 ödeme gösteriliyor. Toplam tüm ödemeleri kapsar. <a href="/settings#export" className="text-[#0071e3]">Tümünü dışa aktar</a></p>}
    <form className="space-y-4" onSubmit={async e => { e.preventDefault(); if (busy) return; const formElement=e.currentTarget; const form=new FormData(formElement);form.set("jobId", jobId);if(!requestId.current)requestId.current=crypto.randomUUID();form.set("requestId",requestId.current);setBusy(true);try{const r=await savePayment(form);setMessage(r.ok?"Ödeme kaydedildi.":r.error||"Kaydedilemedi.");if(r.ok){requestId.current="";formElement.reset();router.refresh();}}catch{setMessage("Bağlantı kurulamadı.");}finally{setBusy(false);}}}>
      <div className="grid gap-4 sm:grid-cols-3"><Input id={`payment-amount-${jobId}`} name="amount" label="Tutar (TL)" inputMode="decimal" placeholder="1.250,00" required maxLength={20}/><Input id={`payment-date-${jobId}`} name="paidAt" label="Ödeme tarihi" type="date" required defaultValue={new Date().toLocaleDateString("sv-SE",{timeZone:"Europe/Istanbul"})}/><Select id={`payment-method-${jobId}`} name="method" label="Yöntem"><option value="cash">Nakit</option><option value="bank">Banka</option><option value="other">Diğer</option></Select></div>
      <Input id={`payment-note-${jobId}`} name="note" label="Not (isteğe bağlı)" maxLength={500}/><Button disabled={busy}>Ödeme kaydet</Button>
    </form>
    {message&&<p role="status" className="mt-3 text-sm">{message}</p>}
    <ul className="mt-5 divide-y divide-[#dedee3]">{payments.map(p=><li key={p.id} className="flex items-center justify-between gap-3 py-3"><p className="text-sm">{p.paid_at} · {formatMoney(p.amount)} · {({cash:"Nakit",bank:"Banka",other:"Diğer"} as Record<string,string>)[p.method]}{p.note&&<span className="block text-[#6e6e73]">{p.note}</span>}</p><button type="button" disabled={busy} className="min-h-11 px-3 text-sm text-[#b42318]" onClick={async()=>{if(!window.confirm("Bu ödeme kaydını silmek istiyor musun?"))return;setBusy(true);try{const r=await deletePayment(p.id,jobId);setMessage(r.ok?"Ödeme silindi.":"Silinemedi.");router.refresh();}catch{setMessage("Bağlantı kurulamadı.");}finally{setBusy(false);}}}>Sil</button></li>)}</ul>
  </section>;
}
