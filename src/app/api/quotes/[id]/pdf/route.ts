import { getViewer } from "@/lib/viewer";
import { getQuoteBundle, isQuoteId } from "@/lib/quotes/service";
import { toCustomerQuotePreview } from "@/lib/quotes/public-preview";
import { renderQuotePdf } from "@/lib/quotes/pdf";
import { sanitizePdfFilename } from "@/lib/quotes/share";
import { getEffectivePlan } from "@/lib/billing/service";
import { consumeRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getViewer();
  if (!viewer?.business?.onboarding_completed) return new Response(null, { status: 401 });
  if (!await consumeRateLimit("private-pdf", 30, 3600, viewer.id)) return new Response(null, { status: 429 });
  const { id } = await params;
  if (!isQuoteId(id)) return new Response(null, { status: 404 });
  const bundle = await getQuoteBundle(id);
  if (!bundle) return new Response(null, { status: 404 });
  const plan = await getEffectivePlan(viewer.business.id);
  const quote = toCustomerQuotePreview({ ...bundle, showBranding: !plan.features.remove_branding, showLogo: plan.features.business_logo });
  try {
    const bytes = await renderQuotePdf(quote);
    return new Response(Buffer.from(bytes), { headers: {
      "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${sanitizePdfFilename(quote.quoteNumber, quote.customer?.name || null)}"`,
      "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
    } });
  } catch { return new Response("PDF oluşturulamadı. Tekrar deneyin.", { status: 503 }); }
}
