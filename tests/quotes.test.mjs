import test from "node:test";
import assert from "node:assert/strict";
import { suggestedPainterScope, addDaysToDateKey, todayInIstanbul } from "../src/lib/quotes/defaults.ts";
import { toCustomerQuotePreview } from "../src/lib/quotes/public-preview.ts";
import { isQuoteId } from "../src/lib/quotes/id.ts";

test("quote routes accept real saved UUIDs and reject malformed identifiers", () => {
  for (const id of ["15db25f9-998d-45aa-935a-f70adaffda79", "d70df7e3-03ad-4363-a0d4-b05be3a0afaa"])
    assert.equal(isQuoteId(id), true);
  assert.equal(isQuoteId("D70DF7E3-03AD-4363-A0D4-B05BE3A0AFAA"), true);
  for (const id of ["", "new", "d70df7e3-03ad-4363-b05be3a0afaa", "d70df7e3-03ad-4363-a0d4-b05be3a0afaa/preview", "../quotes"])
    assert.equal(isQuoteId(id), false);
});

const details = { wall_area: 120, ceiling_area: 80, wall_coats: 2, ceiling_coats: 2,
  primer_required: true, primer_coats: 1, putty_required: false, master_count: 1,
  helper_count: 0, include_consumables: true };

test("painter scope follows primer, ceiling and putty selections", () => {
  const full = suggestedPainterScope(details).map(({ name }) => name);
  assert.ok(full.some((name) => name.includes("astar")));
  assert.ok(full.some((name) => name.includes("tavan")));
  assert.ok(full.some((name) => name.includes("2 kat iç cephe")));
  const reduced = suggestedPainterScope({ ...details, primer_required: false, ceiling_area: 0, putty_required: true }).map(({ name }) => name);
  assert.ok(!reduced.some((name) => name.includes("astar")));
  assert.ok(!reduced.some((name) => name.includes("tavan")));
  assert.ok(reduced.some((name) => name.includes("macun")));
});

test("validity uses calendar days across month and year boundaries", () => {
  assert.equal(addDaysToDateKey("2026-09-29", 7), "2026-10-06");
  assert.equal(addDaysToDateKey("2026-12-29", 7), "2027-01-05");
  assert.equal(todayInIstanbul(new Date("2026-09-28T22:30:00Z")), "2026-09-29");
});

test("customer preview projects only public fields and hides internal financial data", () => {
  const quote = { quote_number: "KY-2026-0001", created_at: "2026-09-28T22:30:00Z", valid_until: "2026-10-06",
    title: "3+1 Daire İç Cephe Boyama", description: "Duvar ve tavan boyama", sale_price: 82200, currency: "TRY",
    estimated_duration_text: "3 iş günü", payment_terms: "%50 başlangıç, %50 teslimde", notes: "Renk seçimi müşteri tarafından yapılır.",
    estimated_cost_snapshot: 57510, estimated_profit_snapshot: 24690, profit_margin_snapshot: 30.0365,
    target_margin_snapshot: 30, minimum_margin_snapshot: 20, public_token: "secret-token" };
  const result = toCustomerQuotePreview({ business: { name: "Yılmaz Boya", logo_url: null, phone: "0500", city: "İstanbul" },
    customer: { name: "Ahmet Yılmaz", company_name: null, phone: "private-phone" }, quote,
    items: [{ name: "2 kat iç cephe boya", description: null, unit_price: 450 }],
    exclusions: [{ text: "Mobilya taşıma" }] });
  assert.equal(result.date, "2026-09-29");
  assert.equal(result.salePrice, 82200);
  const serialized = JSON.stringify(result);
  for (const secret of ["57510", "24690", "30.0365", "secret-token", "private-phone", "unit_price"])
    assert.ok(!serialized.includes(secret), `preview leaked ${secret}`);
});
