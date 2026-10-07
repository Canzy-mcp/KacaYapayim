"use client";
import { taxLabels, type TaxMode } from "@/lib/quotes/tax";
import { TemplateTools } from "./template-tools";
import { Dialog } from "@/components/ui/dialog";
import { parsePrice } from "@/lib/money";


import { useDraft } from "@/components/draft-provider";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowLeft, ArrowUp, Eye, Plus, Trash2, X } from "lucide-react";
import { saveQuote } from "@/app/actions/quotes";
import { QuotePreview } from "@/components/quotes/quote-preview";
import { Button, Card } from "@/components/ui";
import { UpgradeModal } from "@/components/billing/upgrade-modal";
import { formatMoney, formatPercent } from "@/lib/costs/format";
import { addDaysToDateKey, dateInIstanbul, paymentPresets, suggestedExclusions, suggestedPainterScope,
  type ScopeDraft } from "@/lib/quotes/defaults";
import { calculatePricingSummary } from "@/lib/pricing/engine";
import type { CustomerQuotePreview } from "@/lib/quotes/public-preview";
import type { Business, Customer, Job, PainterJobDetail, Quote, QuoteExclusion, QuoteItem } from "@/types/database";

type Props = { job: Job; details: PainterJobDetail | null; customer: Customer | null; business: Business;
  today: string; quote?: Quote | null; savedItems?: QuoteItem[]; savedExclusions?: QuoteExclusion[]; showBranding?: boolean; showLogo?: boolean };
const inputClass = "mt-2 min-h-12 w-full rounded-[13px] border border-[#d5d5da] bg-white px-4 text-[15px] outline-none focus:border-[#0071E3] focus:ring-3 focus:ring-[#0071E3]/15";
const labelClass = "block text-[14px] font-medium";

function BlockHeading({ number, title, hint }: { number: string; title: string; hint?: string }) {
  return <div className="mb-5"><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0071E3]">{number}</p><h2 className="mt-1 text-[20px] font-semibold tracking-[-0.035em]">{title}</h2>{hint && <p className="mt-1 text-[13px] leading-5 text-[#6E6E73]">{hint}</p>}</div>;
}

export function QuoteForm({ job, details, customer, business, today, quote, savedItems = [], savedExclusions = [], showBranding = true, showLogo = false }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(quote?.title ?? job.title);
  const [description, setDescription] = useState(quote?.description ?? job.description ?? "");
  const genericScope = Array.isArray(job.calculation_snapshot?.quoteScope) ? job.calculation_snapshot.quoteScope as ScopeDraft[] : [];
  const genericExclusions = Array.isArray(job.calculation_snapshot?.quoteExclusions) ? job.calculation_snapshot.quoteExclusions as string[] : [];
  const [items, setItems] = useState<ScopeDraft[]>(quote ? savedItems.map(({ name, description }) => ({ name, description: description || "" })) : details ? suggestedPainterScope(details) : genericScope);
  const [exclusions, setExclusions] = useState<string[]>(quote ? savedExclusions.map(({ text }) => text) : details ? [...suggestedExclusions] : genericExclusions);
  const [duration, setDuration] = useState(quote?.estimated_duration_text ?? (details ? `${details.days} iş günü` : typeof job.input_data.days === "number" ? `${job.input_data.days} iş günü` : ""));
  const [payment, setPayment] = useState(quote?.payment_terms ?? paymentPresets[0].value);
  const [validUntil, setValidUntil] = useState(quote?.valid_until ?? addDaysToDateKey(today, 7));
  const [notes, setNotes] = useState(quote?.notes ?? "");
  const [priceText, setPriceText] = useState(String(quote?.sale_price ?? job.selected_sale_price ?? ""));
  const [taxRateText,setTaxRateText]=useState(quote?.tax_rate!=null?String(quote.tax_rate):"");
  const taxRate=taxRateText.trim()===""?null:parsePrice(taxRateText);
  const [taxMode, setTaxMode] = useState<TaxMode>(quote?.tax_mode ?? "unspecified");
  const [priceOpen, setPriceOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const savingRef = useRef(false);
  const [error, setError] = useState("");
  const [needsUpgrade, setNeedsUpgrade] = useState(false);
  const [confirm, setConfirm] = useState<"draft" | "ready" | null>(null);
  const draft = useDraft('quote:' + (quote?.id ?? job.id), { title, description, items, exclusions, duration, payment, validUntil, notes, priceText, taxMode,taxRateText }, saved => {
    if (typeof saved.title !== 'string' || !Array.isArray(saved.items) || !Array.isArray(saved.exclusions)) return;
    setTitle(saved.title); setDescription(saved.description); setItems(saved.items); setExclusions(saved.exclusions);
    setDuration(saved.duration); setPayment(saved.payment); setValidUntil(saved.validUntil); setNotes(saved.notes); setPriceText(saved.priceText); setTaxMode(saved.taxMode ?? "unspecified");setTaxRateText(saved.taxRateText??"");
  });
  const salePrice = quote ? parsePrice(priceText) : job.selected_sale_price;
  const cost = quote?.estimated_cost_snapshot ?? job.estimated_cost;
  const target = quote?.target_margin_snapshot ?? job.target_profit_margin ?? business.default_profit_margin;
  const minimum = quote?.minimum_margin_snapshot ?? job.minimum_profit_margin ?? business.minimum_profit_margin;
  const pricing = useMemo(() => {
    if (salePrice === null || cost <= 0) return null;
    try { return calculatePricingSummary(cost, Math.max(target, 1), Math.min(minimum, 89), salePrice); } catch { return null; }
  }, [salePrice, cost, target, minimum]);
  const publicPreview: CustomerQuotePreview = {
    business: { name: business.name, logoUrl: showLogo ? business.logo_url : null, phone: business.phone, city: business.city },
    customer: customer ? { name: customer.name, companyName: customer.company_name } : null,
    quoteNumber: quote?.quote_number ?? "Kaydedince atanacak", date: quote ? dateInIstanbul(quote.created_at) : today,
    validUntil, title, description: description.trim() || null,
    items: items.filter((item) => item.name.trim()).map((item) => ({ name: item.name, description: item.description.trim() || null })),
    exclusions: exclusions.filter((item) => item.trim()), estimatedDuration: duration.trim() || null,
    salePrice: salePrice ?? 0, currency: quote?.currency ?? job.currency,
    taxMode,taxRate, paymentTerms: payment.trim() || null, notes: notes.trim() || null, showBranding,
  };

  function updateItem(index: number, field: keyof ScopeDraft, value: string) {
    setItems((old) => old.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item)); setError("");
  }
  function moveItem(index: number, direction: -1 | 1) {
    const next = [...items]; const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= next.length) return;
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]]; setItems(next);
  }
  async function persist(status: "draft" | "ready", acknowledged = false) {
    if (savingRef.current) return;
    if (!title.trim()) { setError("Teklif başlığını gir."); return; }
    if (!items.length || items.some((item) => !item.name.trim())) { setError("En az bir kapsam maddesi ekle ve boş maddeleri doldur."); return; }
    if (exclusions.some((item) => !item.trim())) { setError("Boş hariç tutulan işi sil veya doldur."); return; }
    if (!validUntil || validUntil < today) { setError("Geçerlilik tarihi geçmiş bir tarih olamaz."); return; }
    if(taxMode!=="unspecified"&&(taxRate===null||taxRate>100)){setError("0–100 arasında KDV oranı gir. Fiyat alanı vergisiz tutardır.");return;}
    if (salePrice === null) { setError("Teklif fiyatı bulunamadı."); return; }
    if (status === "ready" && !customer) { setError("Teklifi hazırlamak için önce bir müşteri seç."); return; }
    if (status === "ready" && salePrice <= 0) { setError("Hazır teklif için sıfırdan büyük bir fiyat gir."); return; }
    if (status === "ready" && quote && pricing && ["loss", "below_minimum"].includes(pricing.status) && !acknowledged) {
      setConfirm(status); return;
    }
    savingRef.current = true; setPending(true); setError(""); setNeedsUpgrade(false);
    try {
      const result = await saveQuote({ quoteId: quote?.id ?? null, jobId: job.id, status, title, description,
        items, exclusions, duration, paymentTerms: payment, validUntil, notes,
        salePrice: quote ? salePrice : null, acknowledgeRisk: acknowledged, taxMode,taxRate });
      if (!result.ok) { if (result.needsConfirmation) setConfirm(status); else { setError(result.error); setNeedsUpgrade(Boolean(result.needsUpgrade)); } return; }
      draft.clear(); setConfirm(null); router.push(`/quotes/${result.id}`); router.refresh();
    } catch { setError(quote ? "Teklif kaydedilemedi." : "Teklif oluşturulamadı."); }
    finally { savingRef.current = false; setPending(false); }
  }

  return <div className="mx-auto max-w-[1400px]"><Link href={quote ? `/quotes/${quote.id}` : `/jobs/${job.id}`} className="mb-5 inline-flex min-h-10 items-center gap-2 text-[13px] font-medium text-[#6E6E73] hover:text-[#1D1D1F]"><ArrowLeft size={16} />{quote ? "Teklife Dön" : "İşe Dön"}</Link>
    {draft.notice && <p role="status" className="mb-4 text-sm text-[#0071E3]">{draft.notice}</p>}
    <div className="mb-7"><p className="text-[12px] font-semibold text-[#0071E3]">Maliyet ✓ &nbsp; Fiyat ✓ &nbsp; Teklif</p><h1 className="mt-2 text-[34px] font-semibold tracking-[-0.055em] sm:text-[42px]">Teklifini hazırla.</h1><p className="mt-2 text-[15px] leading-6 text-[#6E6E73]">Müşterine göndermeden önce kapsamı ve koşulları kontrol et.</p></div>
    <TemplateTools content={{title,description,items,exclusions,duration,payment,notes,taxMode}} onApply={s=>{setTitle(s.title);setDescription(s.description);setItems(s.items);setExclusions(s.exclusions);setDuration(s.duration);setPayment(s.payment);setNotes(s.notes);setTaxMode(s.taxMode);}} />
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(390px,0.92fr)] xl:items-start"><div className="space-y-5">
      <Card className="p-5 sm:p-7"><BlockHeading number="01 / Temel bilgiler" title="Bu teklif kimin için?" /><div className="grid gap-4 sm:grid-cols-2"><div><p className="text-[12px] text-[#6E6E73]">Müşteri</p><p className="mt-1 text-[15px] font-semibold">{customer?.name || "Müşteri seçilmedi"}</p>{!customer && <Link href={`/new-quote?job_id=${job.id}&step=customer`} className="mt-2 inline-block text-[13px] font-semibold text-[#0071E3] hover:underline">Müşteri Seç</Link>}</div><div><p className="text-[12px] text-[#6E6E73]">İş</p><p className="mt-1 text-[15px] font-semibold">{job.title}</p></div></div>{!customer && <p className="mt-4 rounded-xl bg-[#fff8e8] px-4 py-3 text-[13px] text-[#815d16]">Müşteri olmadan taslak kaydedebilirsin. Teklifi hazır hale getirmek için müşteri seç.</p>}<label className="mt-5 block text-sm font-medium">Teklif tutarında KDV<select value={taxMode} onChange={e=>setTaxMode(e.target.value as TaxMode)} className={inputClass}>{Object.entries(taxLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select><span className="mt-2 block text-xs font-normal text-[#6E6E73]">Fiyat alanı vergisiz tutardır. Seçtiğin oran müşteri toplamına eklenir; kâr hesabında vergi gelir sayılmaz.</span></label>{taxMode!=="unspecified"&&<label className="mt-4 block text-sm">KDV oranı (%)<input required inputMode="decimal" value={taxRateText} onChange={e=>setTaxRateText(e.target.value)} className={inputClass}/></label>}<div className="mt-5 space-y-4 border-t border-[#ececf0] pt-5"><label className={labelClass}>Teklif başlığı<input value={title} onChange={(e) => { setTitle(e.target.value); setError(""); }} maxLength={160} className={inputClass} /></label><label className={labelClass}>Teklif açıklaması <span className="font-normal text-[#62626a]">(isteğe bağlı)</span><textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} rows={3} className={`${inputClass} py-3`} /></label></div></Card>
      <Card className="p-5 sm:p-7"><BlockHeading number="02 / Kapsam" title="Teklife dahil" hint="Müşterinin göreceği işleri kendi dilinle düzenle." /><div className="space-y-3">{items.map((item, index) => <div key={index} className="rounded-[14px] border border-[#e5e5e9] bg-[#fcfcfd] p-4"><div className="flex gap-2"><div className="min-w-0 flex-1"><label className="sr-only" htmlFor={`item-${index}`}>Kapsam maddesi {index + 1}</label><input id={`item-${index}`} value={item.name} onChange={(e) => updateItem(index, "name", e.target.value)} maxLength={160} placeholder="Dahil olan iş" className="w-full bg-transparent text-[14px] font-semibold outline-none placeholder:text-[#9b9ba1]" /></div><div className="flex shrink-0 gap-1"><button type="button" onClick={() => moveItem(index, -1)} disabled={index === 0} aria-label="Yukarı taşı" className="flex size-11 items-center justify-center rounded-lg text-[#6E6E73] hover:bg-[#f0f0f2] disabled:opacity-30"><ArrowUp size={16} /></button><button type="button" onClick={() => moveItem(index, 1)} disabled={index === items.length - 1} aria-label="Aşağı taşı" className="flex size-11 items-center justify-center rounded-lg text-[#6E6E73] hover:bg-[#f0f0f2] disabled:opacity-30"><ArrowDown size={16} /></button><button type="button" onClick={() => setItems((old) => old.filter((_, i) => i !== index))} aria-label="Kapsam maddesini sil" className="flex size-11 items-center justify-center rounded-lg text-[#b3382f] hover:bg-[#fff0ef]"><Trash2 size={16} /></button></div></div><input value={item.description} onChange={(e) => updateItem(index, "description", e.target.value)} maxLength={1000} placeholder="Kısa açıklama (isteğe bağlı)" className="mt-2 w-full bg-transparent text-[13px] text-[#6E6E73] outline-none placeholder:text-[#a0a0a7]" /></div>)}</div><Button type="button" variant="secondary" onClick={() => setItems((old) => [...old, { name: "", description: "" }])} className="mt-4"><Plus size={16} />Kapsam Ekle</Button></Card>
      <Card className="p-5 sm:p-7"><BlockHeading number="03 / Sınırlar" title="Teklife dahil değil" hint="Bu listeyi düzenleyebilir veya tamamen boş bırakabilirsin." /><div className="space-y-3">{exclusions.map((item, index) => <div key={index} className="flex items-center gap-2 rounded-[13px] border border-[#e5e5e9] bg-[#fcfcfd] px-4"><input aria-label={`Hariç tutulan iş ${index + 1}`} value={item} onChange={(e) => setExclusions((old) => old.map((text, i) => i === index ? e.target.value : text))} maxLength={500} className="min-h-12 min-w-0 flex-1 bg-transparent text-[14px] outline-none" /><button type="button" onClick={() => setExclusions((old) => old.filter((_, i) => i !== index))} aria-label="Hariç tutulan işi sil" className="flex size-11 items-center justify-center rounded-lg text-[#b3382f] hover:bg-[#fff0ef]"><Trash2 size={16} /></button></div>)}</div><Button type="button" variant="secondary" onClick={() => setExclusions((old) => [...old, ""])} className="mt-4"><Plus size={16} />Hariç İş Ekle</Button></Card>
      <Card className="p-5 sm:p-7"><BlockHeading number="04 / Koşullar" title="Süre ve ödeme" /><div className="space-y-5"><label className={labelClass}>Tahmini iş süresi<input value={duration} onChange={(e) => setDuration(e.target.value)} maxLength={160} placeholder="3–4 iş günü" className={inputClass} /></label><div><label htmlFor="payment-preset" className={labelClass}>Ödeme koşulları</label><select id="payment-preset" value={paymentPresets.find((preset) => preset.value === payment)?.value || "custom"} onChange={(e) => setPayment(e.target.value === "custom" ? "" : e.target.value)} className={inputClass}>{paymentPresets.map((preset) => <option key={preset.value} value={preset.value}>{preset.label}</option>)}<option value="custom">Özel</option></select><textarea aria-label="Ödeme koşulları metni" value={payment} onChange={(e) => setPayment(e.target.value)} maxLength={1000} rows={2} placeholder="Ödeme koşullarını yaz" className={`${inputClass} py-3`} /></div><div><label htmlFor="validity" className={labelClass}>Teklif geçerliliği</label><select id="validity" value={[3,7,14,30].find((days) => addDaysToDateKey(today, days) === validUntil) || "custom"} onChange={(e) => { if (e.target.value !== "custom") setValidUntil(addDaysToDateKey(today, Number(e.target.value))); }} className={inputClass}>{[3,7,14,30].map((days) => <option key={days} value={days}>{days} gün</option>)}<option value="custom">Özel tarih</option></select><input aria-label="Geçerlilik tarihi" type="date" value={validUntil} min={today} onChange={(e) => setValidUntil(e.target.value)} className={inputClass} /></div><label className={labelClass}>Müşteriye not <span className="font-normal text-[#62626a]">(isteğe bağlı)</span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} rows={3} placeholder="Örneğin: Renk seçimi müşteri tarafından yapılacaktır." className={`${inputClass} py-3`} /></label></div></Card>
      {quote && <Card className="p-5 sm:p-7"><BlockHeading number="05 / Fiyat" title="Teklif fiyatı" hint="Buradaki değişiklik işin ana fiyatını etkilemez." /><p className="text-[28px] font-semibold tabular-nums">{formatMoney(salePrice ?? quote.sale_price)}</p><button type="button" onClick={() => setPriceOpen(!priceOpen)} className="mt-3 text-[13px] font-semibold text-[#0071E3] hover:underline">Fiyatı Düzenle</button>{priceOpen && <div className="mt-4"><label className={labelClass}>Vergisiz teklif fiyatı (TL)<input inputMode="decimal" value={priceText} onChange={(e) => setPriceText(e.target.value)} className={inputClass} /></label>{pricing && <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl bg-[#f7f7f9] p-4 text-[13px]"><div><p className="text-[#6E6E73]">Tahmini kâr</p><p className="mt-1 font-semibold">{formatMoney(pricing.profit)}</p></div><div><p className="text-[#6E6E73]">Kâr marjı</p><p className="mt-1 font-semibold">{formatPercent(pricing.profitMargin)}</p></div><p className={`col-span-2 font-medium ${["loss","below_minimum"].includes(pricing.status) ? "text-[#b3382f]" : pricing.status === "acceptable" ? "text-[#8a5a06]" : "text-[#247344]"}`}>{pricing.status === "loss" ? "Zarar" : pricing.status === "below_minimum" ? "Minimum marjın altında" : pricing.status === "acceptable" ? "Hedefin altında, minimumun üstünde" : "Hedefte"}</p></div>}{salePrice === null && <p role="alert" className="mt-2 text-[12px] text-[#b3382f]">Geçerli bir fiyat gir.</p>}</div>}</Card>}
      <Card className="p-5 sm:p-6"><p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#6E6E73]">Yalnızca sana görünen özet</p><div className="mt-4 grid grid-cols-2 gap-4 text-[13px] sm:grid-cols-4"><div><p className="text-[#6E6E73]">Maliyet</p><p className="mt-1 font-semibold">{formatMoney(cost)}</p></div><div><p className="text-[#6E6E73]">Teklif</p><p className="mt-1 font-semibold">{formatMoney(salePrice ?? 0)}</p></div><div><p className="text-[#6E6E73]">Kâr</p><p className="mt-1 font-semibold">{pricing ? formatMoney(pricing.profit) : "—"}</p></div><div><p className="text-[#6E6E73]">Marj</p><p className="mt-1 font-semibold">{formatPercent(pricing?.profitMargin ?? null)}</p></div></div></Card>
      {error && <p role="alert" className="rounded-[13px] border border-[#f0cac6] bg-[#fff4f2] px-4 py-3 text-[13px] text-[#b3382f]">{error}{needsUpgrade && <Link href="/billing" className="ml-2 font-semibold underline">Paketleri Gör</Link>}</p>}
      <div className="sticky bottom-[calc(80px+env(safe-area-inset-bottom))] z-10 flex flex-wrap gap-2 border-t border-[#e5e5e9] bg-[#F5F5F7]/95 py-3 backdrop-blur-md lg:bottom-0"><Button type="button" variant="secondary" onClick={() => setPreviewOpen(true)} className="min-h-12 flex-1 xl:hidden"><Eye size={17} />Önizleme</Button><Button type="button" variant="secondary" onClick={() => persist("draft")} disabled={pending} className="min-h-12 flex-1">{pending ? "Kaydediliyor..." : "Taslak Kaydet"}</Button><Button type="button" onClick={() => persist("ready")} disabled={pending} className="min-h-12 flex-[1.5]">{pending ? "Hazırlanıyor..." : "Teklifi Hazırla"}</Button></div>
    </div><aside className="hidden xl:block xl:sticky xl:top-6"><div className="mb-3 flex items-center justify-between"><h2 className="text-[14px] font-semibold">Teklif Önizleme</h2><span className="text-[12px] text-[#62626a]">Müşterinin göreceği belge</span></div><QuotePreview quote={publicPreview} /></aside></div>
    {previewOpen && <Dialog title="Teklif Önizleme" className="max-w-3xl" onClose={() => setPreviewOpen(false)} busy={pending}><QuotePreview quote={publicPreview} /><div className="mt-5 flex gap-2"><Button variant="secondary" onClick={() => setPreviewOpen(false)} className="flex-1">Düzenle</Button><Button onClick={() => persist("ready")} disabled={pending} className="flex-[2]">{pending ? "Hazırlanıyor..." : "Teklifi Hazırla"}</Button></div></Dialog>}
    {confirm && pricing && <Dialog title={pricing.status === "loss" ? "Bu fiyatla zarar ediyorsun." : "Fiyat minimum kâr hedefinin altında."} onClose={() => setConfirm(null)} busy={pending}><div className="mt-5 space-y-2 text-[14px]"><p>Maliyet: {formatMoney(cost)}</p><p>Teklif: {formatMoney(pricing.selectedPrice)}</p><p>Kâr: {formatMoney(pricing.profit)}</p><p>Marj: {formatPercent(pricing.profitMargin)}</p></div><div className="mt-6 flex gap-2"><Button variant="secondary" onClick={() => setConfirm(null)} disabled={pending} className="flex-1">Fiyatı Düzenle</Button><Button onClick={() => persist(confirm, true)} disabled={pending} className="flex-1">{pending ? "Kaydediliyor..." : "Yine de Devam Et"}</Button></div></Dialog>}
    {needsUpgrade && <UpgradeModal title="Bu ayki teklif limitine ulaştın." description="Ücretsiz planda ayda 5 teklif oluşturabilirsin. Mevcut tekliflerin açık kalır; yeni teklifler için Usta paketini inceleyebilirsin." onClose={() => setNeedsUpgrade(false)} />}
  </div>;
}
