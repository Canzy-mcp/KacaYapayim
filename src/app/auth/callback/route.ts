import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { accountHome, requestReturnPath } from "@/lib/account/home";
import { isPlatformAdmin } from "@/lib/account/platform-admin";

async function signedInDestination(
  supabase: Awaited<ReturnType<typeof createClient>>, next: string | null,
  user?: { id: string; user_metadata: Record<string, unknown> } | null,
) {
  const allowed = requestReturnPath(next);
  if (allowed) return allowed;
  if (!user) return "/onboarding";
  if (await isPlatformAdmin(user.id)) return "/admin";
  const { data: business } = await supabase.from("businesses").select("onboarding_completed").eq("owner_id", user.id).maybeSingle();
  return accountHome(business, user.user_metadata.account_preference);
}

export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next");
  const noCache = { "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0", Expires: "0", Pragma: "no-cache" };
  if (!isSupabaseConfigured()) return NextResponse.redirect(new URL("/login?error=setup", request.url), { headers: noCache });
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const supabase = await createClient();
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next === "/reset-password" ? next : await signedInDestination(supabase, next, data.user), request.url), { headers: noCache });
  } else if (tokenHash && (type === "email" || type === "signup" || type === "recovery")) {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(new URL(type === "recovery" ? "/reset-password" : await signedInDestination(supabase, next, data.user), request.url), { headers: noCache });
  }
  return NextResponse.redirect(new URL(next === "/reset-password" ? "/forgot-password?error=link" : "/login?error=link", request.url), { headers: noCache });
}
