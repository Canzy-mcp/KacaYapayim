import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Mfa } from "@/components/settings/mfa";
import { requestReturnPath } from "@/lib/account/home";
import { isPlatformAdmin } from "@/lib/account/platform-admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const getAdminSession = cache(async () => {
  if (!isSupabaseConfigured()) return null;
  const client = await createClient();
  const { data, error } = await client.auth.getClaims();
  if (error || !data?.claims.sub) return null;
  if (!await isPlatformAdmin(data.claims.sub)) notFound();
  const assurance = await client.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance.error) throw new Error("Yönetici oturumu doğrulanamadı.");
  return assurance.data;
});

export async function adminChallenge(path?: string) {
  const session = await getAdminSession();
  if (session?.currentLevel === "aal2") return null;
  const route = requestReturnPath((await headers()).get("x-kacayapayim-route"));
  const adminRoute = route && (route === "/admin" || route.startsWith("/admin/") || route.startsWith("/admin?"));
  const destination = adminRoute && (!path || route.split("?")[0] === path) ? route : path ?? "/admin";
  if (!session) redirect(`/login?next=${encodeURIComponent(destination)}`);
  if (session.nextLevel === "aal2") redirect(`/mfa?next=${encodeURIComponent(destination)}`);
  return <section className="mx-auto max-w-xl px-5 py-12">
    <h1 className="text-3xl font-semibold tracking-tight">Yönetici doğrulamasını etkinleştir</h1>
    <Mfa destination={destination} />
  </section>;
}
