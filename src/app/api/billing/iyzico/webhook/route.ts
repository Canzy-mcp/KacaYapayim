import { InvalidIyzicoSignatureError } from "@/lib/billing/iyzico";
import { applyIyzicoEvent } from "@/lib/billing/iyzico-store";
import { BillingProviderUnavailableError, getBillingProvider } from "@/lib/billing/provider";
import { logFailure } from "@/lib/observability/log";
import { readJsonBody } from "@/lib/security/body";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { value, tooLarge } = await readJsonBody(request, 8192);
  if (tooLarge) return new Response(null, { status: 413 });
  if (!value) return new Response(null, { status: 400 });
  try {
    const event = await getBillingProvider().handleWebhook({
      body: new TextEncoder().encode(JSON.stringify(value)), headers: request.headers,
    });
    if (event) await applyIyzicoEvent(event);
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof InvalidIyzicoSignatureError) return new Response(null, { status: 401 });
    if (!(error instanceof BillingProviderUnavailableError)) logFailure("iyzico webhook verification failed");
    return new Response(null, { status: 503 });
  }
}
