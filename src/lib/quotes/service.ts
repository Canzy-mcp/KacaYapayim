import { logFailure } from "@/lib/observability/log";
import { createClient } from "@/lib/supabase/server";
import { requireCompletedViewer } from "@/lib/viewer";
import { todayInIstanbul } from "@/lib/quotes/defaults";
import { isJobId } from "@/lib/jobs/service";
import type { Customer, Quote, QuoteExclusion, QuoteItem, QuoteStatus } from "@/types/database";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isQuoteId(value: string) { return uuid.test(value); }

export function effectiveQuoteStatus(quote: Pick<Quote, "status" | "valid_until">, today = todayInIstanbul()): QuoteStatus {
  return ["ready", "sent", "viewed"].includes(quote.status) && quote.valid_until < today ? "expired" : quote.status;
}

export async function getQuoteBundle(id: string) {
  const viewer = await requireCompletedViewer();
  if (!isQuoteId(id)) return null;
  const supabase = await createClient();
  const { data: quote, error } = await supabase.from("quotes").select("*").eq("id", id)
    .eq("business_id", viewer.business!.id).maybeSingle();
  if (error) { logFailure("Quote read failed"); throw new Error("Teklif bilgileri yüklenemedi."); }
  if (!quote) return null;
  const [itemsResult, exclusionsResult, customerResult] = await Promise.all([
    supabase.from("quote_items").select("*").eq("quote_id", id).order("sort_order"),
    supabase.from("quote_exclusions").select("*").eq("quote_id", id).order("sort_order"),
    quote.customer_id ? supabase.from("customers").select("*").eq("id", quote.customer_id)
      .eq("business_id", viewer.business!.id).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  if (itemsResult.error || exclusionsResult.error || customerResult.error) {
    logFailure("Quote bundle read failed");
    throw new Error("Teklif bilgileri yüklenemedi.");
  }
  return { quote: quote as Quote, items: (itemsResult.data || []) as QuoteItem[],
    exclusions: (exclusionsResult.data || []) as QuoteExclusion[], customer: customerResult.data as Customer | null,
    business: viewer.business! };
}

export async function getQuotes(limit = 100) {
  const viewer = await requireCompletedViewer();
  const supabase = await createClient();
  const { data: quotes, error } = await supabase.from("quotes").select("*").eq("business_id", viewer.business!.id)
    .order("created_at", { ascending: false }).limit(Math.max(1, Math.min(limit, 200)));
  if (error) { logFailure("Quote list failed"); throw new Error("Teklifler yüklenemedi."); }
  const rows = (quotes || []) as Quote[];
  const ids = [...new Set(rows.map((quote) => quote.customer_id).filter((id): id is string => Boolean(id)))];
  const customers = ids.length ? await supabase.from("customers").select("id,name").eq("business_id", viewer.business!.id).in("id", ids) : { data: [], error: null };
  if (customers.error) { logFailure("Quote customer list failed"); throw new Error("Teklifler yüklenemedi."); }
  const names = new Map((customers.data || []).map((customer) => [customer.id, customer.name]));
  return rows.map((quote) => ({ quote, customerName: quote.customer_id ? names.get(quote.customer_id) || "Müşteri" : "Müşteri seçilmedi" }));
}

export async function getQuotesForJob(jobId: string) {
  const viewer = await requireCompletedViewer();
  if (!isJobId(jobId)) return [] as Quote[];
  const supabase = await createClient();
  const { data, error } = await supabase.from("quotes").select("*").eq("business_id", viewer.business!.id)
    .eq("job_id", jobId).order("created_at", { ascending: false }).limit(10);
  if (error) { logFailure("Job quote list failed"); throw new Error("Teklifler yüklenemedi."); }
  return (data || []) as Quote[];
}

export async function getQuotesForCustomer(customerId: string) {
  const viewer = await requireCompletedViewer();
  const supabase = await createClient();
  const { data, error } = await supabase.from("quotes").select("*").eq("business_id", viewer.business!.id)
    .eq("customer_id", customerId).order("created_at", { ascending: false }).limit(10);
  if (error) { logFailure("Customer quote list failed"); throw new Error("Teklifler yüklenemedi."); }
  return (data || []) as Quote[];
}
