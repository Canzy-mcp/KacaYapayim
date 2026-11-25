import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("sitemap anon istemci kullanir ve yeni sayfalari icerir", () => {
  const s = read("src/app/sitemap.ts");
  assert.match(s, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.match(s, /persistSession: false/);
  assert.doesNotMatch(s, /createServiceClient|SERVICE_ROLE/);
  for (const p of ["/nasil-calisir", "/ustalar-icin", "/guvenli-hizmet", "/yayin-politikasi"]) assert.ok(s.includes(`"${p}"`), p);
});

test("seo.tsx kurumsal dugumleri ve yardimcilari export eder", () => {
  const s = read("src/lib/marketing/seo.tsx");
  for (const n of ["itemListNode", "collectionPageNode", "imageObjectNode", "howToNode", "serviceNode", "ogImageUrl", "faqNode", "breadcrumbNode", "webPageNode", "graph"]) assert.match(s, new RegExp(`export function ${n}\\b`), n);
  assert.match(s, /knowsAbout/);
  assert.match(s, /areaServed: \{ "@type": "Country", name: "Türkiye" \}/);
  assert.doesNotMatch(s, /streetAddress|sameAs/);
});

test("OG route fotograf ve basligi kullanir, siteMetadata gorsel secer", () => {
  const og = read("src/app/api/og/route.tsx");
  assert.match(og, /musteri-randevu/);
  assert.match(og, /params\.get\("image"\)/);
  assert.match(read("src/lib/marketing/seo.tsx"), /\/api\/og\?/);
});

test("robots arama ve egitim tarayicilarini ayirir, /api/og acik", () => {
  const s = read("src/app/robots.ts");
  for (const b of ["OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "Claude-User", "PerplexityBot", "GPTBot", "ClaudeBot", "Google-Extended", "Applebot-Extended"]) assert.ok(s.includes(b), b);
  assert.match(s, /allow: \["\/", "\/api\/og"\]/);
  assert.match(s, /disallow: \["\/api\/"\]/);
});

test("manifest marka renkleri ve ikonlar", () => {
  const s = read("src/app/manifest.ts");
  assert.match(s, /theme_color: "#1554f0"/);
  assert.match(s, /background_color: "#f5f2ec"/);
  assert.match(s, /short_name: "KaçaYapayım"/);
});

test("kok metadata alanlari", () => {
  const s = read("src/app/layout.tsx");
  for (const k of ["applicationName", "category", "formatDetection", "NEXT_PUBLIC_BING_SITE_VERIFICATION", "summary_large_image"]) assert.ok(s.includes(k), k);
});

test("llms.txt kurumsal bilgiler ve yeni sayfalar", () => {
  const s = read("src/lib/marketing/llms.ts");
  assert.match(s, /## Kurumsal bilgiler/);
  assert.match(s, /yalnızca müşteri, işi verdikten sonra adresi açıkça paylaşmayı seçerse/);
  assert.match(s, /Müşteriler için ücretsiz/);
  for (const p of ["/nasil-calisir", "/ustalar-icin", "/guvenli-hizmet", "/yayin-politikasi"]) assert.ok(s.includes(`"${p}"`), p);
});
