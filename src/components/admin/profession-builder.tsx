"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { saveProfessionDraft, publishProfessionDraft, deleteProfessionDraft, setProfessionArchived } from "@/app/actions/admin-professions";
import { calculateProfessionJob, compileTemplate } from "@/lib/professions/engine";
import type { ProfessionTemplate } from "@/lib/professions/schema";
import type { BusinessCostItem } from "@/types/database";

const blank: ProfessionTemplate = { slug: "", name: "", description: "", icon: "wrench", category: "Genel", version: 1,
  sections: [{ key: "work", title: "İş bilgileri", sortOrder: 10 }], fields: [], settings: [], costs: [], formulas: [], quoteItems: [], quoteExclusions: [], validations: [] };
const inputClass = "mt-2 min-h-11 w-full rounded-xl border border-[#d5d5da] bg-white px-4 text-sm outline-none focus:border-[#0071E3]";
const collections = [
  ["sections", "Form bölümleri", "İş formunun başlıkları ve sırası."],
  ["fields", "Form alanları", "Alan tipi, seçenekler, zorunluluk ve görünürlük koşulları."],
  ["settings", "Hesaplama ayarları", "İşletme ayarları için varsayılan sayısal değerler."],
  ["costs", "Maliyet kalemleri", "Birim fiyat ve maliyet kategorileri."],
  ["formulas", "Hesaplama formülleri", "field, setting, cost ve result referanslarıyla güvenli matematik."],
  ["quoteItems", "Teklif kapsamı", "İş formuna göre müşteriye gösterilecek maddeler."],
  ["quoteExclusions", "Teklif harici işler", "Teklifte varsayılan olarak hariç gösterilecek işler."],
  ["validations", "İş kuralları", "Bir koşul sağlandığında sıfırdan büyük olması gereken doğrulama formülleri."],
] as const;
type CollectionKey = typeof collections[number][0];
const fieldTypes = ["number","currency","text","textarea","select","multi_select","checkbox","toggle","date","integer","percentage","quantity"];
const categories = ["material","labor","transport","consumable","overhead","other"];
const units = ["piece","liter","kilogram","meter","square_meter","hour","day","kilometer","fixed","percent"];
const formulaTypes = ["quantity","cost","duration","derived_value","warning"];

function CollectionControls({ kind, template, change }: { kind: CollectionKey; template: ProfessionTemplate;
  change: (key: CollectionKey, value: unknown[]) => void }) {
  const source = (template[kind] || []) as unknown[];
  const update = (index: number, field: string, value: unknown) => change(kind, source.map((item, i) => i === index ? { ...(item as object), [field]: value } : item));
  const remove = (index: number) => change(kind, source.filter((_, i) => i !== index));
  const add = () => {
    const sortOrder = (source.length + 1) * 10;
    const defaults: Record<CollectionKey, unknown> = {
      sections: { key: `section_${source.length + 1}`, title: "Yeni bölüm", sortOrder },
      fields: { key: `field_${source.length + 1}`, label: "Yeni alan", fieldType: "number", section: template.sections[0]?.key || "work", defaultValue: 0, minValue: 0, sortOrder },
      settings: { key: `setting_${source.length + 1}`, name: "Yeni ayar", defaultValue: 1, minValue: 0 },
      costs: { key: `cost_${source.length + 1}`, name: "Yeni maliyet", category: "material", unit: "piece", defaultValue: 0, sortOrder },
      formulas: { key: `formula_${source.length + 1}`, name: "Yeni formül", expression: "0", formulaType: "quantity", sortOrder },
      quoteItems: { key: `scope_${source.length + 1}`, name: "Yeni kapsam maddesi", sortOrder },
      quoteExclusions: "Yeni hariç iş",
      validations: { key: `rule_${source.length + 1}`, message: "Bilgileri kontrol et.", expression: "0" },
    };
    change(kind, [...source, defaults[kind]]);
  };
  const editor = (index: number, field: string, value: string | number, label: string, numeric = false) =>
    <label className="block min-w-0 flex-1 text-xs font-medium text-[#6E6E73]">{label}<input value={value} onChange={(event) => update(index, field, numeric ? Number(event.target.value) : event.target.value)} type={numeric ? "number" : "text"} className={inputClass} /></label>;
  const chooser = (index: number, field: string, value: string, label: string, options: string[]) =>
    <label className="block min-w-0 flex-1 text-xs font-medium text-[#6E6E73]">{label}<select value={value} onChange={(event) => update(index, field, event.target.value)} className={inputClass}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
  return <div className="mt-4 space-y-3">{source.map((item, index) => {
    if (kind === "quoteExclusions") return <div key={index} className="flex gap-2"><input aria-label={`Hariç iş ${index + 1}`} value={item as string} onChange={(event) => change(kind, source.map((value,i) => i === index ? event.target.value : value))} className={inputClass} /><button type="button" onClick={() => remove(index)} className="self-end px-3 py-3 text-xs text-[#b3382f]">Sil</button></div>;
    if (!item || typeof item !== "object") return <div key={index} className="rounded-xl bg-[#fff4f2] p-3 text-sm text-[#b3382f]">Geçersiz satır <button type="button" onClick={() => remove(index)} className="ml-2 underline">Sil</button></div>;
    const row = item as Record<string, unknown>;
    const conditionKey = kind === "fields" ? "visibilityCondition" : "condition";
    const condition = row[conditionKey] as { field?: string; operator?: string; value?: unknown } | undefined;
    return <div key={`${kind}-${index}`} className="rounded-xl border border-[#e5e5e9] bg-[#fcfcfd] p-4"><div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold">{String(row.name || row.label || row.title || `Satır ${index + 1}`)}</p><div className="flex gap-1"><button type="button" disabled={index === 0} onClick={() => { const next = [...source]; [next[index-1],next[index]]=[next[index],next[index-1]]; change(kind,next); }} className="px-2 py-1 text-xs text-[#0071E3] disabled:opacity-30">↑</button><button type="button" disabled={index === source.length-1} onClick={() => { const next = [...source]; [next[index+1],next[index]]=[next[index],next[index+1]]; change(kind,next); }} className="px-2 py-1 text-xs text-[#0071E3] disabled:opacity-30">↓</button><button type="button" onClick={() => remove(index)} className="px-2 py-1 text-xs text-[#b3382f]">Sil</button></div></div><div className="mt-3 grid gap-3 sm:grid-cols-2">
      {editor(index,"key",String(row.key || ""),"Anahtar")}
      {kind === "sections" && editor(index,"title",String(row.title || ""),"Bölüm adı")}
      {kind === "fields" && <>{editor(index,"label",String(row.label || ""),"Soru")}{chooser(index,"fieldType",String(row.fieldType || "number"),"Alan tipi",fieldTypes)}{chooser(index,"section",String(row.section || ""),"Bölüm",template.sections.map((section) => section.key))}{editor(index,"unit",String(row.unit || ""),"Birim")}{editor(index,"minValue",Number(row.minValue ?? 0),"Minimum",true)}{editor(index,"maxValue",Number(row.maxValue ?? 100000),"Maksimum",true)}<label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={Boolean(row.required)} onChange={(event) => update(index,"required",event.target.checked)} />Zorunlu</label>{["checkbox","toggle"].includes(String(row.fieldType)) ? <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={row.defaultValue === true} onChange={(event) => update(index,"defaultValue",event.target.checked)} />Varsayılan açık</label> : <label className="text-xs text-[#6E6E73]">Varsayılan değer<input value={String(row.defaultValue ?? "")} onChange={(event) => update(index,"defaultValue",["number","currency","integer","percentage","quantity"].includes(String(row.fieldType)) ? Number(event.target.value) : event.target.value)} className={inputClass} /></label>}{["select","multi_select"].includes(String(row.fieldType)) && <label className="text-xs text-[#6E6E73] sm:col-span-2">Seçenekler (değer:etiket, virgülle ayır)<input value={Array.isArray(row.options) ? (row.options as Array<{value:string;label:string}>).map((option) => `${option.value}:${option.label}`).join(", ") : ""} onChange={(event) => update(index,"options",event.target.value.split(",").map((part) => { const [value,...label] = part.trim().split(":"); return { value, label: label.join(":") || value }; }).filter((option) => option.value))} className={inputClass} /></label>}</>}
      {kind === "settings" && <>{editor(index,"name",String(row.name || ""),"Ayar adı")}{editor(index,"defaultValue",Number(row.defaultValue ?? 0),"Varsayılan",true)}{editor(index,"unit",String(row.unit || ""),"Birim")}</>}
      {kind === "costs" && <>{editor(index,"name",String(row.name || ""),"Maliyet adı")}{chooser(index,"category",String(row.category || "material"),"Kategori",categories)}{chooser(index,"unit",String(row.unit || "piece"),"Birim",units)}{editor(index,"defaultValue",Number(row.defaultValue ?? 0),"Varsayılan fiyat",true)}</>}
      {kind === "formulas" && <>{editor(index,"name",String(row.name || ""),"Sonuç adı")}{chooser(index,"formulaType",String(row.formulaType || "quantity"),"Sonuç tipi",formulaTypes)}{editor(index,"expression",String(row.expression || ""),"Formül")}{kind === "formulas" && row.formulaType === "cost" && <>{chooser(index,"costTemplateKey",String(row.costTemplateKey || ""),"Maliyet kalemi",["",...template.costs.map((cost) => cost.key)])}{editor(index,"quantityExpression",String(row.quantityExpression || ""),"Miktar formülü")}</>}</>}
      {kind === "quoteItems" && <>{editor(index,"name",String(row.name || ""),"Müşterinin göreceği ad")}{editor(index,"description",String(row.description || ""),"Açıklama")}</>}
      {kind === "validations" && <>{editor(index,"message",String(row.message || ""),"Hata mesajı")}{editor(index,"expression",String(row.expression || ""),"Sıfırdan büyük olmalı")}</>}
    </div>{["fields","formulas","quoteItems","validations"].includes(kind) && <div className="mt-3 grid gap-3 border-t border-[#ececf0] pt-3 sm:grid-cols-3"><label className="text-xs text-[#6E6E73]">Görünürlük / uygulama koşulu<select value={condition?.field || ""} onChange={(event) => update(index,conditionKey,event.target.value ? { field: event.target.value, operator: "is_true" } : undefined)} className={inputClass}><option value="">Her zaman</option>{template.fields.map((field) => <option key={field.key} value={field.key}>{field.label}</option>)}</select></label>{condition?.field && <><label className="text-xs text-[#6E6E73]">Karşılaştırma<select value={condition.operator || "is_true"} onChange={(event) => update(index,conditionKey,{ ...condition, operator: event.target.value })} className={inputClass}>{["is_true","is_false","equals","not_equals","greater_than","less_than","contains"].map((operator) => <option key={operator} value={operator}>{operator}</option>)}</select></label>{!["is_true","is_false"].includes(condition.operator || "is_true") && <label className="text-xs text-[#6E6E73]">Değer<input value={String(condition.value ?? "")} onChange={(event) => update(index,conditionKey,{ ...condition, value: ["greater_than","less_than"].includes(condition.operator || "") ? Number(event.target.value) : event.target.value })} className={inputClass} /></label>}</>}</div>}</div>;
  })}<button type="button" onClick={add} className="rounded-xl border border-[#c9dff7] bg-[#f4f9ff] px-4 py-2 text-sm font-semibold text-[#0071E3]">+ {kind === "fields" ? "Alan Ekle" : kind === "costs" ? "Maliyet Kalemi Ekle" : kind === "formulas" ? "Formül Ekle" : "Satır Ekle"}</button>
    {kind === "formulas" && <div className="rounded-xl bg-[#f5f5f7] p-4 text-xs text-[#515159]"><p className="font-semibold">Kullanılabilir referanslar</p><p className="mt-2 break-words">{[...template.fields.map((item) => `field.${item.key}`),...template.settings.map((item) => `setting.${item.key}`),...template.costs.map((item) => `cost.${item.key}`),...template.formulas.map((item) => `result.${item.key}`)].join(" · ")}</p><p className="mt-2">İşlemler: +, −, ×, ÷, min, max, ceil, floor, round, abs</p></div>}
  </div>;
}

export function ProfessionBuilder({ initial, professionId, isActive = false, hasPublished = false }: { initial?: ProfessionTemplate | null; professionId?: string | null; isActive?: boolean; hasPublished?: boolean }) {
  const router = useRouter();
  const [template, setTemplate] = useState<ProfessionTemplate>(initial || blank);
  const [texts, setTexts] = useState<Record<CollectionKey, string>>(() => Object.fromEntries(collections.map(([key]) => [key, JSON.stringify((initial || blank)[key] ?? [], null, 2)])) as Record<CollectionKey, string>);
  const [id, setId] = useState(professionId || null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [sampleValues, setSampleValues] = useState<Record<string, string>>({});
  const changeCollection = (key: CollectionKey, value: unknown[]) => setTexts((old) => ({ ...old,
    [key]: JSON.stringify(value.map((item, index) => item && typeof item === "object" && "sortOrder" in item ? { ...item, sortOrder: (index + 1) * 10 } : item), null, 2) }));
  const parsed = useMemo(() => {
    try {
      const result = { ...template } as ProfessionTemplate;
      for (const [key] of collections) {
        const value = JSON.parse(texts[key]);
        if (!Array.isArray(value)) throw new Error(`${key} için bir liste gir.`);
        (result as unknown as Record<string, unknown>)[key] = value;
      }
      try { compileTemplate(result); return { template: result, error: "" }; }
      catch (error) { return { template: result, error: error instanceof Error ? error.message : "Şablon geçersiz." }; }
    } catch (error) { return { template: null, error: error instanceof Error ? error.message : "Şablon geçersiz." }; }
  }, [template, texts]);
  const preview = useMemo(() => {
    if (!parsed.template) return null;
    try {
      const sampleCosts = parsed.template.costs.map((cost) => ({ id: cost.key, business_id: "preview", template_id: cost.key,
        key: cost.key, name: cost.name, category: cost.category, unit: cost.unit, unit_cost: cost.defaultValue,
        metadata: {}, is_active: true, sort_order: cost.sortOrder, created_at: "", updated_at: "" })) as BusinessCostItem[];
      const fields = Object.fromEntries(parsed.template.fields.map((field) => [field.key,
        sampleValues[field.key] === undefined || sampleValues[field.key] === "" ? field.defaultValue ?? null :
          ["number","currency","integer","percentage","quantity"].includes(field.fieldType) ? Number(sampleValues[field.key]) : sampleValues[field.key]]));
      return calculateProfessionJob({ template: parsed.template, fieldValues: fields, businessCosts: sampleCosts });
    } catch { return null; }
  }, [parsed, sampleValues]);
  async function persist(publish: boolean) {
    if (!parsed.template) { setMessage(parsed.error); return; }
    setBusy(true); setMessage("");
    try {
      const saved = await saveProfessionDraft({ professionId: id, template: parsed.template });
      if (!saved.ok) { setMessage(saved.error); return; }
      setId(saved.professionId!);
      if (publish) {
        const result = await publishProfessionDraft(saved.professionId!);
        setMessage(result.ok ? `Sürüm ${result.version} yayınlandı.` : result.error);
      } else setMessage("Taslak kaydedildi.");
      router.replace(`/admin/professions?id=${saved.professionId}`); router.refresh();
    } catch { setMessage("Şablon kaydedilemedi."); }
    finally { setBusy(false); }
  }
  async function discardDraft() {
    if (!id || !window.confirm("Yayınlanmamış taslak silinsin mi?")) return;
    setBusy(true); const result = await deleteProfessionDraft(id); setBusy(false);
    setMessage(result.ok ? "Taslak silindi." : result.error);
    router.push(hasPublished ? `/admin/professions?id=${id}` : "/admin/professions"); router.refresh();
  }
  async function toggleArchive() {
    if (!id) return;
    setBusy(true); const result = await setProfessionArchived(id, isActive); setBusy(false);
    setMessage(result.ok ? isActive ? "Meslek arşivlendi." : "Meslek yeniden açıldı." : result.error);
    router.refresh();
  }
  return <div className="space-y-5"><Card className="p-5 sm:p-7"><h2 className="text-lg font-semibold">Meslek bilgileri</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Meslek adı<input value={template.name} onChange={(e) => setTemplate({ ...template, name: e.target.value })} className={inputClass} placeholder="Örn. Klimacı" /></label><label className="text-sm font-medium">Kısa kod<input value={template.slug} disabled={!!id} onChange={(e) => setTemplate({ ...template, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })} className={inputClass} placeholder="klimaci" /></label><label className="text-sm font-medium">Kategori<input value={template.category} onChange={(e) => setTemplate({ ...template, category: e.target.value })} className={inputClass} /></label><label className="text-sm font-medium">İkon adı<input value={template.icon} onChange={(e) => setTemplate({ ...template, icon: e.target.value })} className={inputClass} /></label><label className="text-sm font-medium sm:col-span-2">Açıklama<textarea value={template.description} onChange={(e) => setTemplate({ ...template, description: e.target.value })} rows={2} className={`${inputClass} py-3`} /></label></div></Card>
    {collections.map(([key, label, hint]) => <Card key={key} className="p-5 sm:p-7"><h2 className="text-lg font-semibold">{label}</h2><p className="mt-1 text-xs text-[#6E6E73]">{hint}</p>{parsed.template && <CollectionControls kind={key} template={parsed.template} change={changeCollection} />}<details className="mt-5 border-t border-[#ececf0] pt-4"><summary className="cursor-pointer text-xs font-semibold text-[#6E6E73]">Gelişmiş JSON düzenleme</summary><textarea aria-label={label} spellCheck={false} value={texts[key]} onChange={(e) => setTexts({ ...texts, [key]: e.target.value })} rows={Math.max(5, Math.min(18, texts[key].split("\n").length + 1))} className="mt-4 w-full rounded-xl border border-[#d5d5da] bg-[#fafafc] p-4 font-mono text-xs leading-5 outline-none focus:border-[#0071E3]" /></details></Card>)}
    <Card className="p-5 sm:p-7"><h2 className="text-lg font-semibold">Test et ve yayınla</h2>{parsed.error ? <p role="alert" className="mt-3 text-sm text-[#b3382f]">{parsed.error}</p> : <p className="mt-3 text-sm text-[#247344]">Alanlar ve formül bağımlılıkları geçerli.</p>}{parsed.template && <div className="mt-5"><p className="text-xs font-semibold uppercase tracking-wide text-[#6E6E73]">Örnek iş formu</p><div className="mt-3 grid gap-3 sm:grid-cols-2">{parsed.template.fields.map((field) => <label key={field.key} className="text-xs font-medium">{field.label}<input value={sampleValues[field.key] ?? String(field.defaultValue ?? "")} onChange={(event) => setSampleValues({ ...sampleValues, [field.key]: event.target.value })} className={inputClass} /></label>)}</div></div>}{preview && <div className="mt-5 rounded-xl bg-[#f5f5f7] p-4"><p className="text-sm">Örnek maliyet: <strong>{preview.totalCost.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</strong></p><div className="mt-3 space-y-1 text-xs text-[#6E6E73]">{preview.costBreakdown.map((line) => <p key={`${line.key}-${line.metadata.formula_key}`}>{line.name}: {line.total_cost.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</p>)}</div></div>}{message && <p role="status" className="mt-4 text-sm">{message}</p>}<div className="mt-5 flex flex-wrap gap-3"><Button onClick={() => persist(false)} disabled={busy || !!parsed.error}>{busy ? "Kaydediliyor..." : "Taslağı Kaydet"}</Button><Button variant="secondary" onClick={() => persist(true)} disabled={busy || !!parsed.error || !parsed.template?.fields.length || !parsed.template?.costs.length || !parsed.template?.formulas.length || !parsed.template?.quoteItems.length}>Yayınla</Button>{id && <Button variant="secondary" onClick={discardDraft} disabled={busy}>Taslağı Sil</Button>}{id && hasPublished && <Button variant="secondary" onClick={toggleArchive} disabled={busy}>{isActive ? "Arşivle" : "Yeniden Aç"}</Button>}</div></Card>
  </div>;
}
