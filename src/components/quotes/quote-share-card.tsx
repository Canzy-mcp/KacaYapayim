"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Download, ExternalLink, Share2 } from "lucide-react";
import { markQuoteSent } from "@/app/actions/quote-sharing";
import { buildWhatsAppQuoteMessage, buildWhatsAppUrl } from "@/lib/quotes/share";

type Props = { id: string; token: string; quoteNumber: string; businessName: string; customerName: string | null; customerPhone: string | null };

export function QuoteShareCard({ id, token, quoteNumber, businessName, customerName, customerPhone }: Props) {
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState(`/t/${token}`);
  const [canNativeShare, setCanNativeShare] = useState(false);
  useEffect(() => { setUrl(`${window.location.origin}/t/${token}`); setCanNativeShare(typeof navigator.share === "function"); }, [token]);
  const sent = async () => {
    const result = await markQuoteSent(id);
    if (!result.ok) setFeedback(result.error || "Paylaşım durumu kaydedilemedi.");
  };
  const copy = async () => {
    setBusy(true);
    try { await navigator.clipboard.writeText(url); setFeedback("Teklif linki kopyalandı."); await sent(); }
    catch { setFeedback("Link kopyalanamadı. Tekrar deneyin."); }
    finally { setBusy(false); }
  };
  const whatsapp = () => {
    const message = buildWhatsAppQuoteMessage({ customerName, businessName, quoteNumber, publicUrl: url });
    const opened = window.open(buildWhatsAppUrl(message, customerPhone), "_blank");
    if (!opened) { setFeedback("WhatsApp açılamadı. Linki kopyalayabilirsiniz."); return; }
    opened.opener = null;
    setFeedback("WhatsApp paylaşım ekranı açıldı.");
    void sent();
  };
  const nativeShare = async () => {
    try {
      await navigator.share({ title: `${businessName} — Teklif ${quoteNumber}`, text: "Teklifinizi aşağıdaki bağlantıdan inceleyebilirsiniz.", url });
      setFeedback("Paylaşım başlatıldı."); await sent();
    } catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) setFeedback("Paylaşım açılamadı. Linki kopyalayabilirsiniz."); }
  };
  const button = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#dedee3] bg-white px-4 text-[13px] font-medium transition hover:bg-[#f5f5f7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071E3]";
  return <div><p className="text-xs font-medium text-[#6E6E73]">Teklif bağlantısı</p><p className="mt-2 truncate rounded-xl bg-[#f5f5f7] px-3 py-3 text-[13px] text-[#4d4d52]" title={url}>{url}</p>
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      <button type="button" onClick={whatsapp} className={button}><Share2 size={16} />WhatsApp&apos;ta Paylaş</button>
      <button type="button" onClick={copy} disabled={busy} className={button}><Copy size={16} />Linki Kopyala</button>
      <a href={`/api/quotes/${id}/pdf`} className={button}><Download size={16} />PDF İndir</a>
      <a href={`/quotes/${id}/preview`} target="_blank" rel="noopener noreferrer" className={button}><ExternalLink size={16} />Müşteri Görünümü</a>
      {canNativeShare && <button type="button" onClick={nativeShare} className={button}><Share2 size={16} />Paylaş</button>}
    </div>
    {feedback && <p role="status" className="mt-3 flex items-center gap-2 text-[13px] text-[#247344]"><Check size={15} />{feedback}</p>}
  </div>;
}
