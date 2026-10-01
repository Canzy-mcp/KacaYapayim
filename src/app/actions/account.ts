"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { cleanText, marginErrors, parseMargin, type FieldErrors } from "@/lib/validation";
import { recordEvent } from "@/lib/analytics/events";

export type SaveResult = { ok: boolean; error?: string; fieldErrors?: FieldErrors };
const notReady = "Oturumun sona erdi. Tekrar giriş yap.";

async function authenticatedClient() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return { supabase, userId: data.claims.sub };
}

export async function saveBusinessBasics(form: FormData): Promise<SaveResult> {
  const name = cleanText(form.get("name"), 120);
  const phone = cleanText(form.get("phone"), 30);
  const city = cleanText(form.get("city"), 100);
  if (!name) return { ok: false, fieldErrors: { name: "İşletme adını gir." } };
  const auth = await authenticatedClient();
  if (!auth) return { ok: false, error: notReady };
  const { data: existing, error: readError } = await auth.supabase.from("businesses").select("onboarding_step").eq("owner_id", auth.userId).maybeSingle();
  if (readError) return { ok: false, error: "İşletme bilgileri yüklenemedi. Tekrar dene." };
  const step = existing?.onboarding_step && existing.onboarding_step > 2 ? existing.onboarding_step : 2;
  const { error } = existing
    ? await auth.supabase.from("businesses").update({ name, phone: phone || null, city: city || null, onboarding_step: step }).eq("owner_id", auth.userId)
    : await auth.supabase.from("businesses").insert({ owner_id: auth.userId, name, phone: phone || null, city: city || null, onboarding_step: step });
  if (error) return { ok: false, error: "İşletme bilgileri kaydedilemedi. Tekrar dene." };
  revalidatePath("/onboarding");
  return { ok: true };
}

export async function saveProfession(form: FormData): Promise<SaveResult> {
  const profession = cleanText(form.get("profession"), 100);
  if (!profession) return { ok: false, fieldErrors: { profession: "Bir meslek seç veya mesleğini yaz." } };
  const auth = await authenticatedClient();
  if (!auth) return { ok: false, error: notReady };
  const { data: selectedProfession, error: professionError } = await auth.supabase.from("professions").select("id").eq("name", profession).eq("is_active", true).maybeSingle();
  if (professionError) return { ok: false, error: "Meslek listesi yüklenemedi. Tekrar dene." };
  const { data: existing } = await auth.supabase.from("businesses").select("onboarding_step").eq("owner_id", auth.userId).maybeSingle();
  const { data, error } = await auth.supabase.from("businesses").update({ profession, profession_id: selectedProfession?.id || null, onboarding_step: existing?.onboarding_step === 4 ? 4 : 3 }).eq("owner_id", auth.userId).select("id").single();
  if (error || !data) return { ok: false, error: "Meslek kaydedilemedi. Tekrar dene." };
  revalidatePath("/onboarding");
  return { ok: true };
}

export async function saveMargins(form: FormData): Promise<SaveResult> {
  const target = parseMargin(form.get("target"));
  const minimum = parseMargin(form.get("minimum"));
  const fieldErrors = marginErrors(target, minimum);
  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors };
  const auth = await authenticatedClient();
  if (!auth) return { ok: false, error: notReady };
  const { data, error } = await auth.supabase.from("businesses").update({ default_profit_margin: target, minimum_profit_margin: minimum, onboarding_step: 4 }).eq("owner_id", auth.userId).select("id").single();
  if (error || !data) return { ok: false, error: "Kâr ayarları kaydedilemedi. Tekrar dene." };
  revalidatePath("/onboarding");
  return { ok: true };
}

export async function completeOnboarding(): Promise<SaveResult> {
  const auth = await authenticatedClient();
  if (!auth) return { ok: false, error: notReady };
  const { data: business, error: readError } = await auth.supabase.from("businesses").select("name, profession, default_profit_margin, minimum_profit_margin, onboarding_step").eq("owner_id", auth.userId).single();
  if (readError || !business?.name || !business.profession) return { ok: false, error: "Önce işletme ve meslek bilgilerini tamamla." };
  if (business.onboarding_step !== 4) return { ok: false, error: "Önce kâr ayarlarını tamamla." };
  if (Object.keys(marginErrors(business.default_profit_margin, business.minimum_profit_margin)).length) return { ok: false, error: "Kâr ayarlarını kontrol et." };
  const { error } = await auth.supabase.from("businesses").update({ onboarding_completed: true }).eq("owner_id", auth.userId);
  if (error) return { ok: false, error: "Kurulum tamamlanamadı. Tekrar dene." };
  revalidatePath("/", "layout");
  await recordEvent("onboarding_completed", "/onboarding");
  return { ok: true };
}

export async function saveSettings(form: FormData): Promise<SaveResult> {
  const firstName = cleanText(form.get("firstName"), 100);
  const lastName = cleanText(form.get("lastName"), 100);
  const name = cleanText(form.get("name"), 120);
  const phone = cleanText(form.get("phone"), 30);
  const city = cleanText(form.get("city"), 100);
  const profession = cleanText(form.get("profession"), 100);
  const target = parseMargin(form.get("target"));
  const minimum = parseMargin(form.get("minimum"));
  const fieldErrors: FieldErrors = marginErrors(target, minimum);
  if (!firstName) fieldErrors.firstName = "Adını gir.";
  if (!lastName) fieldErrors.lastName = "Soyadını gir.";
  if (!name) fieldErrors.name = "İşletme adını gir.";
  if (!profession) fieldErrors.profession = "Mesleğini gir.";
  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors };
  const auth = await authenticatedClient();
  if (!auth) return { ok: false, error: notReady };
  const { error } = await auth.supabase.rpc("update_my_settings", {
    p_first_name: firstName,
    p_last_name: lastName,
    p_business_name: name,
    p_phone: phone,
    p_city: city,
    p_profession: profession,
    p_default_profit_margin: target,
    p_minimum_profit_margin: minimum,
  });
  if (error) return { ok: false, error: "Bir sorun oluştu. Tekrar dene." };
  revalidatePath("/", "layout");
  return { ok: true };
}
