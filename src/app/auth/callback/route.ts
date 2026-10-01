import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next") === "/reset-password" ? "/reset-password" : "/onboarding";
  const noCache = { "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0", Expires: "0", Pragma: "no-cache" };
  if (!isSupabaseConfigured()) return NextResponse.redirect(new URL("/login?error=setup", request.url), { headers: noCache });
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const supabase = await createClient();
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, request.url), { headers: noCache });
  } else if (tokenHash && (type === "email" || type === "signup" || type === "recovery")) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(new URL(type === "recovery" ? "/reset-password" : next, request.url), { headers: noCache });
  }
  return NextResponse.redirect(new URL(next === "/reset-password" ? "/forgot-password?error=link" : "/login?error=link", request.url), { headers: noCache });
}
