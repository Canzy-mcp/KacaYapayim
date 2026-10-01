import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { CustomerQuotePreview } from "@/lib/quotes/public-preview";
import { formatMoney } from "@/lib/costs/format";
import { formatQuoteDate } from "@/lib/quotes/defaults";

const W = 595.28, H = 841.89, M = 48, contentW = W - M * 2;
const ink = rgb(0.11, 0.11, 0.12), muted = rgb(0.43, 0.43, 0.46), line = rgb(0.87, 0.87, 0.89);

export async function renderQuotePdf(quote: CustomerQuotePreview): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const [regularBytes, boldBytes] = await Promise.all([
    readFile(path.join(process.cwd(), "public/fonts/NotoSans-Regular.ttf")),
    readFile(path.join(process.cwd(), "public/fonts/NotoSans-Bold.ttf")),
  ]);
  const regular = await pdf.embedFont(regularBytes);
  const bold = await pdf.embedFont(boldBytes);
  pdf.setTitle(`Teklif ${quote.quoteNumber}`);
  pdf.setAuthor(quote.business.name);
  let page: PDFPage = pdf.addPage([W, H]);
  let y = H - M;
  const newPage = () => { page = pdf.addPage([W, H]); y = H - M; };
  const ensure = (height: number) => { if (y - height < M + 26) newPage(); };
  const draw = (value: string, size = 10, font: PDFFont = regular, color = ink, x = M) => {
    page.drawText(value, { x, y, size, font, color });
    y -= size * 1.4;
  };
  const wrap = (value: string, size = 10, font: PDFFont = regular, width = contentW) => {
    const lines: string[] = [];
    for (const paragraph of value.split(/\r?\n/)) {
      if (!paragraph.trim()) { lines.push(""); continue; }
      let current = "";
      for (const word of paragraph.split(/\s+/)) {
        const candidate = current ? `${current} ${word}` : word;
        if (font.widthOfTextAtSize(candidate, size) <= width) { current = candidate; continue; }
        if (current) lines.push(current);
        current = "";
        for (const char of word) {
          if (font.widthOfTextAtSize(current + char, size) > width && current) { lines.push(current); current = ""; }
          current += char;
        }
      }
      if (current) lines.push(current);
    }
    return lines;
  };
  const text = (value: string, size = 10, font: PDFFont = regular, color = ink, indent = 0) => {
    for (const row of wrap(value, size, font, contentW - indent)) { ensure(size * 1.5); draw(row || " ", size, font, color, M + indent); }
  };
  const section = (label: string) => {
    ensure(33); y -= 5; page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.7, color: line });
    y -= 15; draw(label.toLocaleUpperCase("tr-TR"), 9, bold, muted); y -= 3;
  };
  draw(quote.business.name, 19, bold); y -= 2;
  text([quote.business.phone, quote.business.city].filter(Boolean).join(" · "), 9, regular, muted);
  y -= 12;
  draw("TEKLİF", 10, bold, muted);
  draw(quote.quoteNumber, 13, bold);
  text(formatQuoteDate(quote.date), 9, regular, muted);
  section("Müşteri");
  text(quote.customer?.name || "Müşteri seçilmedi", 12, bold);
  if (quote.customer?.companyName) text(quote.customer.companyName, 10, regular, muted);
  section("İş");
  y -= 6; text(quote.title, 17, bold);
  if (quote.description) { y -= 4; text(quote.description, 10, regular, muted); }
  section("Teklife dahil");
  for (const item of quote.items) {
    ensure(28); text(`• ${item.name}`, 10, bold);
    if (item.description) text(item.description, 9, regular, muted, 13);
    y -= 1;
  }
  if (quote.exclusions.length) {
    section("Teklife dahil değil");
    for (const item of quote.exclusions) text(`• ${item}`, 10);
  }
  if (quote.estimatedDuration) { section("Tahmini süre"); text(quote.estimatedDuration, 11, bold); }
  section("Toplam teklif");
  y -= 11; text(formatMoney(quote.salePrice), 24, bold);
  section("Ödeme koşulları");
  text(quote.paymentTerms || "Belirtilmedi");
  section("Geçerlilik");
  text(`${formatQuoteDate(quote.validUntil)} tarihine kadar`);
  if (quote.notes) { section("Not"); text(quote.notes); }
  page.drawLine({ start: { x: M, y: 52 }, end: { x: W - M, y: 52 }, thickness: 0.7, color: line });
  page.drawText(quote.business.name, { x: M, y: 34, size: 9, font: bold, color: ink });
  if (quote.showBranding !== false) {
    const logo = await pdf.embedPng(await readFile(path.join(process.cwd(), "public/brand/logo.png")));
    page.drawImage(logo, { x: W - M - regular.widthOfTextAtSize("KaçaYapayım ile hazırlandı", 8) - 26, y: 28, width: 22, height: 22 });
    page.drawText("KaçaYapayım ile hazırlandı", { x: W - M - regular.widthOfTextAtSize("KaçaYapayım ile hazırlandı", 8), y: 35, size: 8, font: regular, color: muted });
  }
  return pdf.save();
}
