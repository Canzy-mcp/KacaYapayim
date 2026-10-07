"use client";

import { CostFavorites } from "./favorites";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Info, Plus, RotateCcw, X } from "lucide-react";
import { Button, Card, Input, Select } from "@/components/ui";
import { Toast } from "@/components/ui/toast";
import { categoryOptions, unitOptions, unitDisplay, type PainterSettings } from "@/lib/costs/catalog";
import { formatMoney } from "@/lib/costs/format";
import { createBusinessCost, deleteCustomCost, restoreCostDefaults, savePainterSettings, updateBusinessCost, type CostActionResult } from "@/app/actions/costs";
import type { BusinessCostItem, CostCategory } from "@/types/database";

type Props = { costs: BusinessCostItem[]; painterSettings: PainterSettings | null; isPainter: boolean; hasTemplate: boolean };
type Notice = { message: string; kind: "success" | "error" };
const groups: { title: string; categories: CostCategory[] }[] = [
  { title: "Malzeme", categories: ["material"] },
  { title: "İşçilik", categories: ["labor"] },
  { title: "Diğer", categories: ["consumable", "transport", "overhead", "other"] },
];
const painterFields: { key: keyof PainterSettings; label: string; help: string; suffix: string }[] = [
  { key: "paint_coverage_per_liter", label: "1 litre boya kaç m² boyuyor?", help: "Tek kat uygulama için ortalama değer.", suffix: "m² / litre / kat" },
  { key: "primer_coverage_per_liter", label: "1 litre astar kaç m² uyguluyor?", help: "Tek kat astar uygulaması için.", suffix: "m² / litre" },
  { key: "ceiling_paint_coverage_per_liter", label: "1 litre tavan boyası kaç m² boyuyor?", help: "Tek kat uygulama için ortalama değer.", suffix: "m² / litre / kat" },
  { key: "putty_kg_per_square_meter", label: "1 m² için kaç kg macun gerekiyor?", help: "Macun uygulanacak alan için ortalama tüketim.", suffix: "kg / m²" },
  { key: "waste_percentage", label: "Fire payı", help: "Dökülme ve ek malzeme ihtiyacı için pay.", suffix: "%" },
];

export function CostsView({ costs, painterSettings, isPainter, hasTemplate }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState<BusinessCostItem | "new" | null>(null);
  const [confirmation, setConfirmation] = useState<"restore" | "delete" | null>(null);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const [settingsPending, setSettingsPending] = useState(false);
  const [settingsErrors, setSettingsErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!editing && !confirmation) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape" && !pending) { setEditing(null); setConfirmation(null); } };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", onKey); };
  }, [editing, confirmation, pending]);
  const show = (message: string, kind: Notice["kind"] = "success") => setNotice({ message, kind });
  const open = (item: BusinessCostItem | "new") => { setErrors({}); setEditing(item); };
  const close = () => { if (!pending) { setEditing(null); setConfirmation(null); } };
  const handleResult = (result: CostActionResult, success: string) => {
    if (!result.ok) { setErrors(result.fieldErrors || {}); show(result.error || "Lütfen alanları kontrol et.", "error"); return false; }
    setEditing(null); setConfirmation(null); show(success); router.refresh(); return true;
  };
  async function submitCost(form: FormData) {
    if (!editing) return;
    setPending(true); setErrors({});
    try {
      const result = editing === "new" ? await createBusinessCost(form) : await updateBusinessCost(editing.id, form);
      const price = formatMoney(Number(String(form.get("unit_cost")).replace(",", ".")));
      const name = String(form.get("name"));
      handleResult(result, editing === "new" ? `${name} eklendi.` : `${name} ${price} olarak güncellendi.`);
    } catch { show("Bu maliyet kaydedilemedi. Tekrar dene.", "error"); }
    finally { setPending(false); }
  }
  async function confirmAction() {
    if (!confirmation) return;
    setPending(true);
    try {
      const result = confirmation === "restore" ? await restoreCostDefaults() : editing && editing !== "new" ? await deleteCustomCost(editing.id) : { ok: false, error: "Maliyet silinemedi." };
      handleResult(result, confirmation === "restore" ? "Eksik hazır maliyetler eklendi. Mevcut fiyatların korundu." : "Maliyet silindi.");
    } catch { show("İşlem tamamlanamadı. Tekrar dene.", "error"); }
    finally { setPending(false); }
  }
  async function submitSettings(form: FormData) {
    setSettingsPending(true); setSettingsErrors({});
    try {
      const result = await savePainterSettings(form);
      if (result.ok) { show("İş ayarları kaydedildi."); router.refresh(); }
      else { setSettingsErrors(result.fieldErrors || {}); show(result.error || "Lütfen alanları kontrol et.", "error"); }
    } catch { show("İş ayarları kaydedilemedi. Tekrar dene.", "error"); }
    finally { setSettingsPending(false); }
  }

  return <div className="mx-auto max-w-[1000px]">
    <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div><h1 className="text-[34px] font-semibold leading-[1.08] tracking-[-0.055em] sm:text-[42px]">Maliyetlerim</h1><p className="mt-3 max-w-2xl text-[15px] leading-6 text-[#6E6E73]">Tekliflerini hesaplarken kullanacağımız kendi maliyetlerini burada belirle.</p></div>
      <Button className="min-h-12 w-full shrink-0 sm:w-auto" onClick={() => open("new")}><Plus size={18} />Maliyet Ekle</Button>
    </header>
    <div className="mb-9 flex gap-3 rounded-[20px] border border-[#d7e8fa] bg-[#edf5ff] px-5 py-5 sm:px-6"><Info size={20} className="mt-0.5 shrink-0 text-[#0071E3]" /><div><p className="font-semibold">Bu değerler yalnızca sana ait.</p><p className="mt-1 text-[14px] leading-6 text-[#4d5968]">Malzeme ve işçilik fiyatların değiştiğinde buradan güncelleyebilirsin. Yeni teklifler güncel maliyetlerini kullanır.</p></div></div>
    <CostFavorites costs={costs}/>
    {!costs.length && <Card className="px-5 py-10 text-center sm:px-10"><h2 className="text-[21px] font-semibold tracking-tight">Maliyetlerini oluşturalım.</h2><p className="mx-auto mt-2 max-w-md text-[14px] leading-6 text-[#6E6E73]">İşlerinin gerçek maliyetini hesaplayabilmemiz için kullandığın malzeme ve işçilik fiyatlarını ekle.</p>{!hasTemplate && <p className="mt-3 text-[13px] text-[#6E6E73]">Henüz hazır meslek şablonun yok. Kendi maliyetlerini eklemeye başlayabilirsin.</p>}<div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">{hasTemplate && <Button onClick={() => setConfirmation("restore")}>Hazır Şablonu Kullan</Button>}<Button variant={hasTemplate ? "secondary" : "primary"} onClick={() => open("new")}>Kendim Ekle</Button></div></Card>}
    {costs.length > 0 && groups.map((group) => {
      const items = costs.filter((item) => group.categories.includes(item.category));
      if (!items.length) return null;
      return <section key={group.title} className="mb-9"><h2 className="mb-3 px-1 text-[18px] font-semibold tracking-[-0.025em]">{group.title}</h2><Card className="overflow-hidden">{items.map((item) => <button key={item.id} type="button" onClick={() => open(item)} className="flex min-h-[76px] w-full items-center justify-between gap-3 border-b border-[#ececf0] px-5 py-4 text-left transition-colors hover:bg-[#f9f9fb] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#0071E3] last:border-0 sm:px-6"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-[15px] font-semibold">{item.name}</span>{!item.is_active && <span className="rounded-full bg-[#f1f1f3] px-2 py-0.5 text-[11px] font-medium text-[#6E6E73]">Pasif</span>}</div><span className="mt-1 block text-xs text-[#6E6E73]">Güncelleme: {new Date(item.updated_at).toLocaleDateString("tr-TR",{timeZone:"Europe/Istanbul"})}{Date.now()-Date.parse(item.updated_at)>30*86400000?" · Fiyatı yeniden kontrol et":""}</span><span className="mt-1 block text-[13px] text-[#6E6E73]">{categoryOptions.find((option) => option.value === item.category)?.label}</span></div><div className="flex shrink-0 items-center gap-2 sm:gap-4"><span className="text-right text-[14px] font-semibold tabular-nums sm:text-[15px]">{formatMoney(item.unit_cost)}<span className="block text-[12px] font-normal text-[#6E6E73]">/ {unitDisplay(item.unit)}</span></span><ChevronRight size={17} className="text-[#a0a0a6]" /></div></button>)}</Card></section>;
    })}
    {isPainter && <section className="mt-10"><div className="mb-4"><h2 className="text-[20px] font-semibold tracking-[-0.03em]">İş Ayarları</h2><p className="mt-1 text-[14px] text-[#6E6E73]">Malzeme ihtiyacını hesaplarken kullanacağımız değerler.</p></div><Card className="p-5 sm:p-6"><form action={submitSettings} key={JSON.stringify(painterSettings)}><div className="grid gap-5 sm:grid-cols-2">{painterFields.map((field) => <div key={field.key}><label htmlFor={field.key} className="block text-[14px] font-semibold">{field.label}</label><p className="mt-1 text-[12px] leading-5 text-[#6E6E73]">{field.help}</p><div className="mt-2 flex items-center gap-3"><input id={field.key} name={field.key} type="text" inputMode="decimal" defaultValue={painterSettings?.[field.key] ?? 10} aria-invalid={Boolean(settingsErrors[field.key])} aria-describedby={settingsErrors[field.key] ? `${field.key}-error` : undefined} className="h-12 w-24 rounded-[13px] border border-[#D2D2D7] bg-white px-4 text-[16px] outline-none focus:border-[#0071E3] focus:ring-3 focus:ring-[#0071E3]/15" /><span className="text-[13px] text-[#6E6E73]">{field.suffix}</span></div>{settingsErrors[field.key] && <p id={`${field.key}-error`} className="mt-1 text-[12px] text-[#c7352d]">{settingsErrors[field.key]}</p>}</div>)}</div><div className="mt-6 border-t border-[#ececf0] pt-5"><Button type="submit" disabled={settingsPending} className="w-full sm:w-auto">{settingsPending ? "Kaydediliyor..." : "İş Ayarlarını Kaydet"}</Button></div></form></Card></section>}
    {hasTemplate && costs.length > 0 && <button type="button" onClick={() => setConfirmation("restore")} className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-[13px] font-medium text-[#6E6E73] hover:bg-black/5 hover:text-[#1D1D1F]"><RotateCcw size={15} />Varsayılanları Geri Yükle</button>}

    {editing && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}><div role="dialog" aria-modal="true" aria-labelledby="cost-dialog-title" className="max-h-[94dvh] w-full overflow-y-auto rounded-t-[24px] bg-white shadow-2xl sm:max-w-[520px] sm:rounded-[22px]"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#ececf0] bg-white px-5 py-4 sm:px-6"><h2 id="cost-dialog-title" className="text-[20px] font-semibold tracking-tight">{editing === "new" ? "Maliyet Ekle" : "Maliyeti Düzenle"}</h2><button type="button" aria-label="Kapat" onClick={close} className="flex size-10 items-center justify-center rounded-full hover:bg-[#f1f1f3]"><X size={20} /></button></div><form action={submitCost} key={editing === "new" ? "new" : editing.id} className="space-y-4 px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-5 sm:px-6">
      <div><Input id="cost-name" name="name" label="Maliyet adı" maxLength={120} required defaultValue={editing === "new" ? "" : editing.name} placeholder="Örn. Koruma Naylonu" />{errors.name && <p className="mt-1 text-[12px] text-[#c7352d]">{errors.name}</p>}</div>
      <div className="grid gap-4 sm:grid-cols-2"><div><Select id="cost-category" name="category" label="Kategori" defaultValue={editing === "new" ? "material" : editing.category}>{categoryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select>{errors.category && <p className="mt-1 text-[12px] text-[#c7352d]">{errors.category}</p>}</div><div><Select id="cost-unit" name="unit" label="Birim" defaultValue={editing === "new" ? "piece" : editing.unit}>{unitOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select>{errors.unit && <p className="mt-1 text-[12px] text-[#c7352d]">{errors.unit}</p>}</div></div>
      <div><Input id="cost-price" name="unit_cost" label="Birim maliyet (TL)" inputMode="decimal" required defaultValue={editing === "new" ? "" : editing.unit_cost} placeholder="0" />{errors.unit_cost && <p className="mt-1 text-[12px] text-[#c7352d]">{errors.unit_cost}</p>}</div>
      {editing !== "new" && typeof editing.metadata?.description === "string" && <p className="rounded-xl bg-[#f5f5f7] px-4 py-3 text-[13px] leading-5 text-[#6E6E73]">{editing.metadata.description}</p>}
      <label className="flex min-h-12 items-center justify-between rounded-[13px] border border-[#e5e5e9] px-4 text-[14px] font-medium"><span>Hesaplamalarda aktif</span><input type="checkbox" name="is_active" defaultChecked={editing === "new" || editing.is_active} className="size-5 accent-[#0071E3]" /></label>
      <div className="sticky bottom-0 z-10 flex flex-col gap-2 border-t border-[#ececf0] bg-white py-3 sm:static sm:flex-row-reverse sm:border-0 sm:pt-2"><Button type="submit" disabled={pending} className="w-full sm:flex-1">{pending ? "Kaydediliyor..." : "Kaydet"}</Button><Button type="button" variant="secondary" onClick={close} disabled={pending} className="w-full sm:w-auto">Vazgeç</Button></div>
      {editing !== "new" && !editing.template_id && <button type="button" disabled={pending} onClick={() => setConfirmation("delete")} className="min-h-11 w-full rounded-xl text-[13px] font-medium text-[#c7352d] hover:bg-[#fff0ef]">Bu maliyeti sil</button>}
      {editing !== "new" && editing.template_id && <p className="text-center text-[12px] text-[#6E6E73]">Hazır maliyetleri kaldırmak için pasif yapabilirsin.</p>}
    </form></div></div>}
    {confirmation && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-5" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) setConfirmation(null); }}><div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-[410px] rounded-[20px] bg-white p-6 shadow-2xl"><h2 id="confirm-title" className="text-[19px] font-semibold tracking-tight">{confirmation === "restore" ? "Hazır maliyetleri ekle" : "Maliyeti sil"}</h2><p className="mt-2 text-[14px] leading-6 text-[#6E6E73]">{confirmation === "restore" ? "Boyacı varsayılan maliyetlerini yeniden eklemek istediğine emin misin? Mevcut fiyatların korunur; yalnızca eksik kalemler eklenir." : "Bu maliyeti silmek istediğine emin misin?"}</p><div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse"><Button variant={confirmation === "delete" ? "danger" : "primary"} disabled={pending} onClick={confirmAction} className="w-full sm:w-auto">{pending ? "İşleniyor..." : confirmation === "delete" ? "Sil" : "Eksikleri Ekle"}</Button><Button variant="secondary" disabled={pending} onClick={() => setConfirmation(null)} className="w-full sm:w-auto">Vazgeç</Button></div></div></div>}
    {notice && <Toast message={notice.message} kind={notice.kind} onClose={() => setNotice(null)} />}
  </div>;
}
