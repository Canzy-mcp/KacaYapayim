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

const noCache = { "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0", Expires: "0", Pragma: "no-cache" };
const otpTypes = ["email", "signup", "recovery"] as const;
type OtpType = (typeof otpTypes)[number];
const otpType = (v: unknown) => otpTypes.find(t => t === v);
const validTokenHash = (v: unknown): v is string => typeof v === "string" && /^[A-Za-z0-9_-]{8,256}$/.test(v);
const errorPath = (next: string | null) => next === "/reset-password" ? "/forgot-password?error=link" : "/login?error=link";

function sameOrigin(request: NextRequest) {
  const allowed = new Set([new URL(request.url).origin]);
  try { if (process.env.APP_URL) allowed.add(new URL(process.env.APP_URL).origin); } catch {}
  const origin = request.headers.get("origin");
  if (origin !== null && !allowed.has(origin)) return false;
  const site = request.headers.get("sec-fetch-site");
  return site === null || site === "same-origin";
}

export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next");
  if (!isSupabaseConfigured()) return NextResponse.redirect(new URL("/login?error=setup", request.url), { headers: noCache });
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = otpType(request.nextUrl.searchParams.get("type"));
  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next === "/reset-password" ? next : await signedInDestination(supabase, next, data.user), request.url), { headers: noCache });
  } else if (type && validTokenHash(tokenHash)) {
    // Token is consumed only by the POST from /auth/confirm: a GET must never sign anyone in (login CSRF, link scanners).
    const target = new URL("/auth/confirm", request.url);
    target.searchParams.set("token_hash", tokenHash);
    target.searchParams.set("type", type);
    if (next) target.searchParams.set("next", next);
    return NextResponse.redirect(target, { headers: noCache });
  }
  return NextResponse.redirect(new URL(errorPath(next), request.url), { headers: noCache });
}

export async function POST(request: NextRequest) {
  const redirect = (path: string) => NextResponse.redirect(new URL(path, request.url), { status: 303, headers: noCache });
  if (!sameOrigin(request)) return new NextResponse("Forbidden", { status: 403, headers: noCache });
  const form = await request.formData().catch(() => null);
  const field = (k: string) => { const v = form?.get(k); return typeof v === "string" ? v : null; };
  const next = field("next");
  if (!isSupabaseConfigured()) return redirect("/login?error=setup");
  const tokenHash = field("token_hash");
  const type: OtpType | undefined = otpType(field("type"));
  if (type && validTokenHash(tokenHash)) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return redirect(type === "recovery" ? "/reset-password" : await signedInDestination(supabase, next, data.user));
  }
  return redirect(errorPath(next));
}
