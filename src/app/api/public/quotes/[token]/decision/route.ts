import { quoteAccess } from "@/lib/quotes/public-access";
import { createServiceClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isPublicToken } from "@/lib/quotes/public-service";
import { isRejectionReason } from "@/lib/quotes/decision";
import { revalidatePath } from "next/cache";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { recordEvent } from "@/lib/analytics/events";
import { readJsonBody } from "@/lib/security/body";

export const dynamic = "force-dynamic";
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  if (process.env.APP_URL && request.headers.get("origin") !== new URL(process.env.APP_URL).origin)
    return new Response(null, { status: 403 });
  if (!await consumeRateLimit("public-quote-decision", 12, 3600)) return new Response(null, { status: 429 });
  const { token } = await params;
  if (!isPublicToken(token) || !isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return new Response(null, { status: 404 });
  const {value:body,tooLarge}=await readJsonBody(request,4096);
  if(tooLarge)return new Response(null,{status:413});
  if (!body || (body.action !== "accept" && body.action !== "reject") ||
    body.reason != null && (typeof body.reason !== "string" || !isRejectionReason(body.reason)) ||
    body.note != null && (typeof body.note !== "string" || body.note.length > 1000))
    return Response.json({ error: "Geçersiz yanıt." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  if ((await quoteAccess(token)).state !== "allowed") return new Response(null,{status:403});
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("respond_to_package_quote", {
    p_token: token, p_action: body.action,
    p_reason: body.action === "reject" ? body.reason || null : null,
    p_note: body.action === "reject" ? body.note?.trim() || null : null,
  });
  if (error || !data) return Response.json({ error: "Teklif yanıtınız kaydedilemedi. Tekrar deneyin." },
    { status: 409, headers: { "Cache-Control": "no-store" } });
  await recordEvent(data === "accepted" ? "quote_accepted" : "quote_rejected", "/quotes");
  revalidatePath("/dashboard"); revalidatePath("/quotes"); revalidatePath("/jobs");
  return Response.json({ status: data }, { headers: { "Cache-Control": "no-store" } });
}
