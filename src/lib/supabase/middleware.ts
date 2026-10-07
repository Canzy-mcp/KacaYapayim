import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import { getSupabaseConfig, isSupabaseConfigured } from "./config";

export async function updateSession(request: NextRequest, forwardedHeaders = new Headers(request.headers)) {
  if (!isSupabaseConfigured()) return NextResponse.next({ request:{headers:forwardedHeaders} });
  const { url, key } = getSupabaseConfig();
  let response = NextResponse.next({ request:{headers:forwardedHeaders} });
  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(items, headers) {
        items.forEach(({ name, value }) => request.cookies.set(name, value));
        forwardedHeaders.set("cookie",request.headers.get("cookie")||"");
        response = NextResponse.next({ request:{headers:forwardedHeaders} });
        items.forEach(({ name, value, options }) => response.cookies.set(name, value, request.cookies.get("ky_session_preference")?.value === "session" ? { ...options, maxAge: undefined, expires: undefined } : options));
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });
  await supabase.auth.getClaims();
  return response;
}
