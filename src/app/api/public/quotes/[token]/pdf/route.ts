import { getPublicQuote } from "@/lib/quotes/public-service";
import { renderQuotePdf } from "@/lib/quotes/pdf";
import { sanitizePdfFilename } from "@/lib/quotes/share";
import { consumeRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  if (!await consumeRateLimit("public-quote-pdf", 12, 60)) return new Response(null, { status: 429 });
  const { token } = await params;
  const quote = await getPublicQuote(token);
  if (!quote) return new Response("Teklif bulunamadı.", { status: 404 });
  try {
    const bytes = await renderQuotePdf(quote);
    return new Response(Buffer.from(bytes), { headers: {
      "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${sanitizePdfFilename(quote.quoteNumber, quote.customer?.name || null)}"`,
      "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer",
    } });
  } catch { return new Response("PDF oluşturulamadı. Tekrar deneyin.", { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
