import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (process.env.DEPLOYMENT_ENV === "production" && process.env.APP_URL) {
    const canonical = new URL(process.env.APP_URL);
    if (request.nextUrl.hostname !== canonical.hostname || request.nextUrl.protocol !== canonical.protocol) {
      const target = request.nextUrl.clone();
      target.protocol = canonical.protocol;
      target.host = canonical.host;
      return NextResponse.redirect(target, 308);
    }
  }
  if (pathname.startsWith("/t/") || pathname.startsWith("/api/public/quotes/")) {
    const response = NextResponse.next();
    response.headers.set("Referrer-Policy", "no-referrer");
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("X-Content-Type-Options", "nosniff");
    return response;
  }
  const privatePath = ["/dashboard", "/quotes", "/jobs", "/customers", "/costs", "/settings", "/admin", "/billing", "/onboarding", "/login", "/register", "/forgot-password", "/reset-password", "/demo"].some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));
  const authPath = privatePath || pathname.startsWith("/auth/") || pathname.startsWith("/api/quotes/");
  const response = authPath ? await updateSession(request) : NextResponse.next();
  if (privatePath || process.env.DEPLOYMENT_ENV === "staging") response.headers.set("X-Robots-Tag", "noindex, nofollow");
  if (privatePath) response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
