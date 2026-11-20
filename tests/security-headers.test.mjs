import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("hicbir script-src unsafe-inline icermez", () => {
  for (const f of ["src/middleware.ts", "next.config.ts"]) {
    for (const m of read(f).matchAll(/script-src[^;`"]*/g)) assert.doesNotMatch(m[0], /unsafe-inline/, f);
  }
});

test("middleware nonce CSP'yi zorunlu header olarak yazar", () => {
  const s = read("src/middleware.ts");
  assert.doesNotMatch(s, /Report-Only/);
  assert.match(s, /response\.headers\.set\("Content-Security-Policy"/);
  assert.match(s, /'nonce-\$\{nonce\}' 'strict-dynamic'/);
  assert.match(s, /return decorate\(NextResponse\.redirect/);
});

test("next.config statik CSP gondermez, HSTS sadece production", () => {
  const s = read("next.config.ts");
  assert.doesNotMatch(s, /key: "Content-Security-Policy"/);
  assert.match(s, /Strict-Transport-Security/);
  assert.doesNotMatch(s, /preload/);
});

test("GA scriptleri nonce alir", () => {
  const s = read("src/app/layout.tsx");
  assert.match(s, /headers\(\)\)\.get\("x-nonce"\)/);
  const scripts = s.match(/<Script[\s\S]*?(?:\/>|<\/Script>)/g) ?? [];
  assert.equal(scripts.length, 2);
  for (const t of scripts) assert.match(t.split(">")[0], /nonce=\{nonce\}/);
});
