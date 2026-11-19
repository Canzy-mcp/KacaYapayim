import { validMarketId } from "@kacayapayim/core/marketplace";

export function accountHome(business: { onboarding_completed: boolean } | null, preference: unknown) {
  if (business?.onboarding_completed) return "/dashboard";
  return preference === "customer" ? "/talepler" : "/onboarding";
}

export function requestReturnPath(value: unknown) {
  if (typeof value !== "string" || value !== value.trim()) return undefined;
  if (["/talepler", "/talepler/yeni", "/talepler/bildirimler", "/talepler/favoriler", "/talepler/hesap"].includes(value)) return value;
  const provider = /^\/talepler\/yeni\?usta=([^&]+)$/.exec(value)?.[1];
  if (validMarketId(provider)) return value;
  const request = /^\/talepler\/([^/?]+)(?:\/duzenle|\?mesaj=(?:[1-9]\d?|10[01]))?$/.exec(value)?.[1];
  if (validMarketId(request)) return value;
  return undefined;
}
