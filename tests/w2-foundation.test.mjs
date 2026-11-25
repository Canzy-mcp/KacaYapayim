import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const globals = read("src/app/globals.css");
const marketing = read("src/app/(marketing)/marketing.css");
// The header markup lives in the island nav; header assertions read both files.
const shell = read("src/components/marketing/shell.tsx") + read("src/components/marketing/island-nav.tsx");
const mobile = read("src/components/marketing/mobile-navigation.tsx");
const motion = read("src/components/marketing/motion.tsx");
const consent = read("src/components/marketing/analytics-consent.tsx");
const blocks = read("src/lib/marketing/blocks.tsx");

test("design tokens live in one @theme and no Apple-era tokens remain", () => {
  for (const token of ["--color-ink:", "--color-ink-2:", "--color-muted:", "--color-line:", "--color-canvas:", "--color-surface:", "--color-primary:", "--color-primary-hover:", "--color-primary-soft:", "--color-tape:", "--color-success:", "--color-danger:", "--radius-lg: 12px", "--color-island:", "--font-display:"]) assert.ok(globals.includes(token), token);
  assert.match(globals, /--fs-display: clamp\(/);
  assert.doesNotMatch(globals, /--ky-|--ease-apple|#075d54|#0071e3/);
});

test("components use tokens, not raw hex colors or AI-style effects", () => {
  const files = [];
  const walk = (dir) => { for (const entry of readdirSync(new URL(`../${dir}`, import.meta.url), { withFileTypes: true })) { const p = `${dir}/${entry.name}`; if (entry.isDirectory()) walk(p); else if (p.endsWith(".tsx")) files.push(p); } };
  walk("src/components"); walk("src/app");
  for (const file of files.filter(f => !f.includes("/api/"))) {
    const s = read(file);
    assert.doesNotMatch(s, /(?:bg|text|border|ring|fill|stroke|from|to|via)-\[#[0-9a-fA-F]{3,8}\]/, file);
    assert.doesNotMatch(s, /backdrop-blur-2xl|bg-clip-text|ky-gradient-text/, file);
  }
});

test("marketing utilities exist", () => {
  for (const cls of [".ky-container", ".ky-band-alt", ".ky-display", ".ky-headline", ".ky-title", ".ky-body", ".ky-caption", ".ky-eyebrow", ".ky-btn", ".ky-btn-secondary", ".ky-link", ".ky-card", ".ky-tile-grid", ".ky-photo", ".ky-local-nav"]) assert.ok(marketing.includes(cls), cls);
  assert.match(marketing, /--ky-section: 80px/);
  assert.match(marketing, /--ky-section: 112px/);
});

test("legacy class names are still styled", () => {
  for (const cls of [".marketing-header", ".marketing-container", ".ky-footer", ".profession-grid", ".ky-hero", ".pricing-intro", ".ky-faq-list", ".ky-final", ".ky-service-grid"]) assert.ok(marketing.includes(cls), cls);
});

test("header is a 64px paper bar and the footer is solid ink with a tape rule", () => {
  assert.match(marketing, /\.marketing-header-inner \{[^}]*height: 64px/);
  assert.match(marketing, /\.marketing-header \{ background: var\(--color-canvas\)/);
  assert.match(marketing, /\.ky-footer \{ background: var\(--color-ink\); border-top: 4px solid var\(--color-tape\)/);
});

test("header and footer links", () => {
  for (const href of ["/usta-bul", "/nasil-calisir", "/meslekler", "/rehber", "/ustalar-icin", "/login", "/register", "/yayin-politikasi", "/guvenli-hizmet", "/cerez-politikasi"]) assert.ok(shell.includes(`"${href}"`), href);
  for (const title of ["Müşteriler", "Ustalar", "Kaynaklar", "Şirket"]) assert.ok(shell.includes(`"${title}"`), title);
  assert.match(shell, /NEXT_PUBLIC_LEGAL_ENTITY_NAME/);
});

test("mobile menu: aria-expanded, Escape, scroll lock, focus trap", () => {
  assert.match(mobile, /aria-expanded/);
  assert.match(mobile, /Escape/);
  assert.match(mobile, /document\.body\.style\.overflow/);
  assert.match(mobile, /event\.key !== "Tab"/);
});

test("motion is once-only, spring-eased and reduced-motion aware", () => {
  assert.match(motion, /unobserve/);
  assert.match(motion, /prefers-reduced-motion/);
  assert.match(marketing, /\.reveal-pending \{ opacity: 0; transform: translateY\(28px\)/);
  assert.match(marketing, /\[data-reveal\], \.ky-reveal \{[^}]*var\(--ease-spring\)/);
  assert.match(marketing, /prefers-reduced-motion: reduce\) \{ \.ky-island/);
});

test("consent banner keeps logic and is a compact card / bottom sheet", () => {
  assert.match(consent, /ky_analytics_consent/);
  assert.match(consent, /sm:w-\[380px\]/);
  assert.match(consent, /bottom-0/);
});

test("blocks keeps old exports and adds new primitives", () => {
  for (const name of ["btnPrimary", "btnSecondary", "chip", "card", "h2Class", "PageShell", "Crumbs", "Eyebrow", "Hero", "DataTable", "Faq", "Checklist", "Sources", "Band", "SectionHeader", "PhotoTile", "FeatureTile", "StatTile", "Steps", "FaqList", "CtaBand", "Breadcrumbs"]) assert.match(blocks, new RegExp(`export (function|const) ${name}\\b`), name);
});
