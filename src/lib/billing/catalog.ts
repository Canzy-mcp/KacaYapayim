import type { Plan, PlanFeature, PlanId, PlanLimit, Subscription } from "@/types/database";

// Mirrors the first database seed so the public pricing page works before setup.
const features = (overrides: Partial<Record<PlanFeature, boolean>>): Record<PlanFeature, boolean> => ({
  public_quotes: true, pdf: true, whatsapp: true, actual_profit: false,
  advanced_reports: false, remove_branding: false, business_logo: false, ...overrides,
});
const limits = (overrides: Partial<Record<PlanLimit, number | null>>): Record<PlanLimit, number | null> => ({
  monthly_quotes: 5, active_customers: 20, businesses: 1, users: 1, ...overrides,
});
const row = (id: PlanId, name: string, description: string, monthly: number, yearly: number,
  planFeatures: Record<PlanFeature, boolean>, planLimits: Record<PlanLimit, number | null>, sort: number): Plan => ({
  id, name, description, monthly_price_kurus: monthly, yearly_price_kurus: yearly,
  currency: "TRY", features: planFeatures, limits: planLimits, sort_order: sort, is_active: true,
  created_at: "", updated_at: "",
});
export const fallbackPlans: Plan[] = [
  row("free", "Ücretsiz", "İlk tekliflerini güvenle hazırla.", 0, 0, features({}), limits({}), 0),
  row("usta", "Usta", "Düzenli işler için sınırsız kullanım.", 39900, 399000,
    features({ actual_profit: true, advanced_reports: true }), limits({ monthly_quotes: null, active_customers: null }), 1),
  row("pro", "Pro", "Markana özel teklifler ve kapsamlı raporlar.", 79900, 799000,
    features({ actual_profit: true, advanced_reports: true, remove_branding: true, business_logo: true }),
    limits({ monthly_quotes: null, active_customers: null }), 2),
];

export function resolvePlanId(subscription: Subscription | null, now = new Date()): PlanId {
  if (!subscription || subscription.plan_id === "free") return "free";
  if (!["active", "trialing", "past_due"].includes(subscription.status)) return "free";
  if (!subscription.current_period_end || new Date(subscription.current_period_end) <= now) return "free";
  return subscription.plan_id;
}
export const hasFeature = (plan: Plan, feature: PlanFeature) => plan.features[feature] === true;
export const limitReached = (plan: Plan, key: PlanLimit, count: number) =>
  plan.limits[key] !== null && count >= plan.limits[key];
export function monthBounds(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit" }).formatToParts(now);
  const year = Number(parts.find((item) => item.type === "year")?.value);
  const month = Number(parts.find((item) => item.type === "month")?.value);
  const start = new Date(Date.UTC(year, month - 1, 1, -3));
  const end = new Date(Date.UTC(year, month, 1, -3));
  return { start: start.toISOString(), end: end.toISOString() };
}
