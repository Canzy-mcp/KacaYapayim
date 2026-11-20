import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const m = (p) => read(`src/app/(marketing)/${p}/page.tsx`);
const pages = ["nasil-calisir", "ustalar-icin", "guvenli-hizmet", "yayin-politikasi", "fiyatlandirma", "ozellikler", "hakkimizda", "iletisim"];

test("every acquisition page has metadata and WebPage/Breadcrumb JSON-LD", () => {
  for (const p of pages) {
    const s = m(p);
    assert.match(s, /siteMetadata|legalMetadata/, p);
    assert.match(s, /PageLd/, p);
    assert.doesNotMatch(s, /—/, p);
  }
});

test("new pages link to their key destinations", () => {
  assert.match(m("ustalar-icin"), /\/onboarding\?usta=1/);
  assert.match(m("ustalar-icin"), /\/register\?hesap=usta/);
  assert.match(m("ustalar-icin"), /\/fiyatlandirma/);
  assert.match(m("yayin-politikasi"), /\/metodoloji/);
  assert.match(m("yayin-politikasi"), /\/iletisim/);
  assert.match(m("yayin-politikasi"), /yapay zeka/i);
  assert.match(m("nasil-calisir"), /musteri-randevu\.webp/);
});

test("address claims never say a direct request shares the address", () => {
  for (const s of [read("src/app/(marketing)/page.tsx"), m("nasil-calisir"), m("guvenli-hizmet")]) {
    assert.doesNotMatch(s, /talep gönderdiğin veya teklifini kabul ettiğin ustayla/);
  }
  assert.match(m("guvenli-hizmet"), /emanet hesabı işletmez/);
});

test("home links to the new destinations", () => {
  const s = read("src/app/(marketing)/page.tsx");
  for (const h of ["/nasil-calisir", "/guvenli-hizmet", "/ustalar-icin", "/hesaplama-araclari/kar-marji"]) assert.ok(s.includes(h), h);
  assert.match(s, /aspect-\[4\/3\] .*md:aspect-\[16\/7\]/);
});

test("pricing uses billingAvailable, provider registration and no PreOrder", () => {
  const s = m("fiyatlandirma");
  assert.match(s, /billingAvailable/);
  assert.match(s, /\/register\?hesap=usta/);
  assert.match(s, /"\/billing"/);
  assert.doesNotMatch(s, /PreOrder/);
});
