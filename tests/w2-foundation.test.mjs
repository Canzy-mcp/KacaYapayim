import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const globals = read("src/app/globals.css");
const marketing = read("src/app/(marketing)/marketing.css");
const shell = read("src/components/marketing/shell.tsx");
const mobile = read("src/components/marketing/mobile-navigation.tsx");
const motion = read("src/components/marketing/motion.tsx");
const consent = read("src/components/marketing/analytics-consent.tsx");
const blocks = read("src/lib/marketing/blocks.tsx");

test("design tokens exist", () => {
  for (const token of ["--ky-ink: #1d1d1f", "--ky-ink-2", "--ky-caption", "--ky-line", "--ky-bg", "--ky-band: #f5f5f7", "--ky-primary: #075d54", "--ky-primary-hover: #064a43", "--ky-primary-soft", "--ky-radius: 20px"]) assert.ok(globals.includes(token), token);
  assert.match(globals, /--ky-fs-display: clamp\(/);
});

test("marketing utilities exist", () => {
  for (const cls of [".ky-container", ".ky-band-alt", ".ky-display", ".ky-headline", ".ky-title", ".ky-body", ".ky-caption", ".ky-eyebrow", ".ky-btn", ".ky-btn-secondary", ".ky-link", ".ky-card", ".ky-tile-grid", ".ky-photo", ".ky-local-nav"]) assert.ok(marketing.includes(cls), cls);
  assert.match(marketing, /--ky-section: 80px/);
  assert.match(marketing, /--ky-section: 112px/);
});

test("legacy class names are still styled", () => {
  for (const cls of [".marketing-header", ".marketing-container", ".ky-footer", ".profession-grid", ".ky-hero", ".pricing-intro", ".ky-faq-list", ".ky-final", ".ky-service-grid"]) assert.ok(marketing.includes(cls), cls);
});

test("header is 56px translucent with blur and opaque fallback", () => {
  assert.match(marketing, /rgba\(255,255,255,\.85\)/);
  assert.match(marketing, /blur\(16px\)/);
  assert.match(marketing, /@supports not/);
  assert.match(marketing, /\.marketing-header-inner \{[^}]*height: 56px/);
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

test("motion is once-only, 8px/180ms, reduced-motion aware", () => {
  assert.match(motion, /unobserve/);
  assert.match(motion, /prefers-reduced-motion/);
  assert.match(marketing, /translateY\(8px\)/);
  assert.match(marketing, /180ms/);
});

test("consent banner keeps logic and is a compact card / bottom sheet", () => {
  assert.match(consent, /ky_analytics_consent/);
  assert.match(consent, /sm:w-\[380px\]/);
  assert.match(consent, /bottom-0/);
});

test("blocks keeps old exports and adds new primitives", () => {
  for (const name of ["btnPrimary", "btnSecondary", "chip", "card", "h2Class", "PageShell", "Crumbs", "Eyebrow", "Hero", "DataTable", "Faq", "Checklist", "Sources", "Band", "SectionHeader", "PhotoTile", "FeatureTile", "StatTile", "Steps", "FaqList", "CtaBand", "Breadcrumbs"]) assert.match(blocks, new RegExp(`export (function|const) ${name}\\b`), name);
});
