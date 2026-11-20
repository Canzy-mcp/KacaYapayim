import { validMarketId } from "@kacayapayim/core/marketplace";

export function accountHome(business: { onboarding_completed: boolean } | null, preference: unknown) {
  if (preference === "customer") return "/talepler";
  if (business?.onboarding_completed) return "/dashboard";
  return "/onboarding";
}

export const providerSetupPath = "/onboarding?usta=1";

// New-request prefill survives sign-in only in the exact form the app builds:
// known keys, each once, in fixed order, with validated values.
function newRequestQuery(raw: string) {
  const params = new URLSearchParams(raw);
  const keys = [...params.keys()];
  const order = ["usta", "category", "city", "district"];
  if (!keys.length || new Set(keys).size !== keys.length || keys.some(key => !order.includes(key))) return false;
  const place = /^[\p{L}\p{M}0-9 .'-]{2,80}$/u;
  const usta = params.get("usta"), category = params.get("category"), city = params.get("city"), district = params.get("district");
  if (usta !== null && !validMarketId(usta)) return false;
  if (category !== null && !/^[a-z]{2,20}$/.test(category)) return false;
  if (city !== null && !place.test(city) || district !== null && !place.test(district)) return false;
  const canonical = new URLSearchParams();
  for (const key of order) { const v = params.get(key); if (v !== null) canonical.set(key, v); }
  return canonical.toString() === raw;
}

export function requestReturnPath(value: unknown) {
  if (typeof value !== "string" || value !== value.trim()) return undefined;
  if (["/admin", "/admin/analytics", "/admin/professions", "/admin/talepler", "/onboarding", providerSetupPath,
    "/talepler", "/talepler/yeni", "/talepler/bildirimler", "/talepler/favoriler", "/talepler/hesap"].includes(value)) return value;
  if (/^\/admin\?gun=(?:7|30|90)$/.test(value) || /^\/admin\/talepler\?page=(?:[1-9]\d?|10[01])$/.test(value)) return value;
  const profession = /^\/admin\/professions\?id=([^&]+)$/.exec(value)?.[1];
  if (validMarketId(profession)) return value;
  if (value.startsWith("/talepler/yeni?") && newRequestQuery(value.slice("/talepler/yeni?".length))) return value;
  const request = /^\/talepler\/([^/?]+)(?:\/duzenle|\?mesaj=(?:[1-9]\d?|10[01]))?$/.exec(value)?.[1];
  if (validMarketId(request)) return value;
  return undefined;
}
