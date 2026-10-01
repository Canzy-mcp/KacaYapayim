import { logFailure } from "@/lib/observability/log";
import { createClient } from "@/lib/supabase/server";
import { readPainterSettings } from "@/lib/costs/catalog";
import { requireCompletedViewer } from "@/lib/viewer";
import type { BusinessCostItem } from "@/types/database";

export async function getBusinessCosts() {
  const viewer = await requireCompletedViewer();
  const business = viewer.business!;
  const supabase = await createClient();
  const { error: initializeError } = await supabase.rpc("ensure_my_cost_defaults");
  if (initializeError) {
    logFailure("Cost initialization failed");
    throw new Error("Maliyetler yüklenemedi. Lütfen tekrar dene.");
  }
  const [costResult, settingsResult] = await Promise.all([
    supabase.from("business_cost_items").select("*").eq("business_id", business.id).order("sort_order").order("created_at"),
    business.profession_id
      ? supabase.from("business_profession_settings").select("settings").eq("business_id", business.id).eq("profession_id", business.profession_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (costResult.error || settingsResult.error) {
    logFailure("Cost read failed");
    throw new Error("Maliyetler yüklenemedi. Lütfen tekrar dene.");
  }
  return {
    costs: (costResult.data || []) as BusinessCostItem[],
    settings: (settingsResult.data?.settings || {}) as Record<string, number>,
    painterSettings: business.profession === "Boyacı" ? readPainterSettings(settingsResult.data?.settings || null) : null,
    isPainter: business.profession === "Boyacı",
    hasTemplate: Boolean(business.profession_id),
  };
}
