import { createClient } from "@/lib/supabase/server";
import { requireCompletedViewer } from "@/lib/viewer";
import { isDashboardOverview } from "@/lib/dashboard/metrics";
import type { DashboardRange } from "@/lib/dashboard/range";
import { logFailure } from "@/lib/observability/log";

export async function getDashboardOverview(range: DashboardRange) {
  const viewer = await requireCompletedViewer();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_dashboard_overview", {
    p_start_date: range.startDate, p_end_date: range.endExclusive,
  });
  if (error || !isDashboardOverview(data)) {
    logFailure("dashboard_overview_load");
    throw new Error("Özet bilgiler yüklenemedi.");
  }
  if (data.hasAnyQuote) return data;

  // The previous RPC only checked ordinary quotes.
  const marketplace = await supabase.from("jobs").select("id").eq("business_id", viewer.business!.id)
    .not("input_data->>market_request", "is", null).limit(1);
  return { ...data, hasAnyQuote: Boolean(marketplace.data?.length) };
}
