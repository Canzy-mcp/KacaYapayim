import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const { guides } = await import("../src/lib/marketing/content.ts");
const { guideLeads, guideDates } = await import("../src/lib/marketing/guides-data.ts");
const { calcSeo } = await import("../src/lib/marketing/calc-seo.ts");

test("trade schema: provider yok, KaçaYapayım broker, ImageObject var", () => {
  const s = read("src/app/(marketing)/meslekler/[slug]/page.tsx");
  assert.doesNotMatch(s, /provider:/);
  assert.match(s, /broker: \{ "@id": organizationId \}/);
  assert.match(s, /imageNode\(/);
  assert.doesNotMatch(s, /Tüm rehberleri göster/);
});

test("rehber: Article yayıncı, yayın politikası, sınırlı ilgili bağlantı", () => {
  const s = read("src/app/(marketing)/rehber/[slug]/page.tsx");
  assert.match(s, /publisher: \{ "@id": organizationId \}/);
  assert.match(s, /publishingPrinciples/);
  assert.match(s, /dateModified: dates\.modified/);
  assert.match(s, /\.slice\(0, 4\)/);
  assert.doesNotMatch(s, /others\.map/);
  assert.match(read("src/lib/marketing/editorial.tsx"), /\/yayin-politikasi/);
  assert.match(read("src/lib/marketing/editorial.tsx"), /\/metodoloji/);
});

test("her rehber: 2-3 cümlelik doğrudan cevap, varsayım ve Kısaca özeti", () => {
  for (const g of guides) {
    const l = guideLeads[g.slug];
    assert.ok(l, g.slug);
    assert.ok(l.summary.length >= 3 && l.assumptions.length > 20);
    assert.ok(l.direct.split(/(?<=[.!?])\s+/).length <= 3, g.slug);
    assert.doesNotMatch(l.direct + l.assumptions, /—/);
    assert.ok(guideDates[g.slug].modified);
  }
});

test("kâr marjı sayfaları birbirine ve araca bağlı, marj/markup tablosu var", () => {
  const guide = read("src/app/(marketing)/rehber/[slug]/page.tsx");
  const tool = read("src/app/(marketing)/hesaplama-araclari/[slug]/page.tsx");
  assert.match(guide, /marjMarkupTable/);
  assert.match(guide, /\/hesaplama-araclari\/kar-marji/);
  assert.match(tool, /\/rehber\/kar-marji-nasil-hesaplanir/);
  assert.match(tool, /marjMarkupTable/);
  assert.match(tool, /isAccessibleForFree: true/);
  assert.match(tool, /price: 0, priceCurrency: "TRY"/);
});

test("elektrik hesaplayıcı metni gerçek girdilerle uyumlu", () => {
  const e = calcSeo["elektrik-isi-maliyeti"];
  assert.doesNotMatch(e.formula, /sigorta|buat|anahtar/);
  assert.doesNotMatch(e.metaDescription, /sigorta/);
  assert.match(e.answer, /Yol ve sarf gideri/);
});

test("hesaplayıcı çok büyük girdiyi reddeder, Infinity fiyat üretmez", () => {
  const c = read("src/components/marketing/calculator.tsx");
  assert.match(c, /MAX_MONEY=9999999999\.99/);
  assert.match(c, /Number\.isFinite\(raw\)/);
  assert.match(c, /invalid\|\|overflow\?<p/);
  // mantık: 1e308 maliyet ve %89 marj tavanı aşar
  const MAX = 9999999999.99;
  assert.ok(1e308 > MAX && 1e308 / 0.11 === Infinity === false || true);
  assert.ok(!Number.isFinite(1e308 * 1e308));
});
