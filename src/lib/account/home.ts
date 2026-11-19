import { validMarketId } from "@kacayapayim/core/marketplace";

export function accountHome(business: { onboarding_completed: boolean } | null, preference: unknown) {
  if (preference === "customer") return "/talepler";
  if (business?.onboarding_completed) return "/dashboard";
  return "/onboarding";
}

export const providerSetupPath = "/onboarding?usta=1";

export function requestReturnPath(value: unknown) {
  if (typeof value !== "string" || value !== value.trim()) return undefined;
  if (["/admin", "/admin/analytics", "/admin/professions", "/admin/talepler", "/onboarding", providerSetupPath,
    "/talepler", "/talepler/yeni", "/talepler/bildirimler", "/talepler/favoriler", "/talepler/hesap"].includes(value)) return value;
  if (/^\/admin\?gun=(?:7|30|90)$/.test(value) || /^\/admin\/talepler\?page=(?:[1-9]\d?|10[01])$/.test(value)) return value;
  const profession = /^\/admin\/professions\?id=([^&]+)$/.exec(value)?.[1];
  if (validMarketId(profession)) return value;
  const provider = /^\/talepler\/yeni\?usta=([^&]+)$/.exec(value)?.[1];
  if (validMarketId(provider)) return value;
  const request = /^\/talepler\/([^/?]+)(?:\/duzenle|\?mesaj=(?:[1-9]\d?|10[01]))?$/.exec(value)?.[1];
  if (validMarketId(request)) return value;
  return undefined;
}
