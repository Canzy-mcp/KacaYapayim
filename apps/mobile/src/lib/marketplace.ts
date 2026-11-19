import { marketError, validMarketId, type MarketAction, type MarketDirectory, type MarketViews } from "@kacayapayim/core/marketplace";
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
const localDateTime = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Istanbul" });
const calendarDate = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeZone: "UTC" });
const dateKey = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Europe/Istanbul" });

export function localMarketDate(value: string) {
  return localDateTime.format(new Date(value));
}

export function marketCalendarDate(value: string) {
  return calendarDate.format(new Date(`${value}T00:00:00Z`));
}

export function marketDayError(value: string, now: number) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    return "Tarihi yıl-ay-gün biçiminde gir.";
  }
  const limit = new Date(now + 365 * 86_400_000);
  const formatKey = (day: Date) => {
    const parts = dateKey.formatToParts(day);
    return ["year", "month", "day"].map((type) => parts.find((part) => part.type === type)?.value).join("-");
  };
  return value < formatKey(new Date(now)) || value > formatKey(limit) ? "Bugün ile gelecek 365 gün arasında bir tarih seç." : "";
}

export function validMarketAmount(value: string) {
  return /^\d{1,10}(?:[.,]\d{1,2})?$/.test(value) && Number(value.replace(",", ".")) > 0;
}

export function marketReturnPath(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  if (["/hizmet", "/hizmet/yeni", "/hizmet/profil", "/hizmet/talepler"].includes(value)) return value;
  const detail = /^\/hizmet\/(?:talep|usta)\/([^/?#]+)$/.exec(value);
  if (detail && validMarketId(detail[1])) return value;
  const request = /^\/hizmet\/yeni\?(?:usta|duzenle)=([^/?#]+)$/.exec(value);
  if (request && validMarketId(request[1])) return value;
  if (/^\/hizmet\/talepler\?gorunum=(?:own|feed|work|favorites|notices)$/.test(value)) return value;
}
