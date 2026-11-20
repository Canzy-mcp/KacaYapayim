import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";

const coreSource = new URL("../packages/core/src/marketplace.ts", import.meta.url).href;
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    return nextResolve(specifier === "@kacayapayim/core/marketplace" ? coreSource : specifier, context);
  },
});
const { parseMarketForm } = await import("../src/lib/marketplace/form-payload.ts");
const { requestReturnPath } = await import("../src/lib/account/home.ts");
const { compareHref, directoryHref, requestHref } = await import("../src/lib/marketplace/prefill.ts");
const { profileChecklist } = await import("../src/lib/marketplace/profile-completeness.ts");
hooks.deregister();

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const id = "10000000-2000-4000-8000-000000000001";
const usta = "10000000-2000-4000-8000-000000000002";
const form = (fields) => { const data = new FormData(); for (const [k, v] of Object.entries(fields)) data.set(k, v); return data; };
const offer = (amount) => parseMarketForm("offer", form({ id, amount, body: "Kapsam yazısı" }));

test("Turkish money notation becomes a canonical decimal string", () => {
  assert.equal(offer("1.234,56").payload?.amount, "1234.56");
  assert.equal(offer("450,20").payload?.amount, "450.20");
  assert.equal(offer("450").payload?.amount, "450.00");
  for (const bad of ["abc", "0", "0,00", "-5", "1,234.56"]) assert.ok(offer(bad).error, bad);
  const create = parseMarketForm("create", form({ id, category: "boya", title: "Salon boyası", body: "Salon ve koridor boyanacak.", city: "İstanbul", district: "Kadıköy", amount: "12.500,5" }));
  assert.equal(create.payload?.amount, "12500.50");
  assert.equal(parseMarketForm("create", form({ id, category: "boya", title: "Salon boyası", body: "Salon ve koridor boyanacak.", city: "İstanbul", district: "Kadıköy" })).payload?.amount, "");
});

test("money inputs are text with decimal keyboard", () => {
  assert.doesNotMatch(read("src/components/marketplace/request-form.tsx"), /type="number"/);
  assert.doesNotMatch(read("src/app/talepler/[id]/page.tsx"), /type="number"/);
});

test("request link builder is canonical and survives the login return path", () => {
  const href = requestHref({ district: "Kadıköy", city: "İstanbul", category: "boya", usta });
  assert.equal(href, `/talepler/yeni?${new URLSearchParams({ usta, category: "boya", city: "İstanbul", district: "Kadıköy" })}`);
  assert.equal(requestReturnPath(href), href);
});

test("compare and directory links keep filters, page and selection", () => {
  assert.equal(compareHref([id, usta], { category: "boya", city: "İzmir" }, 3), `/usta-bul/karsilastir?${new URLSearchParams({ ids: `${id},${usta}`, category: "boya", city: "İzmir", page: "3" })}`);
  assert.equal(directoryHref({ city: "İzmir" }, { page: 2, compare: [id] }), `/usta-bul?${new URLSearchParams({ city: "İzmir", compare: id, page: "2" })}`);
});

test("comparison tray disables the action below two selections", () => {
  const ui = read("src/components/marketplace/ui.tsx");
  assert.match(ui, /count >= 2 \? <Link href=\{href\}[^>]*>Karşılaştır<\/Link> : <button type="button" disabled/);
  assert.match(ui, /fixed inset-x-0 bottom-0/);
  assert.doesNotMatch(read("src/app/(marketing)/usta-bul/page.tsx"), /aria-disabled=\{compare/);
});

test("profile JSON-LD names the usta as the business and the platform only as publisher", () => {
  const page = read("src/app/(marketing)/usta-bul/[id]/page.tsx");
  assert.match(page, /"@id": business/);
  assert.match(page, /\$\{url\}#business/);
  assert.match(page, /publisher: \{ "@id": organizationId \}/);
  assert.doesNotMatch(page, /provider: \{ "@id": organizationId/);
  assert.doesNotMatch(page, /#usta`/);
});

test("profile 404s when missing and throws on outage; directory renders ItemList", () => {
  const page = read("src/app/(marketing)/usta-bul/[id]/page.tsx");
  assert.match(page, /if \(!provider\) notFound\(\)/);
  assert.match(page, /if \(!directory\) throw new Error/);
  assert.doesNotMatch(page.slice(page.indexOf("const loadProfile"), page.indexOf("export async function generateMetadata")), /catch/);
  const dir = read("src/app/(marketing)/usta-bul/page.tsx");
  assert.match(dir, /"ItemList"/);
  assert.match(dir, /position: \(page - 1\) \* 20 \+ index \+ 1/);
  const error = read("src/app/(marketing)/usta-bul/error.tsx");
  assert.match(error, /"use client"/);
  assert.match(error, /Tekrar dene/);
});

test("provider completeness checklist reports the five items", () => {
  const empty = profileChecklist(null);
  assert.deepEqual(empty.map((i) => i.key), ["category", "city", "districts", "bio", "published"]);
  assert.ok(empty.every((i) => !i.done));
  const full = profileChecklist({ id, display_name: "A", bio: "x".repeat(120), city: "İzmir", districts: ["Bornova"], categories: ["boya"], published: true, suspended: false });
  assert.ok(full.every((i) => i.done));
  assert.equal(profileChecklist({ ...{ id, display_name: "A", bio: "x".repeat(119), city: "İzmir", districts: [], categories: ["boya"] }, published: true, suspended: true }).filter((i) => i.done).length, 2);
});
