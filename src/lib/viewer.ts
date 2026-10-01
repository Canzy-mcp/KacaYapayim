import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Business, Profile } from "@/types/database";

export const getViewer = cache(async () => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data: claims, error } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (error || !userId) return null;
  const [profileResult, businessResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("businesses").select("*").eq("owner_id", userId).maybeSingle(),
  ]);
  if (profileResult.error || businessResult.error) throw new Error("Bilgiler yüklenemedi.");
  return { id: userId, profile: profileResult.data as Profile | null, business: businessResult.data as Business | null };
});

export async function requireViewer() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  return viewer;
}

export async function requireCompletedViewer() {
  const viewer = await requireViewer();
  if (!viewer.business?.onboarding_completed) redirect("/onboarding");
  return viewer;
}
