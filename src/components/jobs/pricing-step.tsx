"use client";
import { Dialog } from "@/components/ui/dialog";
import { parsePrice } from "@/lib/money";


import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, ChevronDown, Pencil } from "lucide-react";
import { saveJobPricing } from "@/app/actions/pricing";
import { JobCostSummary } from "@/components/jobs/job-cost-summary";
import { Button, Card } from "@/components/ui";
import { formatMoney, formatPercent } from "@/lib/costs/format";
import { calculatePricingSummary, validateMargins, type PricingResult, type PricingStatus } from "@/lib/pricing/engine";
import type { PainterCalculation } from "@/lib/jobs/painter-calculation";
import type { Job } from "@/types/database";

const statusCopy: Record<PricingStatus, { title: string; detail: string; className: string }> = {
  target: { title: "Hedef kârını karşılıyor", detail: "Bu fiyat hedeflediğin kâr marjını sağlıyor.", className: "border-success-soft bg-success-soft text-success-ink" },
  acceptable: { title: "Hedefinin altındasın", detail: "Minimum kâr seviyesinin üzerindesin.", className: "border-warning-soft bg-warning-soft text-warning-ink" },
  below_minimum: { title: "Bu fiyat riskli", detail: "Minimum kâr hedefinin altına düşüyorsun.", className: "border-danger-200 bg-danger-soft text-danger-ink" },
  loss: { title: "Bu fiyatla zarar ediyorsun", detail: "Teklifin işin gerçek maliyetinden düşük.", className: "border-danger-200 bg-danger-soft text-danger-ink" },
};


function PricingFact({ label, value, prominent = false }: { label: string; value: string; prominent?: boolean }) {
  return <div><p className="text-[12px] text-muted">{label}</p><p className={`mt-1 font-semibold tabular-nums ${prominent ? "text-[23px] tracking-display" : "text-[16px]"}`}>{value}</p></div>;
}

export function PricingStep({ job, cost, customerName, calculation, onEdit, onBack }: {
  job: Job; cost: number; customerName: string; calculation?: PainterCalculation | null; onEdit: () => void; onBack: () => void;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const importedMargin = Number(params.get("target_margin"));
  const startingMargin = importedMargin >= 1 && importedMargin <= 90 ? importedMargin : job.target_profit_margin ?? 30;
  const [targetText, setTargetText] = useState(String(startingMargin));
  const [minimumText, setMinimumText] = useState(String(Math.min(startingMargin, job.minimum_profit_margin ?? 20)));
  const [marginOpen, setMarginOpen] = useState(false);
  const [discountText,setDiscountText]=useState("");
  const [priceText, setPriceText] = useState(String(job.selected_sale_price ?? job.recommended_sale_price ?? ""));
  const [priceTouched, setPriceTouched] = useState(job.selected_price_mode === "custom");
  const [confirm, setConfirm] = useState<"save" | "offer" | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const target = Number(targetText.replace(",", "."));
  const minimum = Number(minimumText.replace(",", "."));
  const marginsValid = validateMargins(target, minimum) && Math.abs(Math.round(target * 100) - target * 100) < 1e-6 && Math.abs(Math.round(minimum * 100) - minimum * 100) < 1e-6;
  const recommendation = useMemo(() => {
    if (!marginsValid || cost <= 0) return null;
    try { return calculatePricingSummary(cost, target, minimum); } catch { return null; }
  }, [cost, target, minimum, marginsValid]);
  const enteredPrice = priceTouched ? parsePrice(priceText) : recommendation?.roundedRecommendedPrice ?? null;
  const summary: PricingResult | null = useMemo(() => {
    if (!recommendation || enteredPrice === null) return null;
    try { return calculatePricingSummary(cost, target, minimum, enteredPrice); } catch { return null; }
  }, [recommendation, enteredPrice, cost, target, minimum]);

  async function persist(destination: "save" | "offer", acknowledged = false) {
    if (!summary) { setError("Fiyat ve kâr marjlarını kontrol et."); return; }
    if (["loss", "below_minimum"].includes(summary.status) && !acknowledged) { setConfirm(destination); return; }
    setPending(true); setError("");
    try {
      const result = await saveJobPricing({ jobId: job.id, targetMargin: target, minimumMargin: minimum,
        selectedPrice: summary.selectedPrice, acknowledgeRisk: acknowledged });
      if (!result.ok) {
        if (result.needsConfirmation) setConfirm(destination);
        else setError(result.error);
        return;
      }
      setConfirm(null);
      router.push(destination === "offer" ? `/quotes/new?job_id=${job.id}` : `/jobs/${job.id}?priced=1`);
      router.refresh();
    } catch { setError("Fiyat bilgileri kaydedilemedi."); }
    finally { setPending(false); }
  }

  if (cost <= 0) return <Card className="mt-8 p-7 text-center"><h2 className="text-[22px] font-semibold">Bu iş için maliyet hesaplanmamış.</h2><p className="mt-2 text-[14px] text-muted">Önce iş maliyetini hesaplamalısın.</p><Button onClick={onEdit} className="mt-5">Maliyeti Hesapla</Button></Card>;

  const shownPrice = summary ?? recommendation;
  return <section className="mt-8" aria-label="Fiyat hesabı"><div className="mb-5"><button type="button" onClick={onBack} className="mb-3 min-h-9 text-[13px] font-medium text-primary hover:underline">← Maliyete Dön</button><h2 className="text-[28px] font-semibold tracking-display">Kaça yapmalısın?</h2><p className="mt-1 text-[14px] text-muted">Fiyatı sen belirlersin. Biz kârını gösteririz.</p></div>
    {job.pricing_cost_changed && <div role="status" className="mb-5 rounded-xl border border-primary-200 bg-primary-soft px-4 py-3 text-[13px] leading-5 text-ink-2">{job.selected_price_mode === "custom" ? `Maliyet değişti. Eski teklif fiyatın korundu; güncel marjı ${formatPercent(summary?.profitMargin ?? null)}.` : "Maliyet değiştiği için önerilen fiyat ve seçtiğin teklif güncellendi."}</div>}
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(270px,0.9fr)] lg:items-start"><div className="space-y-5">
      <Card className="overflow-hidden p-6 sm:p-8"><p className="text-[13px] font-medium text-muted">Önerilen teklif fiyatı</p><p className="mt-2 break-words text-[clamp(2.5rem,8vw,4.3rem)] font-semibold leading-none tracking-[-0.07em] tabular-nums">{recommendation ? formatMoney(recommendation.roundedRecommendedPrice) : "—"}</p><p className="mt-3 text-[13px] text-muted">{formatPercent(recommendation?.profitMargin ?? null)} gerçek marj · {formatPercent(marginsValid ? target : null)} hedef</p>
        <div className="mt-7 grid grid-cols-2 gap-5 border-t border-line pt-5 sm:grid-cols-3"><PricingFact label="Gerçek maliyet" value={formatMoney(cost)} /><PricingFact label="Önerilen kâr" value={recommendation ? formatMoney(recommendation.profit) : "—"} /><PricingFact label="Minimum kabul fiyatın" value={recommendation ? formatMoney(recommendation.minimumPrice) : "—"} /></div>
        <p className="mt-4 text-[12px] leading-5 text-muted">Minimum fiyatın altında kâr marjın {formatPercent(marginsValid ? minimum : null)} seviyesinin altına düşer.</p>
        <button type="button" onClick={() => setMarginOpen((open) => !open)} aria-expanded={marginOpen} className="mt-5 inline-flex min-h-10 items-center gap-2 text-[13px] font-semibold text-primary hover:underline">Kâr hedefini değiştir <ChevronDown size={15} className={marginOpen ? "rotate-180" : ""} /></button>
        {marginOpen && <div className="mt-3 grid gap-4 rounded-xl bg-surface-2 p-4 sm:grid-cols-2"><label className="text-[13px] font-medium">Hedef marj (%)<input inputMode="decimal" value={targetText} onChange={(e) => { setTargetText(e.target.value); setError(""); }} className="mt-2 h-11 w-full rounded-xl border border-line-strong bg-white px-3 text-[16px] outline-none focus:border-primary" /></label><label className="text-[13px] font-medium">Minimum marj (%)<input inputMode="decimal" value={minimumText} onChange={(e) => { setMinimumText(e.target.value); setError(""); }} className="mt-2 h-11 w-full rounded-xl border border-line-strong bg-white px-3 text-[16px] outline-none focus:border-primary" /></label><p className="text-[12px] leading-5 text-muted sm:col-span-2">Bu oranlar yalnızca bu işe kaydedilir. Kâr marjı, satış fiyatının ne kadarının kâr olduğunu gösterir.</p>{!marginsValid && <p role="alert" className="text-[12px] text-danger-ink sm:col-span-2">Hedef %0–90 arasında ve sıfırdan büyük olmalı. Minimum %0–89 arasında ve hedeften yüksek olmamalı.</p>}</div>}
      </Card>
      <Card className="p-6 sm:p-8"><label htmlFor="sale-price" className="block text-[15px] font-semibold">Teklif fiyatın</label><p className="mt-1 text-[13px] text-muted">Fiyatı değiştir, kârını anında gör.</p><div className="mt-4 rounded-xl bg-canvas p-4"><label className="block text-sm">Önerilen fiyattan indirim (%)<input type="number" min="0" max="100" step="0.1" value={discountText} onChange={e=>{const text=e.target.value;setDiscountText(text);const percent=Number(text);if(text!==""&&percent>=0&&percent<=100&&recommendation){setPriceTouched(true);setPriceText(String(Math.round(recommendation.roundedRecommendedPrice*(1-percent/100)*100)/100));setError("");}}} className="mt-2 min-h-11 w-full rounded-xl border border-line bg-white px-3"/></label><p className="mt-2 text-xs text-muted">İndirim öncesi öneri: {recommendation?formatMoney(recommendation.roundedRecommendedPrice):"—"}. Son fiyatı ve kalan kârı aşağıdan kontrol et.</p></div><div className="mt-4 flex items-center rounded-[15px] border border-line-strong bg-white focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/15"><input id="sale-price" type="text" inputMode="decimal" value={priceTouched ? priceText : String(recommendation?.roundedRecommendedPrice ?? "")} onChange={(e) => { setPriceTouched(true); setPriceText(e.target.value); setError(""); }} onFocus={(e) => e.currentTarget.select()} className="h-[62px] min-w-0 flex-1 bg-transparent px-5 text-[27px] font-semibold tabular-nums outline-none" aria-invalid={priceTouched && enteredPrice === null} /><span className="pr-5 text-[15px] font-medium text-muted">TL</span></div>{priceTouched && enteredPrice === null && <p role="alert" className="mt-2 text-[12px] text-danger-ink">Geçerli bir teklif fiyatı gir.</p>}
        {summary && <div className="mt-6 grid grid-cols-2 gap-5 border-t border-line pt-5"><PricingFact label={summary.profit < 0 ? "Tahmini zarar" : "Tahmini kârın"} value={formatMoney(summary.profit)} prominent /><PricingFact label="Kâr marjı" value={formatPercent(summary.profitMargin)} prominent /><div role="status" className={`col-span-2 rounded-lg border px-4 py-3 ${statusCopy[summary.status].className}`}><p className="text-[14px] font-semibold">{statusCopy[summary.status].title}</p><p className="mt-1 text-[12px] leading-5">{statusCopy[summary.status].detail}</p></div></div>}
      </Card>
      <details className="rounded-xl border border-line bg-white px-5 py-4"><summary className="cursor-pointer text-[14px] font-semibold">Bu fiyat nasıl hesaplandı?</summary><div className="mt-4 space-y-2 border-t border-line pt-4 text-[13px] leading-6 text-ink-2"><p>Gerçek maliyet: {formatMoney(cost)}</p><p>Hedef marj: {formatPercent(marginsValid ? target : null)}</p><p>Maliyet ÷ (1 − hedef marj) = {recommendation ? formatMoney(Math.round(recommendation.exactRecommendedPrice * 100) / 100) : "—"}</p><p>100 TL adımına yukarı yuvarlanmış fiyat: {recommendation ? formatMoney(recommendation.roundedRecommendedPrice) : "—"}</p></div></details>
      {calculation && <details className="rounded-xl border border-line bg-white px-5 py-4"><summary className="cursor-pointer text-[14px] font-semibold">Maliyet detaylarını gör</summary><div className="mt-4"><JobCostSummary calculation={calculation} /></div></details>}
    </div><Card className="p-6 lg:sticky lg:top-6"><p className="text-[12px] font-semibold uppercase tracking-wider text-muted">Teklif özeti</p><h3 className="mt-3 text-[20px] font-semibold tracking-heading">{job.title}</h3><p className="mt-1 text-[13px] text-muted">{customerName}</p><div className="mt-5 space-y-4 border-t border-line pt-5"><PricingFact label="Maliyet" value={formatMoney(cost)} /><PricingFact label="Teklif" value={shownPrice ? formatMoney(shownPrice.selectedPrice) : "—"} /><PricingFact label="Tahmini kâr" value={summary ? formatMoney(summary.profit) : "—"} /><PricingFact label="Kâr marjı" value={formatPercent(summary?.profitMargin ?? null)} /></div><button type="button" onClick={onEdit} className="mt-6 inline-flex min-h-10 items-center gap-2 text-[13px] font-semibold text-primary hover:underline"><Pencil size={15} />İşi Düzenle</button></Card></div>
    {error && <p role="alert" className="mt-5 rounded-lg border border-danger-200 bg-danger-soft px-4 py-3 text-[13px] text-danger-ink">{error}</p>}
    <div className="sticky bottom-[calc(80px+env(safe-area-inset-bottom))] z-10 mt-7 flex flex-wrap gap-2 border-t border-line bg-canvas/95 py-3 backdrop-blur-md lg:bottom-0"><Button type="button" variant="secondary" onClick={() => persist("save")} disabled={pending || !summary} className="min-h-12 flex-1 sm:flex-none">{pending ? "Kaydediliyor..." : "İşi Kaydet"}</Button><Button type="button" onClick={() => persist("offer")} disabled={pending || !summary} className="min-h-12 flex-[2] sm:flex-none">{pending ? "Kaydediliyor..." : <>Teklif Oluştur <ArrowRight size={17} /></>}</Button></div>
    {confirm && summary && <Dialog title={summary.status === "loss" ? "Bu fiyatla zarar ediyorsun." : "Bu fiyat minimum kâr hedefinin altında."} onClose={() => setConfirm(null)} busy={pending}><div className="mt-5 space-y-3 text-[14px]"><div className="flex justify-between"><span>Maliyet</span><strong>{formatMoney(cost)}</strong></div><div className="flex justify-between"><span>Teklif</span><strong>{formatMoney(summary.selectedPrice)}</strong></div><div className="flex justify-between"><span>{summary.profit < 0 ? "Tahmini zarar" : "Tahmini kâr"}</span><strong>{formatMoney(summary.profit)}</strong></div><div className="flex justify-between"><span>Marj</span><strong>{formatPercent(summary.profitMargin)}</strong></div></div><div className="mt-7 flex flex-col gap-2 sm:flex-row"><Button variant="secondary" onClick={() => setConfirm(null)} disabled={pending} className="flex-1">Fiyatı Düzenle</Button><Button onClick={() => persist(confirm, true)} disabled={pending} className="flex-1">{pending ? "Kaydediliyor..." : summary.status === "loss" ? "Zararına Devam Et" : "Yine de Devam Et"}</Button></div></Dialog>}
  </section>;
}
