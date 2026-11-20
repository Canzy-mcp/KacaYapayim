import { BillingProviderUnavailableError, getBillingProvider } from "@/lib/billing/provider";
import { isReference } from "@/lib/billing/iyzico-protocol";
import { logFailure } from "@/lib/observability/log";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const provider = getBillingProvider();
    const type = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
    if (type !== "application/x-www-form-urlencoded") return new Response(null, { status: 415 });
    if (Number(request.headers.get("content-length")) > 2048) return new Response(null, { status: 413 });
    const reader = request.body?.getReader();
    const decoder = new TextDecoder();
    let size = 0;
    let body = "";
    if (reader) {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 2048) {
          await reader.cancel();
          return new Response(null, { status: 413 });
        }
        body += decoder.decode(value, { stream: true });
      }
      body += decoder.decode();
    }
    const token = new URLSearchParams(body).get("token");
    const success = isReference(token) && await provider.completeCheckout(token);
    return new Response(null, {
      status: 303,
      headers: {
        Location: `${provider.appUrl}/billing/${success ? "success" : "cancel"}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof BillingProviderUnavailableError) return new Response(null, { status: 503 });
    logFailure("iyzico checkout verification failed");
    return new Response("Ödeme sonucu şu anda doğrulanamadı. Lütfen paket sayfandan durumunu kontrol et.", {
      status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
