"use client";

import { Dialog } from "@/components/ui/dialog";
import { useDraft } from "@/components/draft-provider";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, X } from "lucide-react";
import { calculateAndSavePainterJob, type CustomerChoice } from "@/app/actions/jobs";
import { StepIndicator } from "@/components/content";
import { Button, ButtonLink, Card, Input, Select } from "@/components/ui";
import { CustomerSelect } from "@/components/jobs/customer-select";
import { JobCostSummary } from "@/components/jobs/job-cost-summary";
import { PricingStep } from "@/components/jobs/pricing-step";
import { formatMoney } from "@/lib/costs/format";
import { unitDisplay } from "@/lib/costs/catalog";
import { validatePainterWork, type ExtraCostSelection, type PainterCalculation, type PainterTechnicalSettings, type PainterWorkInput } from "@/lib/jobs/painter-calculation";
import type { BusinessCostItem, Job, PainterJobDetail } from "@/types/database";

type Draft = {
  title: string; description: string; wallArea: string; ceilingArea: string; wallCoats: string;
  ceilingCoats: string; primerRequired: boolean; primerCoats: string; puttyRequired: boolean;
  puttyArea: string; days: string; masterCount: string; helperCount: string;
  includeConsumables: boolean; includeTransport: boolean; wastePercentage: string; notes: string;
};
type ExtraDraft = { cost_item_id: string; quantity: string };
type Props = { customers: CustomerChoice[]; selectedCustomer: CustomerChoice | null; costs: BusinessCostItem[];
  settings: PainterTechnicalSettings; job?: Job | null; details?: PainterJobDetail | null;
  initialCalculation?: PainterCalculation | null; initialStep?: number; defaultTargetMargin: number; defaultMinimumMargin: number };
function initialDraft(settings: PainterTechnicalSettings, job?: Job | null, details?: PainterJobDetail | null): Draft {
  return { title: job?.title || "İç Cephe Boyama", description: job?.description || "",
    wallArea: details ? String(details.wall_area) : "", ceilingArea: details ? String(details.ceiling_area) : "",
    wallCoats: String(details?.wall_coats ?? 2), ceilingCoats: String(details?.ceiling_coats ?? 2),
    primerRequired: details?.primer_required ?? false, primerCoats: String(details?.primer_coats ?? 1),
    puttyRequired: details?.putty_required ?? false, puttyArea: details ? String(details.putty_area) : "",
    days: String(details?.days ?? 3), masterCount: String(details?.master_count ?? 1), helperCount: String(details?.helper_count ?? 0),
    includeConsumables: details?.include_consumables ?? true, includeTransport: details?.include_transport ?? true,
    wastePercentage: String(details?.waste_percentage ?? settings.waste_percentage), notes: details?.notes || "" };
}
function numeric(value: string) { return value.trim() === "" ? 0 : Number(value.replace(",", ".")); }
function toWork(draft: Draft, ceilingEnabled: boolean): PainterWorkInput {
  return { wall_area: numeric(draft.wallArea), ceiling_area: ceilingEnabled ? numeric(draft.ceilingArea) : 0,
    wall_coats: numeric(draft.wallCoats), ceiling_coats: numeric(draft.ceilingCoats),
    primer_required: draft.primerRequired, primer_coats: numeric(draft.primerCoats),
    putty_required: draft.puttyRequired, putty_area: draft.puttyRequired ? numeric(draft.puttyArea) : 0,
    days: numeric(draft.days), master_count: numeric(draft.masterCount), helper_count: numeric(draft.helperCount),
    include_consumables: draft.includeConsumables, include_transport: draft.includeTransport,
    waste_percentage: numeric(draft.wastePercentage), notes: draft.notes.trim() };
}
function ErrorText({ message }: { message?: string }) { return message ? <p role="alert" className="mt-1 text-[12px] text-[#c7352d]">{message}</p> : null; }
function NumberField({ label, value, onChange, suffix, error, hint }: {
  label: string; value: string; onChange: (value: string) => void; suffix?: string; error?: string; hint?: string;
}) { return <div><label className="block text-[14px] font-medium"><span className="mb-2 block">{label}</span><span className="flex items-center gap-3"><input type="text" inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} className="h-12 min-w-0 flex-1 rounded-[13px] border border-[#D2D2D7] bg-white px-4 text-[16px] outline-none focus:border-[#0071E3] focus:ring-3 focus:ring-[#0071E3]/15" />{suffix && <span className="shrink-0 text-[13px] text-[#6E6E73]">{suffix}</span>}</span></label>{hint && <p className="mt-1 text-[12px] leading-5 text-[#6E6E73]">{hint}</p>}<ErrorText message={error} /></div>; }
function Toggle({ label, checked, onChange, help }: { label: string; checked: boolean; onChange: (checked: boolean) => void; help?: string }) {
  return <label className="flex min-h-14 items-center justify-between gap-4 rounded-[13px] border border-[#e5e5e9] px-4 py-2"><span><span className="block text-[14px] font-medium">{label}</span>{help && <span className="mt-0.5 block text-[12px] text-[#6E6E73]">{help}</span>}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-5 shrink-0 accent-[#0071E3]" /></label>;
}

export function PainterJobWizard({ customers, selectedCustomer: initialCustomer, costs, settings, job, details,
  initialCalculation = null, initialStep, defaultTargetMargin, defaultMinimumMargin }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(initialStep ?? (job ? 1 : 0));
  const [customer, setCustomer] = useState<CustomerChoice | null>(initialCustomer);
  const [draft, setDraft] = useState<Draft>(() => initialDraft(settings, job, details));
  const [ceilingEnabled, setCeilingEnabled] = useState(Boolean(details?.ceiling_area));
  const [extras, setExtras] = useState<ExtraDraft[]>(() => (details?.extra_costs || []).map((item) => ({
    cost_item_id: String(item.cost_item_id || ""), quantity: String(item.quantity || "1"),
  })).filter((item) => item.cost_item_id));
  const [extraOpen, setExtraOpen] = useState(false);
  const [extraId, setExtraId] = useState("");
  const [extraQuantity, setExtraQuantity] = useState("1");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [needsCosts, setNeedsCosts] = useState(false);
  const [pending, setPending] = useState(false);
  const [savedJobId, setSavedJobId] = useState<string | null>(job?.id || null);
  const [calculation, setCalculation] = useState<PainterCalculation | null>(initialCalculation);
  const [pricingJob, setPricingJob] = useState<Job | null>(job || null);
  const protectedDraft = useDraft('painter:' + (job?.id ?? 'new'), { draft, customer, ceilingEnabled, extras, savedJobId, step: Math.min(step, 2) }, saved => {
    if (!saved.draft || typeof saved.draft.title !== 'string' || !Array.isArray(saved.extras)) return;
    setSavedJobId(saved.savedJobId); setDraft(saved.draft); setCustomer(initialCustomer ?? saved.customer); setCeilingEnabled(saved.ceilingEnabled); setExtras(saved.extras); setStep(saved.step);
  });
  const customCosts = costs.filter((cost) => cost.template_id === null && cost.is_active);
  const chosenExtra = customCosts.find((cost) => cost.id === extraId);
  function change<K extends keyof Draft>(key: K, value: Draft[K]) { protectedDraft.resume(); setDraft((current) => ({ ...current, [key]: value })); setErrors({}); setMessage(""); }
  function nextDetails() {
    const next = validatePainterWork(toWork(draft, ceilingEnabled));
    const detailKeys = ["wall_area", "ceiling_area", "wall_coats", "ceiling_coats", "primer_required", "primer_coats", "putty_area", "waste_percentage", "notes"];
    const relevant = Object.fromEntries(Object.entries(next).filter(([key]) => detailKeys.includes(key)));
    if (ceilingEnabled && numeric(draft.ceilingArea) <= 0) relevant.ceiling_area = "Boyanacak tavan alanını gir.";
    if (!draft.title.trim() || draft.title.trim().length > 160) relevant.title = "İş başlığını gir (en fazla 160 karakter).";
    setErrors(relevant);
    if (!Object.keys(relevant).length) setStep(2);
  }
  async function calculate() {
    const work = toWork(draft, ceilingEnabled);
    const validation = validatePainterWork(work);
    if (Object.keys(validation).length) { setErrors(validation); setMessage("İş bilgilerini kontrol et."); return; }
    const extraSelections: ExtraCostSelection[] = extras.map((item) => ({ cost_item_id: item.cost_item_id, quantity: numeric(item.quantity) }));
    setPending(true); setErrors({}); setMessage(""); setNeedsCosts(false);
    try {
      const result = await calculateAndSavePainterJob({ jobId: savedJobId, customerId: customer?.id || null,
        title: draft.title, description: draft.description, work, extras: extraSelections });
      if (result.ok && result.id && result.calculation) { setSavedJobId(result.id); protectedDraft.clear(); setCalculation(result.calculation); if (result.job) setPricingJob(result.job); setStep(3); }
      else if (result.id) router.push(`/jobs/${result.id}?saved=1`);
      else { setErrors(result.fieldErrors || {}); setMessage(result.error || "İş hesaplanamadı. Tekrar dene."); setNeedsCosts(Boolean(result.needsCosts)); }
    } catch { setMessage("İş hesaplanamadı. Tekrar dene."); }
    finally { setPending(false); }
  }
  function addExtra() {
    const qty = numeric(extraQuantity);
    if (!chosenExtra || !Number.isFinite(qty) || qty <= 0 || qty > 100000 || Math.abs(qty * 10000 - Math.round(qty * 10000)) > 1e-6) {
      setMessage("Ek maliyet ve geçerli miktar seç."); return;
    }
    protectedDraft.resume(); setExtras((current) => [...current, { cost_item_id: chosenExtra.id, quantity: extraQuantity }]);
    setExtraOpen(false); setExtraId(""); setExtraQuantity("1"); setMessage("");
  }
  return <div className="mx-auto max-w-[860px]"><div className="mb-6 flex items-center justify-between gap-3"><Link href={job ? `/jobs/${job.id}` : "/dashboard"} className="inline-flex min-h-11 items-center gap-2 text-[14px] font-medium text-[#6E6E73] hover:text-[#1D1D1F]"><ArrowLeft size={17} />{job ? "İşe Dön" : "Ana Sayfa"}</Link><Link href="/jobs" className="text-[13px] font-medium text-[#0071E3] hover:underline">Kaydedilmiş İşler</Link></div><h1 className="text-[33px] font-semibold tracking-[-0.055em] sm:text-[41px]">{job ? "İşi Düzenle" : "Yeni Teklif"}</h1><p className="mt-2 text-[14px] leading-6 text-[#6E6E73]">Önce işin gerçek maliyetini birlikte hesaplayalım.</p><div className="mt-7"><StepIndicator activeStep={step} /></div>
    {protectedDraft.notice && <p role="status" className="mt-4 text-sm text-[#0071E3]">{protectedDraft.notice}</p>}
    {step === 0 && <section className="mt-8"><h2 className="text-[25px] font-semibold tracking-[-0.04em]">Müşteriyi seç.</h2><p className="mt-1 text-[14px] text-[#6E6E73]">Bu işin kimin için olduğunu belirle.</p><Card className="mt-5 p-5 sm:p-6"><CustomerSelect initialCustomers={customers} selected={customer} onSelect={value=>{protectedDraft.resume();setCustomer(value);}} /></Card></section>}
    {step === 1 && <section className="mt-8"><h2 className="text-[25px] font-semibold tracking-[-0.04em]">İşi tarif et.</h2><p className="mt-1 text-[14px] text-[#6E6E73]">Boyanacak alanları ve uygulanacak işlemleri gir.</p><div className="mt-5 space-y-5"><Card className="p-5 sm:p-6"><h3 className="mb-5 text-[18px] font-semibold">İş Bilgileri</h3><Input id="job-title" label="İş Başlığı" value={draft.title} maxLength={160} onChange={(event) => change("title", event.target.value)} /><ErrorText message={errors.title} /><div className="mt-5"><label htmlFor="job-description" className="mb-2 block text-[14px] font-medium">Açıklama (isteğe bağlı)</label><textarea id="job-description" value={draft.description} maxLength={2000} onChange={(event) => change("description", event.target.value)} className="min-h-24 w-full rounded-[13px] border border-[#D2D2D7] px-4 py-3 text-[16px] outline-none focus:border-[#0071E3]" /></div></Card>
      <Card className="p-5 sm:p-6"><h3 className="mb-5 text-[18px] font-semibold">Duvarlar</h3><div className="grid gap-5 sm:grid-cols-2"><NumberField label="Boyanacak duvar alanı" value={draft.wallArea} onChange={(value) => change("wallArea", value)} suffix="m²" hint="Yaklaşık toplam duvar alanını gir." error={errors.wall_area} /><div><Select id="wall-coats" label="Duvar kat sayısı" value={draft.wallCoats} onChange={(event) => change("wallCoats", event.target.value)}>{[1,2,3,4].map((value) => <option key={value} value={value}>{value} kat</option>)}</Select><ErrorText message={errors.wall_coats} /></div></div></Card>
      <Card className="p-5 sm:p-6"><h3 className="mb-5 text-[18px] font-semibold">Tavan</h3><Toggle label="Tavan boyanacak" checked={ceilingEnabled} onChange={value=>{protectedDraft.resume();setCeilingEnabled(value);}} />{ceilingEnabled && <div className="mt-5 grid gap-5 sm:grid-cols-2"><NumberField label="Tavan alanı" value={draft.ceilingArea} onChange={(value) => change("ceilingArea", value)} suffix="m²" error={errors.ceiling_area} /><Select id="ceiling-coats" label="Tavan kat sayısı" value={draft.ceilingCoats} onChange={(event) => change("ceilingCoats", event.target.value)}>{[1,2,3].map((value) => <option key={value} value={value}>{value} kat</option>)}</Select></div>}</Card>
      <Card className="space-y-4 p-5 sm:p-6"><h3 className="text-[18px] font-semibold">Hazırlık</h3><Toggle label="Astar uygulanacak" checked={draft.primerRequired} onChange={(value) => change("primerRequired", value)} />{draft.primerRequired && <Select id="primer-coats" label="Astar kat sayısı" value={draft.primerCoats} onChange={(event) => change("primerCoats", event.target.value)}>{[1,2,3].map((value) => <option key={value} value={value}>{value} kat</option>)}</Select>}<ErrorText message={errors.primer_required} /><Toggle label="Macun gerekli" checked={draft.puttyRequired} onChange={(value) => change("puttyRequired", value)} />{draft.puttyRequired && <NumberField label="Macun uygulanacak alan" value={draft.puttyArea} onChange={(value) => change("puttyArea", value)} suffix="m²" error={errors.putty_area} />}</Card>
      <details className="rounded-[20px] border border-[#e5e5e9] bg-white p-5 sm:p-6"><summary className="min-h-8 cursor-pointer text-[15px] font-semibold">Gelişmiş Ayarlar</summary><div className="mt-5"><NumberField label="Bu işe özel fire payı" value={draft.wastePercentage} onChange={(value) => change("wastePercentage", value)} suffix="%" hint="İşletme ayarındaki oranı değiştirmez." error={errors.waste_percentage} /></div></details><Card className="p-5 sm:p-6"><label htmlFor="job-notes" className="block text-[14px] font-medium">İş notları</label><textarea id="job-notes" value={draft.notes} maxLength={2000} onChange={(event) => change("notes", event.target.value)} placeholder="Bu işe özel hatırlamak istediklerin" className="mt-2 min-h-24 w-full rounded-[13px] border border-[#D2D2D7] px-4 py-3 text-[16px] outline-none focus:border-[#0071E3]" /><ErrorText message={errors.notes} /></Card></div></section>}
    {step === 2 && <section className="mt-8"><h2 className="text-[25px] font-semibold tracking-[-0.04em]">İşçilik planı.</h2><p className="mt-1 text-[14px] text-[#6E6E73]">Kaç kişi, kaç gün çalışacak?</p><div className="mt-5 space-y-5"><Card className="p-5 sm:p-6"><div className="grid gap-5 sm:grid-cols-3"><NumberField label="Tahmini iş süresi" value={draft.days} onChange={(value) => change("days", value)} suffix="gün" error={errors.days} /><NumberField label="Usta sayısı" value={draft.masterCount} onChange={(value) => change("masterCount", value)} error={errors.master_count} /><NumberField label="Yardımcı sayısı" value={draft.helperCount} onChange={(value) => change("helperCount", value)} error={errors.helper_count} /></div>{numeric(draft.masterCount) === 0 && numeric(draft.helperCount) === 0 && <p className="mt-4 rounded-xl bg-[#fffaf0] px-4 py-3 text-[13px] text-[#76510c]">Bu iş için işçilik eklemedin. Yine de devam edebilirsin.</p>}</Card><Card className="space-y-3 p-5 sm:p-6"><h3 className="text-[18px] font-semibold">Sabit Giderler</h3><Toggle label="Sarf malzemelerini ekle" checked={draft.includeConsumables} onChange={(value) => change("includeConsumables", value)} /><Toggle label="Yol / araç giderini ekle" checked={draft.includeTransport} onChange={(value) => change("includeTransport", value)} /></Card><Card className="p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><div><h3 className="text-[18px] font-semibold">Ek Maliyetler</h3><p className="mt-1 text-[13px] text-[#6E6E73]">Kendi eklediğin maliyetlerden kullan.</p></div><Button type="button" variant="secondary" onClick={() => setExtraOpen(true)}><Plus size={17} />Ekle</Button></div>{extras.length ? <div className="mt-5 divide-y divide-[#ececf0]">{extras.map((extra) => { const cost = costs.find((item) => item.id === extra.cost_item_id); return <div key={extra.cost_item_id} className="flex min-h-14 items-center justify-between gap-3 py-2"><div><p className="text-[14px] font-medium">{cost?.name || "Eksik maliyet"}</p><p className="text-[12px] text-[#6E6E73]">{extra.quantity} {cost ? unitDisplay(cost.unit) : ""} × {cost ? formatMoney(cost.unit_cost) : "—"}</p></div><button type="button" aria-label={`${cost?.name || "Ek maliyet"} kaldır`} onClick={() => {protectedDraft.resume();setExtras((current) => current.filter((item) => item.cost_item_id !== extra.cost_item_id));}} className="flex size-11 items-center justify-center rounded-xl text-[#a9443c] hover:bg-[#fff0ef]"><Trash2 size={17} /></button></div>; })}</div> : <p className="mt-5 text-[13px] text-[#6E6E73]">Ek maliyet seçmedin.</p>}</Card></div></section>}
    {step === 3 && calculation && <section className="mt-8"><h2 className="text-[25px] font-semibold tracking-[-0.04em]">Gerçek maliyetin.</h2><p className="mb-5 mt-1 text-[14px] text-[#6E6E73]">Girdiğin iş detaylarına ve kendi maliyetlerine göre hesaplandı.</p><JobCostSummary calculation={calculation} /></section>}
    {step === 4 && pricingJob && <PricingStep key={`${pricingJob.id}-${pricingJob.calculated_at}`} job={{ ...pricingJob,
      target_profit_margin: pricingJob.target_profit_margin ?? Math.max(defaultTargetMargin, 1),
      minimum_profit_margin: pricingJob.minimum_profit_margin ?? Math.min(defaultMinimumMargin, 89) }}
      cost={calculation?.grand_total ?? pricingJob.estimated_cost} customerName={customer?.name || "Müşterisiz iş"}
      calculation={calculation} onEdit={() => setStep(1)} onBack={() => setStep(3)} />}
    {message && <div role="alert" className="mt-5 rounded-[13px] border border-[#f2d1cb] bg-[#fff1ef] px-4 py-3 text-[13px] text-[#a82e25]">{message}{needsCosts && <Link href="/costs" className="ml-2 font-semibold underline">Maliyeti Tanımla</Link>}</div>}
    {step < 4 && <div className="sticky bottom-[calc(80px+env(safe-area-inset-bottom))] z-10 mt-7 flex gap-2 border-t border-[#e5e5e9] bg-[#F5F5F7]/95 py-3 backdrop-blur-md lg:bottom-0"><Button type="button" variant="secondary" onClick={() => { setErrors({}); setMessage(""); setStep((current) => Math.max(0, current - 1)); }} disabled={step === 0 || pending} className="min-h-12 flex-1 sm:flex-none">Geri</Button>{step === 0 && <Button onClick={() => setStep(1)} className="min-h-12 flex-[2] sm:flex-none">Devam Et</Button>}{step === 1 && <Button onClick={nextDetails} className="min-h-12 flex-[2] sm:flex-none">Devam Et</Button>}{step === 2 && <Button onClick={calculate} disabled={pending} className="min-h-12 flex-[2] sm:flex-none">{pending ? "Hesaplanıyor..." : "Hesapla ve Kaydet"}</Button>}{step === 3 && <><Button variant="secondary" onClick={() => savedJobId && router.push(`/jobs/${savedJobId}?saved=1`)} className="min-h-12 flex-1 sm:flex-none">İşi Kaydet</Button><Button onClick={() => setStep(4)} className="min-h-12 flex-[2] sm:flex-none">Fiyatını Belirle</Button></>}</div>}
    {extraOpen && <Dialog title="Ek Maliyet Ekle" onClose={() => setExtraOpen(false)}>{customCosts.length ? <div className="mt-5 space-y-4"><Select id="extra-item" label="Maliyet seç" value={extraId} onChange={(event) => setExtraId(event.target.value)}><option value="">Seçiniz</option>{customCosts.filter((cost) => !extras.some((extra) => extra.cost_item_id === cost.id)).map((cost) => <option key={cost.id} value={cost.id}>{cost.name}</option>)}</Select><NumberField label="Miktar" value={extraQuantity} onChange={setExtraQuantity} suffix={chosenExtra ? unitDisplay(chosenExtra.unit) : undefined} />{chosenExtra && <p className="rounded-xl bg-[#f5f5f7] px-4 py-3 text-[14px]">Birim: {formatMoney(chosenExtra.unit_cost)} · Toplam: {formatMoney(numeric(extraQuantity) * chosenExtra.unit_cost || 0)}</p>}<Button onClick={addExtra} className="w-full">Ekle</Button></div> : <div className="mt-5"><p className="text-[14px] leading-6 text-[#6E6E73]">Önce Maliyetlerim sayfasında özel bir kalem ekle.</p><ButtonLink href="/costs" className="mt-5">Maliyet Ekle</ButtonLink></div>}</Dialog>}
  </div>;
}
