import { createClient } from "@/lib/supabase/server";
import { requireCompletedViewer } from "@/lib/viewer";
import { isDashboardOverview } from "@/lib/dashboard/metrics";
import type { DashboardRange } from "@/lib/dashboard/range";
import { logFailure } from "@/lib/observability/log";

export async function getDashboardOverview(range: DashboardRange) {
  await requireCompletedViewer();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_dashboard_overview", {
    p_start_date: range.startDate, p_end_date: range.endExclusive,
  });
  if (error || !isDashboardOverview(data)) {
    logFailure("dashboard_overview_load");
    throw new Error("Özet bilgiler yüklenemedi.");
  }
  return data;
}
