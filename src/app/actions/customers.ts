"use server";
import { logFailure } from "@/lib/observability/log";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCompletedViewer } from "@/lib/viewer";
import { checkDuplicateCustomer, isCustomerId } from "@/lib/customers/service";
import { customerSources } from "@/lib/customers/catalog";
import { normalizeTurkishPhone } from "@/lib/customers/format";
import type { CustomerInsert, CustomerSource, CustomerUpdate } from "@/types/database";

export type CustomerActionResult = {
  ok: boolean; id?: string; error?: string; fieldErrors?: Record<string, string>;
  needsUpgrade?: boolean;
  duplicate?: { id: string; name: string; is_archived: boolean };
};

function field(form: FormData, key: string, max: number): string {
  return String(form.get(key) || "").trim().replace(/\s+/g, " ").slice(0, max + 1);
}

function parseCustomer(form: FormData) {
  const name = field(form, "name", 120);
  const rawPhone = field(form, "phone", 40);
  const phone = rawPhone ? normalizeTurkishPhone(rawPhone) : null;
  const email = field(form, "email", 254).toLowerCase();
  const company_name = field(form, "company_name", 160);
  const city = field(form, "city", 100);
  const district = field(form, "district", 100);
  const address = field(form, "address", 500);
  const notes = String(form.get("notes") || "").trim().slice(0, 2001);
  const source = field(form, "source", 40) as CustomerSource | "";
  const fieldErrors: Record<string, string> = {};
  if (!name || name.length > 120) fieldErrors.name = "Müşteri adını gir (en fazla 120 karakter).";
  if (rawPhone && !phone) fieldErrors.phone = "Telefonu 05XX XXX XX XX biçiminde gir.";
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) fieldErrors.email = "Geçerli bir e-posta adresi gir.";
  for (const [key, value, max] of [["company_name", company_name, 160], ["city", city, 100], ["district", district, 100], ["address", address, 500], ["notes", notes, 2000]] as const) {
    if (value.length > max) fieldErrors[key] = `En fazla ${max} karakter gir.`;
  }
  if (source && !customerSources.some((item) => item.value === source)) fieldErrors.source = "Geçerli bir kaynak seç.";
  const values = { name, phone, email: email || null, company_name: company_name || null, city: city || null,
    district: district || null, address: address || null, notes: notes || null, source: source || null };
  return { values, fieldErrors };
}

export async function createCustomer(form: FormData): Promise<CustomerActionResult> {
  const parsed = parseCustomer(form);
  if (Object.keys(parsed.fieldErrors).length) return { ok: false, fieldErrors: parsed.fieldErrors };
  const viewer = await requireCompletedViewer();
  try {
    if (parsed.values.phone && form.get("allow_duplicate") !== "true") {
      const duplicate = await checkDuplicateCustomer(parsed.values.phone);
      if (duplicate) return { ok: false, duplicate };
    }
    const supabase = await createClient();
    const values: CustomerInsert = { ...parsed.values, business_id: viewer.business!.id };
    const { data, error } = await supabase.from("customers").insert(values).select("id").single();
    if (error || !data) { logFailure("Customer create failed"); if (error?.message.includes("BILLING_CUSTOMER_LIMIT")) return { ok: false, error: "Aktif müşteri sınırına ulaştın. Yeni müşteri için paketini yükseltebilir veya eski bir müşteriyi arşivleyebilirsin.", needsUpgrade: true }; return { ok: false, error: "Müşteri kaydedilemedi. Tekrar dene." }; }
    revalidatePath("/customers");
    return { ok: true, id: data.id };
  } catch (error) { logFailure("Customer create failed"); return { ok: false, error: "Müşteri kaydedilemedi. Tekrar dene." }; }
}

export async function updateCustomer(id: string, form: FormData): Promise<CustomerActionResult> {
  if (!isCustomerId(id)) return { ok: false, error: "Müşteri bulunamadı." };
  const parsed = parseCustomer(form);
  if (Object.keys(parsed.fieldErrors).length) return { ok: false, fieldErrors: parsed.fieldErrors };
  const viewer = await requireCompletedViewer();
  const supabase = await createClient();
  try {
    const { data: existing, error: readError } = await supabase.from("customers").select("phone").eq("id", id).eq("business_id", viewer.business!.id).maybeSingle();
    if (readError || !existing) return { ok: false, error: "Müşteri bulunamadı." };
    if (parsed.values.phone && parsed.values.phone !== existing.phone && form.get("allow_duplicate") !== "true") {
      const duplicate = await checkDuplicateCustomer(parsed.values.phone, id);
      if (duplicate) return { ok: false, duplicate };
    }
    const values: CustomerUpdate = parsed.values;
    const { data, error } = await supabase.from("customers").update(values).eq("id", id).eq("business_id", viewer.business!.id).select("id").maybeSingle();
    if (error || !data) { logFailure("Customer update failed"); return { ok: false, error: "Müşteri bilgileri kaydedilemedi. Tekrar dene." }; }
    revalidatePath("/customers"); revalidatePath(`/customers/${id}`);
    return { ok: true, id };
  } catch (error) { logFailure("Customer update failed"); return { ok: false, error: "Müşteri bilgileri kaydedilemedi. Tekrar dene." }; }
}

async function setCustomerArchived(id: string, isArchived: boolean): Promise<CustomerActionResult> {
  if (!isCustomerId(id)) return { ok: false, error: "Müşteri bulunamadı." };
  const viewer = await requireCompletedViewer();
  const supabase = await createClient();
  const { data, error } = await supabase.from("customers").update({ is_archived: isArchived }).eq("id", id)
    .eq("business_id", viewer.business!.id).eq("is_archived", !isArchived).select("id").maybeSingle();
  if (error || !data) { logFailure("Customer archive change failed"); return { ok: false, error: "İşlem tamamlanamadı. Tekrar dene." }; }
  revalidatePath("/customers"); revalidatePath(`/customers/${id}`);
  return { ok: true, id };
}

export async function archiveCustomer(id: string) { return setCustomerArchived(id, true); }
export async function restoreCustomer(id: string) { return setCustomerArchived(id, false); }
