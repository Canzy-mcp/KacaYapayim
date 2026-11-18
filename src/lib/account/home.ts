export function accountHome(business: { onboarding_completed: boolean } | null, preference: unknown) {
  if (business?.onboarding_completed) return "/dashboard";
  return preference === "customer" ? "/talepler" : "/onboarding";
}

export function requestReturnPath(value: unknown) {
  return typeof value === "string" && /^\/talepler\/yeni(?:\?usta=[a-f0-9-]{36})?$/i.test(value) ? value : undefined;
}
