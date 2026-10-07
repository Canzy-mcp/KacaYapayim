import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const nonce = btoa(crypto.randomUUID());
  const origin = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin : "";
  const reportPolicy = `default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' ${origin} ${origin.replace(/^http/,"ws")}; report-uri /api/security/csp-report`;
  const forwardedHeaders=new Headers(request.headers);
  forwardedHeaders.set("x-nonce",nonce);
  forwardedHeaders.set("Content-Security-Policy",reportPolicy);
  function decorate(response:NextResponse){response.headers.set("Content-Security-Policy-Report-Only",reportPolicy);return response;}
  if ((process.env.DEPLOYMENT_ENV === "production" || process.env.VERCEL_ENV === "production") && process.env.APP_URL) {
    const canonical = new URL(process.env.APP_URL);
    if (request.nextUrl.hostname !== canonical.hostname || request.nextUrl.protocol !== canonical.protocol) {
      const target = request.nextUrl.clone();
      target.protocol = canonical.protocol;
      target.host = canonical.host;
      return NextResponse.redirect(target, 308);
    }
  }
  if (pathname.startsWith("/t/") || pathname.startsWith("/api/public/quotes/")) {
    const response = NextResponse.next({request:{headers:forwardedHeaders}});
    response.headers.set("Referrer-Policy", "no-referrer");
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("X-Content-Type-Options", "nosniff");
    return decorate(response);
  }
  const privatePath = ["/mfa", "/dashboard", "/quotes", "/jobs", "/customers", "/costs", "/settings", "/work", "/team-access", "/team-work", "/team-invite", "/admin", "/billing", "/onboarding", "/login", "/register", "/forgot-password", "/reset-password", "/demo"].some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));
  const authPath = privatePath || pathname.startsWith("/auth/") || pathname.startsWith("/api/quotes/") || pathname.startsWith("/api/work/") || pathname.startsWith("/api/export/");
  const response = authPath ? await updateSession(request,forwardedHeaders) : NextResponse.next({request:{headers:forwardedHeaders}});
  if (privatePath || process.env.DEPLOYMENT_ENV === "staging") response.headers.set("X-Robots-Tag", "noindex, nofollow");
  if (privatePath) response.headers.set("Cache-Control", "private, no-store");
  return decorate(response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
