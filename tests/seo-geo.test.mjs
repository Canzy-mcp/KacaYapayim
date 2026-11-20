import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import test from "node:test";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const { trades, quotePrice } = await import("../src/lib/marketing/trades.ts");
const { guides, professions } = await import("../src/lib/marketing/content.ts");
const { guideGroups, guideDates, guideTables, guideMetaTitles } = await import("../src/lib/marketing/guides-data.ts");
const { calcSeo } = await import("../src/lib/marketing/calc-seo.ts");
const { calculators } = await import("../src/lib/marketing/calculators.ts");
const TEMPLATE = " | KaçaYapayım".length;

test("canonical origin production'da localhost'a dusmez", () => {
  const s = read("src/lib/marketing/seo.tsx");
  assert.match(s, /APP_URL yapılandırması eksik/);
  assert.match(s, /prod && \(url\.protocol !== "https:"/);
  assert.match(read("src/app/layout.tsx"), /metadataBase: new URL\(siteOrigin\)/);
  assert.doesNotMatch(read("src/app/layout.tsx"), /process\.env\.APP_URL/);
});

test("siteMetadata mutlak canonical, hreflang tr-TR ve OG/Twitter uretir", () => {
  const s = read("src/lib/marketing/seo.tsx");
  assert.match(s, /canonical: url/);
  assert.match(s, /"tr-TR": url/);
  assert.match(s, /summary_large_image/);
  assert.match(s, /replace\(\/<\/g, "\\\\u003c"\)/);
});

test("Organization ve WebSite sabit @id ve SearchAction tasir", () => {
  const s = read("src/lib/marketing/seo.tsx");
  assert.match(s, /#organization/);
  assert.match(s, /#website/);
  assert.match(s, /usta-bul\?q=\{search_term_string\}/);
  assert.match(read("src/app/(marketing)/usta-bul/page.tsx"), /q: "Usta adı"/);
  assert.doesNotMatch(s, /sameAs/);
});

test("basliklar ve aciklamalar sinirlar icinde", () => {
  const titles = [
    ...trades.map((t) => [t.metaTitle, t.metaDescription]),
    ...Object.values(calcSeo).map((c) => [c.metaTitle, c.metaDescription]),
    ...guides.map((g) => [guideMetaTitles[g.slug] ?? g.title, g.answer.length > 155 ? "x".repeat(155) : g.answer]),
  ];
  for (const [title, description] of titles) {
    assert.ok(title.length + TEMPLATE <= 60, `${title} (${title.length + TEMPLATE})`);
    assert.ok(description.length <= 155, `${description} (${description.length})`);
  }
  assert.equal(new Set(titles.map((t) => t[0])).size, titles.length);
});

test("her meslek icin usta bul, ilan ve kapsam icerigi var", () => {
  assert.deepEqual(trades.map((t) => [t.slug, t.category]), [["boyaci", "boya"], ["elektrikci", "elektrik"], ["tesisatci", "tesisat"], ["klimaci", "klima"]]);
  for (const p of professions) assert.ok(trades.some((t) => t.slug === p.slug));
  for (const t of trades) {
    assert.ok(t.h1.endsWith("ustası bul ve fiyat hesapla"));
    assert.ok(t.scope.length >= 5 && t.faqs.length >= 3 && t.drivers.length >= 4);
    assert.match(t.imageAlt, /temsili görsel/);
    for (const g of t.guides) assert.ok(guides.some((x) => x.slug === g), g);
    for (const c of t.calculators) assert.ok(calculators.some((x) => x.slug === c), c);
  }
  const page = read("src/app/(marketing)/meslekler/[slug]/page.tsx");
  assert.match(page, /usta-bul\?category=\$\{t\.category\}/);
  assert.match(page, /talepler\/yeni\?category=\$\{t\.category\}/);
  assert.match(page, /"@type": "Service"/);
  assert.match(page, /faqNode/);
  assert.match(page, /tadilat/);
});

test("ornek teklif hesaplari icerikteki rakamlarla tutarli", () => {
  const byslug = Object.fromEntries(trades.map((t) => [t.slug, t]));
  assert.equal(quotePrice(57510, 30).rounded, 82200);
  assert.equal(quotePrice(21000, 30).exact, 30000);
  assert.equal(quotePrice(15000, 25).exact, 20000);
  assert.equal(quotePrice(10000, 20).exact, 12500);
  for (const t of trades) if (t.quote.lines.length) assert.equal(t.quote.lines.reduce((s, [, n]) => s + n, 0), t.quote.cost);
  assert.ok(byslug.boyaci.quote.lines.length === 0);
});

test("rehber: gruplar tum rehberleri kapsar, tarih ve kaynak var", () => {
  const grouped = guideGroups.flatMap((g) => g.slugs);
  assert.deepEqual([...grouped].sort(), guides.map((g) => g.slug).sort());
  for (const g of guides) {
    assert.match(guideDates[g.slug].published, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(guideDates[g.slug].modified >= guideDates[g.slug].published);
    assert.ok(guideTables[g.slug], g.slug);
  }
  const page = read("src/app/(marketing)/rehber/[slug]/page.tsx");
  assert.match(page, /Son güncelleme/);
  assert.match(page, /"@type": "Article"/);
  assert.match(page, /citation:/);
  assert.match(page, /author: \{ "@id": organizationId \}/);
  assert.match(page, /Aynı konudaki rehberler/);
  assert.match(page, /Diğer rehberler/);
  assert.ok(guides.some((g) => g.slug === "usta-yaklasik-fiyat-nasil-alinir"));
});

test("hesaplama araclari tam eslesen baslik ve SSS tasir", () => {
  assert.equal(calcSeo["kar-marji"].h1, "Kâr marjı hesaplama");
  assert.match(calcSeo["kar-marji"].faqs.map((f) => f[0]).join("|"), /Kâr marjı nasıl hesaplanır\?/);
  assert.match(calcSeo["boya-maliyeti"].metaDescription, /boya badana fiyat hesaplama/i);
  assert.match(calcSeo["elektrik-isi-maliyeti"].h1, /Elektrik yaklaşık maliyet hesaplama/);
  for (const c of calculators) assert.ok(calcSeo[c.slug]);
});

test("fiyatlandirma tek seferlik 199 TL uyeligi gosterir, odeme kapaliyken not var", () => {
  const s = read("src/app/(marketing)/fiyatlandirma/page.tsx");
  assert.match(s, /ENTRY_FEE_KURUS/);
  assert.match(s, /Ödeme çok yakında/);
  assert.match(s, /BILLING_PROVIDER/);
  assert.match(s, /priceCurrency: "TRY"/);
  assert.doesNotMatch(s, /yearly_price_kurus|monthly_price_kurus/);
  assert.match(s, /faqNode/);
});

test("sitemap tum public sayfalari ve yayindaki profilleri kapsar", () => {
  const s = read("src/app/sitemap.ts");
  for (const p of ["/usta-bul", "/rehber", "/hesaplama-araclari", "/meslekler", "/fiyatlandirma", "/metodoloji", "/hakkimizda", "/iletisim"]) assert.ok(s.includes(`"${p}"`), p);
  assert.match(s, /market_directory/);
  assert.match(s, /MAX_PROFILES = 2000/);
  assert.match(s, /catch/);
  assert.match(s, /legalReady/);
  assert.match(s, /isStaging\) return \[\]/);
  assert.doesNotMatch(s, /["`]\/(dashboard|quotes|admin|talepler)/);
});

test("robots AI tarayicilarina public icerigi acar, noindex okunabilir kalir", () => {
  const s = read("src/app/robots.ts");
  for (const bot of ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "PerplexityBot", "Google-Extended", "Applebot-Extended"]) assert.ok(s.includes(bot), bot);
  assert.match(s, /sitemap: `\$\{siteOrigin\}\/sitemap\.xml`/);
  assert.match(s, /disallow: \["\/api\/"\]/);
  assert.match(s, /isStaging/);
});

test("llms.txt llmstxt.org bicimine uyar", async () => {
  const route = read("src/app/llms.txt/route.ts");
  assert.match(route, /text\/plain; charset=utf-8/);
  assert.match(route, /max-age=86400/);
  assert.ok(existsSync(new URL("../src/app/llms-full.txt/route.ts", import.meta.url)));
  const s = read("src/lib/marketing/llms.ts");
  assert.match(s, /# KaçaYapayım/);
  assert.match(s, /> \$\{siteSummary\}/);
  for (const h of ["## Hizmetler ve meslekler", "## Hesaplama araçları", "## Rehber", "## Şirket ve yöntem"]) assert.ok(s.includes(h), h);
  for (const p of ["/usta-bul", "/metodoloji", "/hakkimizda", "/fiyatlandirma"]) assert.ok(s.includes(`"${p}"`), p);
});

test("Search Console ve IndexNow dosyalari yerinde", () => {
  assert.match(read("src/app/layout.tsx"), /NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION/);
  assert.match(read("public/indexnow-key.txt").trim(), /^[a-f0-9]{32}$/);
  assert.ok(existsSync(new URL("../scripts/submit-indexnow.mjs", import.meta.url)));
});

test("icerik sayfalarinda em dash ve nonce'suz script yok", () => {
  for (const f of ["src/lib/marketing/trades.ts", "src/lib/marketing/guides-data.ts", "src/lib/marketing/calc-seo.ts", "src/app/(marketing)/fiyatlandirma/page.tsx", "src/app/(marketing)/meslekler/[slug]/page.tsx"]) {
    assert.doesNotMatch(read(f), /—/, f);
    assert.doesNotMatch(read(f), /<script(?![^>]*ld\+json)/, f);
  }
});
