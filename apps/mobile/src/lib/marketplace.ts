import { marketError, type MarketAction, type MarketDirectory, type MarketViews } from "@kacayapayim/core/marketplace";
import { db } from "./supabase";

export async function directory(filters: Record<string, string> = {}) {
  const { data, error } = await db().rpc("market_directory", { p_filters: filters });
  if (error) throw new Error("Usta rehberi yüklenemedi.");
  return data as MarketDirectory;
}

export async function readMarket<K extends keyof MarketViews>(view: K, page = 1, id?: string) {
  const { data, error } = await db().rpc("market_read", { p_view: view, p_page: page, p_id: id });
  if (error) throw new Error("Hizmet platformu bilgileri yüklenemedi.");
  return data as unknown as MarketViews[K];
}

export async function writeMarket(action: MarketAction, payload: Record<string, string | string[] | boolean>) {
  const { data, error } = await db().rpc("market_write", { p_action: action, p_payload: payload });
  if (error) throw new Error(marketError(error.message));
  return data;
}

export const marketMoney = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" });
export function localMarketDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(new Date(value));
}
