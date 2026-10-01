"use server";
import { logFailure } from "@/lib/observability/log";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCompletedViewer } from "@/lib/viewer";
import { getPublishedTemplate } from "@/lib/professions/service";

export async function saveProfessionSettings(values: Record<string, number>) {
  const viewer = await requireCompletedViewer();
  const business = viewer.business!;
  if (!business.profession_id) return { ok: false, error: "Meslek bulunamadı." } as const;
  const template = await getPublishedTemplate(business.profession_id);
  if (!template) return { ok: false, error: "Meslek şablonu bulunamadı." } as const;
  if (!values || Object.keys(values).length !== template.settings.length ||
    Object.keys(values).some((key) => !template.settings.some((setting) => setting.key === key)))
    return { ok: false, error: "Ayar alanlarını kontrol et." } as const;
  for (const setting of template.settings) {
    const value = values[setting.key];
    if (!Number.isFinite(value) || value < (setting.minValue ?? 0) || value > (setting.maxValue ?? 1e9))
      return { ok: false, error: `${setting.name} için geçerli bir değer gir.` } as const;
  }
  const supabase = await createClient();
  const { data: existing, error: readError } = await supabase.from("business_profession_settings")
    .select("id,settings").eq("business_id", business.id).eq("profession_id", business.profession_id).maybeSingle();
  if (readError) return { ok: false, error: "Ayarlar yüklenemedi." } as const;
  const settings = { ...(existing?.settings || {}), ...values };
  const result = existing ? await supabase.from("business_profession_settings").update({ settings }).eq("id", existing.id) :
    await supabase.from("business_profession_settings").insert({ business_id: business.id, profession_id: business.profession_id, settings });
  if (result.error) { logFailure("Profession settings save failed"); return { ok: false, error: "Ayarlar kaydedilemedi." } as const; }
  revalidatePath("/costs");
  return { ok: true } as const;
}
