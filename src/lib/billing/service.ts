import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { fallbackPlans, monthBounds, resolvePlanId } from "./catalog";
import type { Plan, Subscription } from "@/types/database";

export async function getPlans(): Promise<Plan[]> {
  if (!isSupabaseConfigured()) return fallbackPlans;
  const supabase = await createClient();
  const { data, error } = await supabase.from("plans").select("*").eq("is_active", true).order("sort_order");
  if (error) throw new Error("Paketler yüklenemedi.");
  return data.length ? data : fallbackPlans;
}

export async function getBillingSummary(businessId: string) {
  const supabase = await createClient();
  const { start, end } = monthBounds();
  const [plansResult, subscriptionResult, quotesResult, customersResult] = await Promise.all([
    supabase.from("plans").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("subscriptions").select("*").eq("business_id", businessId).maybeSingle(),
    supabase.from("quotes").select("id", { head: true, count: "exact" }).eq("business_id", businessId).gte("created_at", start).lt("created_at", end),
    supabase.from("customers").select("id", { head: true, count: "exact" }).eq("business_id", businessId).eq("is_archived", false),
  ]);
  if (plansResult.error || subscriptionResult.error || quotesResult.error || customersResult.error) throw new Error("Paket bilgileri yüklenemedi.");
  const plans = plansResult.data.length ? plansResult.data : fallbackPlans;
  const subscription = subscriptionResult.data as Subscription | null;
  const plan = plans.find((item) => item.id === resolvePlanId(subscription)) ?? plans[0];
  return { plans, plan, subscription, usage: { monthlyQuotes: quotesResult.count ?? 0, activeCustomers: customersResult.count ?? 0 }, period: { start, end } };
}

export async function getEffectivePlan(businessId: string): Promise<Plan> {
  const supabase = await createClient();
  const { data: subscription, error: subscriptionError } = await supabase.from("subscriptions").select("*").eq("business_id", businessId).maybeSingle();
  if (subscriptionError) throw new Error("Paket bilgisi yüklenemedi.");
  const { data: plan, error: planError } = await supabase.from("plans").select("*").eq("id", resolvePlanId(subscription)).single();
  if (planError || !plan) throw new Error("Paket bilgisi yüklenemedi.");
  return plan;
}
