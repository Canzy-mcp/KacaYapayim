import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const page = read("src/app/(marketing)/page.tsx");
const css = read("src/app/(marketing)/marketing.css");
const globals = read("src/app/globals.css");
const shell = read("src/components/marketing/shell.tsx");
const nav = read("src/components/marketing/mobile-navigation.tsx");

test("home search is a plain GET form using the directory parameter names", () => {
  assert.match(page, /<form action="\/usta-bul" method="get"/);
  for (const name of ["category", "city", "district"]) assert.match(page, new RegExp(`name="${name}"`));
  for (const slug of ["boya", "elektrik", "tesisat", "klima", "isitma", "mobilya", "tadilat", "seramik", "zemin", "cati", "cam", "celik", "bahce", "cihaz", "temizlik", "nakliye", "diger"]) assert.ok(page.includes(`["${slug}",`), slug);
  assert.match(page, /href="\/talepler\/yeni"/);
});

test("hero uses the new photo with priority and keeps SEO JSON-LD", () => {
  assert.match(page, /hero-kesif\.webp/);
  assert.match(page, /priority/);
  assert.match(page, /<JsonLd/);
  assert.match(page, /usta-teklif\.webp/);
});

test("home has FAQ details and trust claims", () => {
  assert.ok((page.match(/<details/g) ?? []).length >= 1);
  assert.ok(page.includes("faqs.map"));
  assert.match(page, /Müşteriler için ücretsiz/);
});

test("design tokens exist and grids use shrinkable tracks", () => {
  for (const token of ["--ky-band: #f5f5f7", "--ky-ink: #1d1d1f", "--ky-primary: #075d54", "--ky-primary-hover: #064a43"]) assert.ok(globals.includes(token), token);
  assert.ok(!/grid-template-columns:\s*(repeat\(\d+,\s*1fr\)|1fr[ ;])/.test(css), "use minmax(0, 1fr)");
  assert.match(css, /@media \(max-width: 899px\)[\s\S]*\.demo-body \{ grid-template-columns: minmax\(0, 1fr\)/);
});

test("header groups navigation and exposes accessible disclosures", () => {
  for (const label of ["Usta bul", "İş ilanı ver", "Hizmetler", "Rehber", "Ustalar için", "Giriş yap"]) assert.ok(shell.includes(label), label);
  assert.match(nav, /aria-expanded=\{open\}/);
  assert.match(nav, /Escape/);
});

test("footer groups links and keeps the cookie settings button", () => {
  for (const title of ["Müşteriler", "Ustalar", "Şirket"]) assert.ok(shell.includes(`"${title}"`), title);
  for (const href of ["/hakkimizda", "/iletisim", "/gizlilik", "/kullanim-kosullari", "/cerez-politikasi", "/metodoloji"]) assert.ok(shell.includes(href), href);
  assert.match(shell, /CookieSettingsButton/);
});

test("reduced motion is honored in marketing css", () => {
  assert.match(css, /prefers-reduced-motion: reduce/);
});
