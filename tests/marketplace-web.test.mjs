import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { appointmentBounds } from "../src/lib/marketplace/appointment.ts";

// The workspace export points to TypeScript, which Node does not strip under node_modules.
const coreSource = new URL("../packages/core/src/marketplace.ts", import.meta.url).href;
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    return nextResolve(specifier === "@kacayapayim/core/marketplace" ? coreSource : specifier, context);
  },
});
const { accountHome, providerSetupPath, requestReturnPath } = await import("../src/lib/account/home.ts");
const { parseMarketForm } = await import("../src/lib/marketplace/form-payload.ts");
hooks.deregister();

const id = "10000000-2000-4000-8000-000000000001";
const provider = "10000000-2000-4000-8000-000000000002";
const form = (fields) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
};

test("marketplace login resumes supported deep links and drops unknown destinations", () => {
  for (const path of ["/talepler", `/talepler/${id}`, `/talepler/${id}/duzenle`, `/talepler/${id}?mesaj=101`, `/talepler/yeni?usta=${provider}`]) {
    assert.equal(requestReturnPath(path), path);
  }
  for (const path of ["/dashboard", "/talepler/yeni?usta=bilinmiyor", `/talepler/${id}?mesaj=102`, `/talepler/${id}/randevu`, `/talepler/${id}?mesaj=1&mesaj=2`]) {
    assert.equal(requestReturnPath(path), undefined);
  }
});

test("login resumes a prefilled new request only in canonical, validated form", () => {
  const q = (o) => "/talepler/yeni?" + new URLSearchParams(o).toString();
  for (const path of [q({ category: "boya", city: "İstanbul", district: "Kadıköy" }), q({ usta: provider, category: "tesisat" }), q({ city: "İzmir" })])
    assert.equal(requestReturnPath(path), path);
  for (const path of ["/talepler/yeni?category=boya&category=boya", "/talepler/yeni?x=1", "/talepler/yeni?category=Boya1",
    "/talepler/yeni?city=%3Cscript%3E", "/talepler/yeni?city=a", q({ category: "boya" }) + "&next=//evil",
    "/talepler/yeni?district=Kad%C4%B1k%C3%B6y&city=Ankara", "/talepler/yeni?"])
    assert.equal(requestReturnPath(path), undefined);
});

test("account home keeps customer intent separate from provider onboarding", () => {
  assert.equal(accountHome(null, "customer"), "/talepler");
  assert.equal(accountHome({ onboarding_completed: true }, "customer"), "/talepler");
  assert.equal(accountHome(null, "provider"), "/onboarding");
  assert.equal(accountHome(null, undefined), "/onboarding");
  assert.equal(accountHome(null, "admin"), "/onboarding");
  assert.equal(accountHome({ onboarding_completed: true }, "provider"), "/dashboard");
});

test("login and MFA preserve exact admin and provider setup destinations", () => {
  for (const path of [providerSetupPath, "/onboarding", "/admin", "/admin?gun=90", "/admin/analytics",
    "/admin/professions", `/admin/professions?id=${id}`, "/admin/talepler", "/admin/talepler?page=101"]) {
    assert.equal(requestReturnPath(path), path);
  }
  for (const path of ["/onboarding?usta=0", "/admin?gun=31", "/admin?t=1", "/admin/talepler?page=102",
    "/admin/professions?id=invalid", `/admin/professions?id=${id}&next=/admin`, "//external.example/admin"]) {
    assert.equal(requestReturnPath(path), undefined);
  }
});

test("form data normalizes a decimal price and preserves offer version precision", () => {
  const version = "2026-10-25T10:11:12.123456+00:00";
  assert.deepEqual(parseMarketForm("offer", form({ id, amount: " 1200,50 ", body: " Musluk değişimi " })).payload,
    { id, amount: "1200.50", body: "Musluk değişimi" });
  assert.deepEqual(parseMarketForm("award", form({ id, offer: provider, version })).payload,
    { id, offer: provider, version });
  assert.equal(parseMarketForm("offer", form({ id, amount: "1.234", body: "Musluk değişimi" })).payload?.amount, "1234.00"); // Turkish grouping
  assert.ok(parseMarketForm("offer", form({ id, amount: "1,234.5", body: "Musluk değişimi" })).error);
});

test("form data preserves explicit address revocation and validates shared address length", () => {
  assert.deepEqual(parseMarketForm("address", form({ id, body: "" })).payload, { id, body: "", share: false });
  assert.ok(parseMarketForm("address", form({ id, body: " ", share: "on" })).error);
  assert.deepEqual(parseMarketForm("report", form({ provider, body: "Yanlış bilgi" })).payload, { provider, body: "Yanlış bilgi" });
});

test("appointment controls follow Istanbul time across the UTC date boundary", () => {
  assert.deepEqual(appointmentBounds(new Date("2026-11-19T20:59:42Z")), { min: "2026-11-20T00:00", max: "2027-11-19T23:59" });
  assert.ok(parseMarketForm("appointment", form({ id, at: "2027-02-29T11:00" })).error);
  assert.deepEqual(parseMarketForm("appointment", form({ id, at: "2028-02-29T11:00" })).payload, { id, at: "2028-02-29T11:00" });
});
