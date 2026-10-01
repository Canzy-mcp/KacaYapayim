import test from "node:test";
import assert from "node:assert/strict";
import { buildWhatsAppQuoteMessage, buildWhatsAppUrl, sanitizePdfFilename } from "../src/lib/quotes/share.ts";

test("WhatsApp share preserves Turkish message and safely encodes URL", () => {
  const message = buildWhatsAppQuoteMessage({ customerName: "Ahmet Yılmaz", businessName: "Yılmaz Boya",
    quoteNumber: "KY-2026-0012", publicUrl: "https://example.com/t/550e8400-e29b-41d4-a716-446655440000" });
  assert.ok(message.includes("Ahmet Yılmaz"));
  assert.ok(message.includes("KY-2026-0012"));
  assert.ok(message.includes("https://example.com/t/"));
  const url = buildWhatsAppUrl(message, "0532 123 45 67");
  assert.ok(url.startsWith("https://wa.me/905321234567?text="));
  assert.equal(decodeURIComponent(url.split("?text=")[1]), message);
  assert.ok(buildWhatsAppUrl(message, null).startsWith("https://wa.me/?text="));
});

test("PDF filename strips unsafe characters and transliterates Turkish names", () => {
  assert.equal(sanitizePdfFilename("KY-2026-0012", "Ahmet Yılmaz"), "Teklif-KY-2026-0012-Ahmet-Yilmaz.pdf");
  assert.ok(!sanitizePdfFilename("../secret", "../../İş").includes(".."));
});
