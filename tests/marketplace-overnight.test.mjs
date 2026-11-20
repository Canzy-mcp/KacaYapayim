import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { briefTemplates, cleanText, directoryHref, parseCompareIds, parseRequestPrefill, requestHref, requestStages, trimDescription } from "../src/lib/marketplace/prefill.ts";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const a = "10000000-2000-4000-8000-000000000001";
const b = "10000000-2000-4000-8000-000000000002";

test("directory links keep filters, compare ids and pagination", () => {
  assert.equal(directoryHref({}), "/usta-bul");
  assert.equal(directoryHref({ category: "boyaci", city: "Ankara", district: "", q: "" }, { page: 3, compare: [a] }),
    `/usta-bul?category=boyaci&city=Ankara&compare=${a}&page=3`);
});

test("request prefill validates category and limits text", () => {
  const got = parseRequestPrefill({ category: "boyaci", city: `  ${"x".repeat(200)} `, district: "Kadıköy" }, ["boyaci"]);
  assert.equal(got.category, "boyaci");
  assert.equal(got.city.length, 80);
  assert.equal(parseRequestPrefill({ category: "yok" }, ["boyaci"]).category, "");
  assert.equal(parseRequestPrefill({ category: ["boyaci"] }, ["boyaci"]).category, "");
  assert.equal(requestHref({ category: "boyaci", district: "Kadıköy" }), "/talepler/yeni?category=boyaci&district=Kad%C4%B1k%C3%B6y");
  assert.equal(cleanText(7, 5), "");
});

test("compare ids are validated, deduplicated and capped at three", () => {
  assert.deepEqual(parseCompareIds(`${a},${a.toUpperCase()},bad,${b}`), [a, b]);
  const many = Array.from({ length: 5 }, (_, i) => `10000000-2000-4000-8000-00000000000${i}`).join(",");
  assert.equal(parseCompareIds(many).length, 3);
  assert.deepEqual(parseCompareIds(undefined), []);
});

test("four brief templates carry the scaffold headings and the timeline has five stages", () => {
  assert.equal(briefTemplates.length, 4);
  for (const template of briefTemplates) assert.match(template.text, /Mevcut durum[\s\S]*Malzeme kimden[\s\S]*Tercih edilen zaman/);
  assert.deepEqual(requestStages.map((stage) => stage.label), ["Açık", "Usta seçildi", "İşte", "Onay bekliyor", "Tamamlandı"]);
  assert.ok(trimDescription("kelime ".repeat(60)).length <= 156);
});

test("directory page offers district removal and carries filters into the request form", () => {
  const page = read("src/app/(marketing)/usta-bul/page.tsx");
  assert.match(page, /İlçe filtresini kaldır/);
  assert.match(page, /requestHref\(\{ category: filters\.category, city: filters\.city, district: filters\.district \}\)/);
  assert.match(page, /Seçili filtreler/);
});

test("profile page sets metadata, JSON-LD with escaped output and the review provenance note", () => {
  const page = read("src/app/(marketing)/usta-bul/[id]/page.tsx");
  assert.match(page, /export async function generateMetadata/);
  assert.match(page, /JsonLd/);
  assert.match(page, /reviewCount > 0/);
  assert.match(page, /Yalnızca tamamlanan işlerden sonra müşterinin bıraktığı değerlendirmeler gösterilir\./);
  assert.match(page, /Bu ustadan teklif iste/);
  assert.match(read("src/lib/marketing/seo.tsx"), /replace\(\/<\/g, "\\\\u003c"\)/);
});

test("compare page is noindex and the request form keeps field names", () => {
  assert.match(read("src/app/(marketing)/usta-bul/karsilastir/page.tsx"), /index: false/);
  const form = read("src/components/marketplace/request-form.tsx");
  for (const name of ["category", "title", "body", "city", "district", "date", "amount", "address"]) assert.ok(form.includes(`name="${name}"`), name);
  assert.match(read("src/app/talepler/yeni/page.tsx"), /parseRequestPrefill/);
});
