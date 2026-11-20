import { createServiceClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { PublicQuote } from "@/lib/quotes/public-preview";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { logFailure } from "@/lib/observability/log";
import { quoteAccess } from "@/lib/quotes/public-access";
import { isPublicToken } from "@/lib/quotes/id";

export { isPublicToken } from "@/lib/quotes/id";

function isPublicQuote(value: unknown): value is PublicQuote {
  if (!value || typeof value !== "object") return false;
  const q = value as Record<string, unknown>;
  const business = q.business as Record<string, unknown> | null;
  return !!business && typeof business.name === "string" &&
    typeof q.quoteNumber === "string" && typeof q.date === "string" &&
    typeof q.validUntil === "string" && typeof q.title === "string" &&
    typeof q.salePrice === "number" && typeof q.currency === "string" &&
    typeof q.status === "string" && typeof q.showBranding === "boolean" && Array.isArray(q.items) &&
    q.items.every((item: unknown) => !!item && typeof item === "object" && typeof (item as { name?: unknown }).name === "string") &&
    Array.isArray(q.exclusions) && q.exclusions.every((item: unknown) => typeof item === "string");
}

export async function getPublicQuote(token: string): Promise<PublicQuote | null> {
  if (!isPublicToken(token) || !isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  if (!await consumeRateLimit("public-quote-lookup", 60, 60)) return null;
  const access = await quoteAccess(token);
  if (access.state !== "allowed") return null;
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("get_public_quote_details", { p_token: token });
  if (error) { logFailure("public_quote_lookup"); return null; }
  if (!isPublicQuote(data)) return null;
  if (["ready", "sent", "viewed"].includes(data.status)) {
    const { data: job, error: jobError } = await supabase.from("jobs").select("accepted_quote_id")
      .eq("id", access.jobId).maybeSingle();
    if (jobError) logFailure("public_quote_job_lookup");
    if (job?.accepted_quote_id && job.accepted_quote_id !== access.quoteId) return { ...data, status: "cancelled" };
  }
  return data;
}
