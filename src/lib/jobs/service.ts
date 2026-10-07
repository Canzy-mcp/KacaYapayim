import { logFailure } from "@/lib/observability/log";
import { createClient } from "@/lib/supabase/server";
import { requireCompletedViewer } from "@/lib/viewer";
import { isCustomerId } from "@/lib/customers/service";
import type { ActualJobCost, Customer, Job, JobStatus, JobCostBreakdown, PainterJobDetail, Quote } from "@/types/database";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isJobId(value: string) { return uuidPattern.test(value); }

export async function getJobById(id: string) {
  const viewer = await requireCompletedViewer();
  if (!isJobId(id)) return null;
  const supabase = await createClient();
  const { data: job, error } = await supabase.from("jobs").select("*").eq("id", id).eq("business_id", viewer.business!.id).maybeSingle();
  if (error) { logFailure("Job read failed"); throw new Error("İş yüklenemedi."); }
  return job as Job | null;
}

export async function getJobBundle(id: string) {
  const job = await getJobById(id);
  if (!job) return null;
  const supabase = await createClient();
  const [detailsResult, linesResult, customerResult, actualResult, quoteResult] = await Promise.all([
    supabase.from("painter_job_details").select("*").eq("job_id", id).maybeSingle(),
    supabase.from("job_cost_breakdown").select("*").eq("job_id", id).order("created_at").order("id"),
    job.customer_id && isCustomerId(job.customer_id)
      ? supabase.from("customers").select("*").eq("id", job.customer_id).eq("business_id", job.business_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase.from("actual_job_costs").select("*").eq("job_id", id).order("created_at").order("id"),
    job.accepted_quote_id ? supabase.from("quotes").select("*").eq("id", job.accepted_quote_id)
      .eq("business_id", job.business_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  if (detailsResult.error || linesResult.error || customerResult.error || actualResult.error || quoteResult.error) {
    logFailure("Job bundle read failed");
    throw new Error("İş yüklenemedi.");
  }
  return { job, details: detailsResult.data as PainterJobDetail | null,
    breakdown: (linesResult.data || []) as JobCostBreakdown[], customer: customerResult.data as Customer | null,
    actualCosts: (actualResult.data || []) as ActualJobCost[], acceptedQuote: quoteResult.data as Quote | null };
}

export async function getRecentJobs(limit = 50) {
  const viewer = await requireCompletedViewer();
  const supabase = await createClient();
  const { data, error } = await supabase.from("jobs").select("*").eq("business_id", viewer.business!.id)
    .order("created_at", { ascending: false }).limit(Math.max(1, Math.min(limit, 50)));
  if (error) { logFailure("Job list failed"); throw new Error("İşler yüklenemedi."); }
  return (data || []) as Job[];
}

export async function searchJobs({ status = "all", query = "", page = 1, from = "", to = "" }) {
  const viewer = await requireCompletedViewer();
  const client = await createClient();
  let request = client.from("jobs").select("*", { count: "exact" }).eq("business_id", viewer.business!.id);
  if (["draft", "calculated", "quoted", "accepted", "scheduled", "in_progress", "completed", "cancelled"].includes(status)) request = request.eq("status", status as JobStatus);
  const term = query.trim().slice(0, 100).replace(/[%_\\]/g, "");
  if (term) request = request.ilike("title", `%${term}%`);
  if (/^\d{4}-\d{2}-\d{2}$/.test(from) && Number.isFinite(Date.parse(from)) && new Date(from).toISOString().slice(0,10) === from) request = request.gte("created_at", `${from}T00:00:00+03:00`);
  if (/^\d{4}-\d{2}-\d{2}$/.test(to) && Number.isFinite(Date.parse(to)) && new Date(to).toISOString().slice(0,10) === to) request = request.lte("created_at", `${to}T23:59:59.999999+03:00`);
  const safePage = Number.isSafeInteger(page) && page > 0 ? Math.min(page, 100000) : 1;
  const { data, error, count } = await request.order("created_at", { ascending: false }).order("id", { ascending: false }).range((safePage - 1) * 25, safePage * 25 - 1);
  if (error) throw new Error("İşler yüklenemedi.");
  return { jobs: (data || []) as Job[], count: count || 0, page: safePage };
}

export async function getJobsForCustomer(customerId: string, limit = 5) {
  const viewer = await requireCompletedViewer();
  if (!isCustomerId(customerId)) return [] as Job[];
  const supabase = await createClient();
  const { data, error } = await supabase.from("jobs").select("*").eq("business_id", viewer.business!.id)
    .eq("customer_id", customerId).order("created_at", { ascending: false }).limit(Math.max(1, Math.min(limit, 20)));
  if (error) { logFailure("Customer jobs read failed"); throw new Error("İş geçmişi yüklenemedi."); }
  return (data || []) as Job[];
}
