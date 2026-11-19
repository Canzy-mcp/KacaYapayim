import "server-only";
import { redirect } from "next/navigation";
import { requestReturnPath } from "@/lib/account/home";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getViewer } from "@/lib/viewer";
import type { MarketDirectory, MarketViews } from "@kacayapayim/core/marketplace";

export async function marketDirectory(filters: Record<string, string> = {}): Promise<MarketDirectory | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await (await createClient()).rpc("market_directory", { p_filters: filters });
  if (error) throw new Error("Usta rehberi yüklenemedi.");
  return data as MarketDirectory;
}

export async function marketRead<K extends keyof MarketViews>(view: K, page = 1, id?: string): Promise<MarketViews[K]> {
  const { data, error } = await (await createClient()).rpc("market_read", { p_view: view, p_page: page, p_id: id });
  if (error) throw new Error("Hizmet platformu bilgileri yüklenemedi.");
  return data as unknown as MarketViews[K];
}

export function marketPage(value: unknown) {
  return typeof value === "string" && /^[0-9]{1,3}$/.test(value) ? Math.max(1, Math.min(101, Number(value))) : 1;
}

export async function requireMarketViewer(path: string) {
  const viewer = await getViewer();
  if (!viewer) {
    const destination = requestReturnPath(path) ?? "/talepler";
    redirect(`/login?next=${encodeURIComponent(destination)}`);
  }
  return viewer;
}
