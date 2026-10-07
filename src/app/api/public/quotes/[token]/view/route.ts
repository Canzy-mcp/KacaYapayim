import { quoteAccess } from "@/lib/quotes/public-access";
import { createServiceClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isPublicToken } from "@/lib/quotes/public-service";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { recordEvent } from "@/lib/analytics/events";
import { readJsonBody } from "@/lib/security/body";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  if (process.env.APP_URL && request.headers.get("origin") !== new URL(process.env.APP_URL).origin)
    return new Response(null, { status: 403 });
  if (!await consumeRateLimit("public-quote-view", 60, 60)) return new Response(null, { status: 429 });
  const { token } = await params;
  if (!isPublicToken(token) || !isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return new Response(null, { status: 404 });
  const {value:body,tooLarge}=await readJsonBody(request,1024);
  if(tooLarge)return new Response(null,{status:413});
  if (!body || typeof body.eventId !== "string" || !isPublicToken(body.eventId))
    return new Response(null, { status: 400 });
  if ((await quoteAccess(token)).state !== "allowed") return new Response(null,{status:403});
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("mark_quote_viewed", { p_token: token, p_event_id: body.eventId });
  if (error) return new Response(null, { status: 503, headers: { "Cache-Control": "no-store" } });
  if (data) await recordEvent("quote_viewed", "/quotes");
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
