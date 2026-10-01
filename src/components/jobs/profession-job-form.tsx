"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { saveProfessionJob } from "@/app/actions/profession-jobs";
import { calculateProfessionJob } from "@/lib/professions/engine";
import { evaluateCondition, type FieldValue, type FieldValues, type ProfessionField, type ProfessionTemplate } from "@/lib/professions/schema";
import { formatMoney } from "@/lib/costs/format";
import type { BusinessCostItem, Job } from "@/types/database";

const inputClass = "mt-2 min-h-12 w-full rounded-xl border border-[#d5d5da] bg-white px-4 text-[15px] outline-none focus:border-[#0071E3] focus:ring-3 focus:ring-[#0071E3]/15";
type CustomerChoice = { id: string; name: string; company_name: string | null };

function FieldInput({ field, value, onChange }: { field: ProfessionField; value: FieldValue; onChange: (value: FieldValue) => void }) {
  const id = `field-${field.key}`;
  if (field.fieldType === "checkbox" || field.fieldType === "toggle")
    return <label className="flex min-h-12 items-center gap-3 text-sm"><input id={id} type="checkbox" checked={value === true} onChange={(event) => onChange(event.target.checked)} className="size-5 accent-[#0071E3]" /><span>{field.label}</span></label>;
  return <label htmlFor={id} className="block text-[14px] font-medium">{field.label}{field.required && <span className="ml-1 text-[#b3382f]">*</span>}
    {field.description && <span className="mt-1 block text-[12px] font-normal text-[#6E6E73]">{field.description}</span>}
    {field.fieldType === "textarea" ? <textarea id={id} rows={3} maxLength={2000} value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value)} placeholder={field.placeholder} className={`${inputClass} py-3`} /> :
      field.fieldType === "select" || field.fieldType === "multi_select" ? <select id={id} multiple={field.fieldType === "multi_select"} value={field.fieldType === "multi_select" ? Array.isArray(value) ? value : [] : typeof value === "string" ? value : ""} onChange={(event) => onChange(field.fieldType === "multi_select" ? Array.from(event.target.selectedOptions).map((option) => option.value) : event.target.value)} className={inputClass}><option value="">Seçiniz</option>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> :
      <div className="relative"><input id={id} type={field.fieldType === "date" ? "date" : ["number","currency","integer","percentage","quantity"].includes(field.fieldType) ? "number" : "text"} min={field.minValue} max={field.maxValue} step={field.step ?? (field.fieldType === "integer" ? 1 : "any")} maxLength={300} value={value === null ? "" : String(value)} onChange={(event) => onChange(["number","currency","integer","percentage","quantity"].includes(field.fieldType) ? event.target.value === "" ? null : Number(event.target.value) : event.target.value)} placeholder={field.placeholder} className={inputClass} />{field.unit && <span className="absolute right-4 top-5 text-[13px] text-[#6E6E73]">{field.unit}</span>}</div>}
  </label>;
}

export function ProfessionJobForm({ template, costs, settings, customers, job, selectedCustomerId, demo = false, initialFields }: {
  template: ProfessionTemplate; costs: BusinessCostItem[]; settings: Record<string, number>;
  customers: CustomerChoice[]; job?: Job | null; selectedCustomerId?: string | null; demo?: boolean; initialFields?: FieldValues;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(job?.title ?? "");
  const [description, setDescription] = useState(job?.description ?? "");
  const [customerId, setCustomerId] = useState(job?.customer_id ?? selectedCustomerId ?? "");
  const [fields, setFields] = useState<FieldValues>(() => Object.fromEntries(template.fields.map((field) => [field.key,
    job?.input_data?.[field.key] ?? initialFields?.[field.key] ?? field.defaultValue ?? null])) as FieldValues);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const calculation = useMemo(() => {
    try { return calculateProfessionJob({ template, fieldValues: fields, businessCosts: costs, businessSettings: settings }); }
    catch { return null; }
  }, [template, fields, costs, settings]);
  const setField = (key: string, value: FieldValue) => { setFields((old) => ({ ...old, [key]: value })); setFieldErrors((old) => ({ ...old, [key]: "" })); setError(""); };
  async function save() {
    if (demo) { setError(calculation ? `Demo hesabı: ${formatMoney(calculation.totalCost)}. Gerçek kayıt için hesap oluştur.` : "Önce iş bilgilerini ve maliyetleri tamamla."); return; }
    setPending(true); setError(""); setFieldErrors({});
    try {
      const result = await saveProfessionJob({ jobId: job?.id ?? null, customerId: customerId || null, title, description, fields });
      if (!result.ok) { setError(result.error); setFieldErrors(result.fieldErrors || {}); return; }
      router.push(`/jobs/${result.id}/pricing`); router.refresh();
    } catch { setError("İş kaydedilemedi. Tekrar dene."); }
    finally { setPending(false); }
  }
  return <div className="mx-auto max-w-[1050px]"><div className="mb-7"><p className="text-[12px] font-semibold text-[#0071E3]">{template.name} · İş hesabı</p><h1 className="mt-2 text-[34px] font-semibold tracking-[-0.05em]">{job ? "İşi düzenle" : "Yeni iş oluştur"}</h1><p className="mt-2 text-[14px] text-[#6E6E73]">Bilgileri gir; gerçek maliyetini kendi fiyatlarınla hesaplayalım.</p></div>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_310px]"><div className="space-y-5">
      <Card className="p-5 sm:p-7"><h2 className="text-[19px] font-semibold">İş bilgileri</h2><div className="mt-5 space-y-4"><label className="block text-[14px] font-medium">İş başlığı<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} placeholder="Örn. Mutfak elektrik tesisatı" className={inputClass} /></label><label className="block text-[14px] font-medium">Müşteri<select value={customerId} onChange={(event) => setCustomerId(event.target.value)} className={inputClass}><option value="">Müşterisiz iş</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}{customer.company_name ? ` · ${customer.company_name}` : ""}</option>)}</select></label><label className="block text-[14px] font-medium">Açıklama<textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={2000} rows={2} className={`${inputClass} py-3`} /></label></div></Card>
      {[...template.sections].sort((a,b) => a.sortOrder - b.sortOrder).map((section) => <Card key={section.key} className="p-5 sm:p-7"><h2 className="text-[19px] font-semibold">{section.title}</h2>{section.description && <p className="mt-1 text-[13px] text-[#6E6E73]">{section.description}</p>}<div className="mt-5 grid gap-5 sm:grid-cols-2">{template.fields.filter((field) => field.section === section.key && evaluateCondition(field.visibilityCondition, fields)).sort((a,b) => a.sortOrder-b.sortOrder).map((field) => <div key={field.key}><FieldInput field={field} value={fields[field.key]} onChange={(value) => setField(field.key, value)} />{fieldErrors[field.key] && <p role="alert" className="mt-1 text-xs text-[#b3382f]">{fieldErrors[field.key]}</p>}</div>)}</div></Card>)}
      {error && <p role="alert" className="rounded-xl bg-[#fff4f2] p-4 text-sm text-[#b3382f]">{error}</p>}
      <Button onClick={save} disabled={pending} className="min-h-12 w-full">{demo ? "Hesabı Gör" : pending ? "Kaydediliyor..." : "Maliyeti Kaydet ve Fiyata Geç"}</Button>
    </div><aside className="lg:sticky lg:top-6 lg:self-start"><Card className="p-6"><p className="text-xs font-semibold uppercase tracking-wide text-[#6E6E73]">Tahmini gerçek maliyet</p><p className="mt-3 text-[30px] font-semibold tracking-[-0.05em]">{calculation ? formatMoney(calculation.totalCost) : "—"}</p>{calculation ? <><div className="mt-5 space-y-2 border-t border-[#ececf0] pt-4 text-sm"><p className="flex justify-between"><span>Malzeme</span><strong>{formatMoney(calculation.materialTotal)}</strong></p><p className="flex justify-between"><span>İşçilik</span><strong>{formatMoney(calculation.laborTotal)}</strong></p><p className="flex justify-between"><span>Diğer</span><strong>{formatMoney(calculation.otherTotal)}</strong></p></div>{calculation.warnings.map((warning) => <p key={warning} className="mt-3 text-xs text-[#8a5a06]">{warning}</p>)}</> : <p className="mt-3 text-[13px] leading-5 text-[#6E6E73]">Alanları ve Maliyetlerim sayfasındaki fiyatları tamamladığında hesap görünecek.</p>}</Card></aside></div></div>;
}
