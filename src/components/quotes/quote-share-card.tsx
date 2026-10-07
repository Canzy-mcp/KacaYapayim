"use client";

import { AccessCodeSettings } from "./access-code-settings";
import { useEffect, useState } from "react";
import { AlertCircle, Check, Copy, Download, ExternalLink, Share2 } from "lucide-react";
import { markQuoteSent, manageQuoteLink } from "@/app/actions/quote-sharing";
import { buildWhatsAppQuoteMessage, buildWhatsAppUrl } from "@/lib/quotes/share";

type Props = { id: string; token: string; quoteNumber: string; businessName: string; customerName: string | null; customerPhone: string | null; disabled?: boolean };

export function QuoteShareCard({ id, token, quoteNumber, businessName, customerName, customerPhone, disabled = false }: Props) {
  const [feedback, setFeedback] = useState("");
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [revoked, setRevoked] = useState(disabled);
  const [url, setUrl] = useState(`/t/${token}`);
  const [canNativeShare, setCanNativeShare] = useState(false);
  useEffect(() => { setUrl(`${window.location.origin}/t/${token}`); setCanNativeShare(typeof navigator.share === "function"); }, [token]);
  const sent = async () => {
    setBusy(true); setFailed(false);
    try { const result = await markQuoteSent(id); setFailed(!result.ok); setFeedback(result.ok ? "Gönderdiğin teklif işaretlendi. Teslim bilgisi doğrulanmaz." : result.error || "Paylaşım durumu kaydedilemedi."); }
    catch { setFailed(true); setFeedback("Durum kaydedilemedi. Tekrar dene."); }
    finally { setBusy(false); }
  };
  const copy = async () => {
    setBusy(true); setFailed(false);
    try { await navigator.clipboard.writeText(url); setFeedback("Teklif linki kopyalandı. Gönderim durumu değiştirilmedi."); }
    catch { setFailed(true); setFeedback("Link kopyalanamadı. Tekrar deneyin."); }
    finally { setBusy(false); }
  };
  const whatsapp = () => {
    setFailed(false);
    const message = buildWhatsAppQuoteMessage({ customerName, businessName, quoteNumber, publicUrl: url });
    const opened = window.open(buildWhatsAppUrl(message, customerPhone), "_blank");
    if (!opened) { setFailed(true); setFeedback("WhatsApp açılamadı. Linki kopyalayabilirsiniz."); return; }
    opened.opener = null;
    setFeedback("WhatsApp paylaşım ekranı açıldı.");
  };
  const nativeShare = async () => {
    setFailed(false);
    try {
      await navigator.share({ title: `${businessName} — Teklif ${quoteNumber}`, text: "Teklifinizi aşağıdaki bağlantıdan inceleyebilirsiniz.", url });
      setFeedback("Paylaşım ekranı tamamlandı. Mesajın teslim bilgisi doğrulanmaz.");
    } catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) { setFailed(true); setFeedback("Paylaşım açılamadı. Linki kopyalayabilirsiniz."); } }
  };
  const button = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#dedee3] bg-white px-4 text-[13px] font-medium transition hover:bg-[#f5f5f7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071E3]";
  async function manage(action: "rotate" | "revoke") {
    if (!window.confirm(action === "revoke" ? "Bu teklifin bağlantısı kapatılsın mı?" : "Eski bağlantı geçersiz olacak. Yeni bağlantı oluşturulsun mu?")) return;
    setBusy(true);setFailed(false);
    try { const r=await manageQuoteLink(id,action);if(!r.ok||!r.token){setFailed(true);setFeedback(r.error||"Bağlantı değiştirilemedi.");return;}
      setRevoked(action==="revoke");setUrl(`${window.location.origin}/t/${r.token}`);setFeedback(action==="revoke"?"Bağlantı kapatıldı. Tekrar paylaşmak için yeni bağlantı oluştur.":"Yeni bağlantı hazır. Daha önce gönderdiğin bağlantılar geçersiz.");
    } catch { setFailed(true);setFeedback("Bağlantı değiştirilemedi."); }finally{setBusy(false);}
  }
  return <div><p className="text-xs font-medium text-[#6E6E73]">Teklif bağlantısı</p><p className="mt-2 truncate rounded-xl bg-[#f5f5f7] px-3 py-3 text-[13px] text-[#4d4d52]" title={url}>{url}</p>
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      <button type="button" onClick={whatsapp} disabled={busy || revoked} className={button}><Share2 size={16} />WhatsApp&apos;ta Paylaş</button>
      <button type="button" onClick={copy} disabled={busy || revoked} className={button}><Copy size={16} />Linki Kopyala</button>
      <a href={`/api/quotes/${id}/pdf`} className={button}><Download size={16} />PDF İndir</a>
      <a href={`/quotes/${id}/preview`} target="_blank" rel="noopener noreferrer" className={button}><ExternalLink size={16} />Müşteri Görünümü</a>
      {canNativeShare && <button type="button" onClick={nativeShare} disabled={busy || revoked} className={button}><Share2 size={16} />Paylaş</button>}
      <button type="button" disabled={busy} onClick={sent} className={button}><Check size={16} />Gönderdim, İşaretle</button>
      <button type="button" disabled={busy} onClick={()=>manage("rotate")} className={button}>Yeni bağlantı oluştur</button>
      <button type="button" disabled={busy || revoked} onClick={()=>manage("revoke")} className={button}>Bağlantıyı kapat</button>
    </div>
    <AccessCodeSettings id={id}/>
    {feedback && <p role={failed ? "alert" : "status"} className={`mt-3 flex items-center gap-2 text-[13px] ${failed ? "text-[#b3382f]" : "text-[#247344]"}`}>{failed ? <AlertCircle size={15} /> : <Check size={15} />}{feedback}</p>}
  </div>;
}
