import { logFailure } from "@/lib/observability/log";
import { createClient } from "@/lib/supabase/server";
import { requireCompletedViewer } from "@/lib/viewer";
import type { Customer } from "@/types/database";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isCustomerId(value: string) { return uuidPattern.test(value); }

export type CustomerListOptions = { query?: string; archived?: boolean; page?: number };
const pageSize = 50;

export async function getCustomers({ query = "", archived = false, page = 1 }: CustomerListOptions = {}) {
  const viewer = await requireCompletedViewer();
  const supabase = await createClient();
  const safePage = Number.isSafeInteger(page) && page > 0 ? page : 1;
  const safeQuery = query.trim().slice(0, 80).replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
  let request = supabase.from("customers").select("*", { count: "exact" })
    .eq("business_id", viewer.business!.id).eq("is_archived", archived);
  if (safeQuery) {
    const compactPhone = safeQuery.replace(/\D/g, "").replace(/^0(?=[2-5])/, "");
    const filters = [`name.ilike.%${safeQuery}%`, `company_name.ilike.%${safeQuery}%`, `phone.ilike.%${safeQuery}%`];
    if (compactPhone.length >= 3 && compactPhone !== safeQuery) filters.push(`phone.ilike.%${compactPhone}%`);
    request = request.or(filters.join(","));
  }
  const { data, count, error } = await request.order("created_at", { ascending: false }).order("id", { ascending: false })
    .range((safePage - 1) * pageSize, safePage * pageSize - 1);
  if (error) { logFailure("Customer list failed"); throw new Error("Müşteriler yüklenemedi."); }
  return { customers: (data || []) as Customer[], count: count || 0, page: safePage, pageSize, query, archived };
}

export async function searchCustomers(query: string, options: Omit<CustomerListOptions, "query"> = {}) {
  return getCustomers({ ...options, query });
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const viewer = await requireCompletedViewer();
  if (!isCustomerId(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("customers").select("*").eq("id", id).eq("business_id", viewer.business!.id).maybeSingle();
  if (error) { logFailure("Customer detail failed"); throw new Error("Müşteri yüklenemedi."); }
  return data as Customer | null;
}

export async function checkDuplicateCustomer(phone: string, excludeId?: string) {
  const viewer = await requireCompletedViewer();
  const supabase = await createClient();
  let request = supabase.from("customers").select("id,name,is_archived").eq("business_id", viewer.business!.id).eq("phone", phone);
  if (excludeId && isCustomerId(excludeId)) request = request.neq("id", excludeId);
  const { data, error } = await request.limit(1).maybeSingle();
  if (error) { logFailure("Customer duplicate check failed"); throw new Error("Telefon numarası kontrol edilemedi."); }
  return data;
}
