"use server";
import { logFailure } from "@/lib/observability/log";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCompletedViewer } from "@/lib/viewer";
import { categoryOptions, unitOptions, painterSettingsDefaults } from "@/lib/costs/catalog";
import { parseCostInput } from "@/lib/costs/format";
import type { CostCategory, CostUnit } from "@/types/database";

export type CostActionResult = { ok: boolean; error?: string; fieldErrors?: Record<string, string> };
const failed = "Bu maliyet kaydedilemedi. Tekrar dene.";

export async function setCostFavorite(id:string,favorite:boolean){
 const viewer=await requireCompletedViewer();
 if(!/^[0-9a-f-]{36}$/i.test(id)||typeof favorite!=="boolean")return {ok:false};
 const r=await (await createClient()).from("business_cost_items").update({is_favorite:favorite}).eq("id",id).eq("business_id",viewer.business!.id).select("id").maybeSingle();
 revalidatePath("/costs");revalidatePath("/new-quote");return {ok:!r.error&&!!r.data};
}

function parseItem(form: FormData) {
  const name = String(form.get("name") || "").trim();
  const category = String(form.get("category") || "") as CostCategory;
  const unit = String(form.get("unit") || "") as CostUnit;
  const unitCost = parseCostInput(String(form.get("unit_cost") || ""));
  const fieldErrors: Record<string, string> = {};
  if (!name || name.length > 120) fieldErrors.name = "1–120 karakterlik bir maliyet adı gir.";
  if (!categoryOptions.some((item) => item.value === category)) fieldErrors.category = "Bir kategori seç.";
  if (!unitOptions.some((item) => item.value === unit)) fieldErrors.unit = "Bir birim seç.";
  if (unitCost === null) fieldErrors.unit_cost = "Geçerli, negatif olmayan bir tutar gir.";
  return { name, category, unit, unitCost, isActive: form.get("is_active") === "on", fieldErrors };
}

export async function createBusinessCost(form: FormData): Promise<CostActionResult> {
  const item = parseItem(form);
  if (Object.keys(item.fieldErrors).length) return { ok: false, fieldErrors: item.fieldErrors };
  const viewer = await requireCompletedViewer();
  const supabase = await createClient();
  const { error } = await supabase.from("business_cost_items").insert({
    business_id: viewer.business!.id,
    template_id: null,
    key: `custom_${crypto.randomUUID().replaceAll("-", "")}`,
    name: item.name,
    category: item.category,
    unit: item.unit,
    unit_cost: item.unitCost!,
    is_active: item.isActive,
  });
  if (error) { logFailure("Cost create failed"); return { ok: false, error: failed }; }
  revalidatePath("/costs");
  return { ok: true };
}

export async function updateBusinessCost(id: string, form: FormData): Promise<CostActionResult> {
  const item = parseItem(form);
  if (Object.keys(item.fieldErrors).length) return { ok: false, fieldErrors: item.fieldErrors };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, error: failed };
  const viewer = await requireCompletedViewer();
  const supabase = await createClient();
  const { data, error } = await supabase.from("business_cost_items").update({
    name: item.name,
    category: item.category,
    unit: item.unit,
    unit_cost: item.unitCost!,
    is_active: item.isActive,
  }).eq("id", id).eq("business_id", viewer.business!.id).select("id").maybeSingle();
  if (error || !data) { logFailure("Cost update failed"); return { ok: false, error: failed }; }
  revalidatePath("/costs");
  return { ok: true };
}

export async function deleteCustomCost(id: string): Promise<CostActionResult> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, error: "Maliyet silinemedi. Tekrar dene." };
  const viewer = await requireCompletedViewer();
  const supabase = await createClient();
  const { data, error } = await supabase.from("business_cost_items").delete().eq("id", id).eq("business_id", viewer.business!.id).is("template_id", null).select("id").maybeSingle();
  if (error || !data) { logFailure("Cost delete failed"); return { ok: false, error: "Maliyet silinemedi. Tekrar dene." }; }
  revalidatePath("/costs");
  return { ok: true };
}

export async function restoreCostDefaults(): Promise<CostActionResult> {
  const viewer = await requireCompletedViewer();
  if (!viewer.business?.profession_id) return { ok: false, error: "Bu meslek için hazır şablon bulunmuyor." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("ensure_my_cost_defaults");
  if (error) { logFailure("Cost restore failed"); return { ok: false, error: "Hazır maliyetler yüklenemedi. Tekrar dene." }; }
  revalidatePath("/costs");
  return { ok: true };
}

export async function savePainterSettings(form: FormData): Promise<CostActionResult> {
  const viewer = await requireCompletedViewer();
  const business = viewer.business!;
  if (business.profession !== "Boyacı" || !business.profession_id) return { ok: false, error: "Bu ayarlar yalnızca Boyacı mesleği için kullanılabilir." };
  const fieldErrors: Record<string, string> = {};
  const settings: Record<string, number> = {};
  for (const key of Object.keys(painterSettingsDefaults)) {
    const value = parseCostInput(String(form.get(key) || ""));
    const max = key === "waste_percentage" ? 100 : 1000;
    if (value === null || value > max || (key !== "waste_percentage" && value === 0)) {
      fieldErrors[key] = key === "waste_percentage" ? "0–100 arasında bir oran gir." : "0'dan büyük, en fazla 1.000 m² olan bir değer gir.";
    } else settings[key] = value;
  }
  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors };
  const supabase = await createClient();
  const { error } = await supabase.from("business_profession_settings").upsert({
    business_id: business.id,
    profession_id: business.profession_id,
    settings,
  }, { onConflict: "business_id,profession_id" });
  if (error) { logFailure("Painter settings update failed"); return { ok: false, error: "İş ayarları kaydedilemedi. Tekrar dene." }; }
  revalidatePath("/costs");
  return { ok: true };
}
