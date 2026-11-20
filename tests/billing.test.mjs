import assert from "node:assert/strict";
import test from "node:test";
import { fallbackPlans, hasFeature, limitReached, monthBounds, resolvePlanId } from "../src/lib/billing/catalog.ts";

test("missing and expired subscriptions resolve to Free", () => {
  assert.equal(resolvePlanId(null), "free");
  const subscription = { plan_id: "pro", status: "active", current_period_end: "2026-10-01T00:00:00Z" };
  assert.equal(resolvePlanId(subscription, new Date("2026-09-30T00:00:00Z")), "pro");
  assert.equal(resolvePlanId(subscription, new Date("2026-10-01T00:00:00Z")), "free");
  assert.equal(resolvePlanId({ ...subscription, status: "cancelled" }, new Date("2026-09-30T00:00:00Z")), "free");
});

test("without membership no quotes are allowed; membership is unlimited with the full feature set", () => {
  const [free, member] = fallbackPlans;
  assert.equal(limitReached(free, "monthly_quotes", 0), true);
  assert.equal(limitReached(member, "monthly_quotes", 500), false);
  assert.equal(limitReached(member, "active_customers", 5000), false);
  assert.equal(hasFeature(free, "remove_branding"), false);
  for (const feature of ["actual_profit", "advanced_reports", "remove_branding", "business_logo"]) assert.equal(hasFeature(member, feature), true);
  assert.equal(resolvePlanId({ plan_id: "pro", status: "active", current_period_end: "2126-01-01T00:00:00Z" }, new Date("2030-01-01T00:00:00Z")), "pro");
});

test("quote allowance resets at Istanbul calendar month boundary", () => {
  assert.deepEqual(monthBounds(new Date("2026-09-30T20:59:59Z")), {
    start: "2026-08-31T21:00:00.000Z", end: "2026-09-30T21:00:00.000Z",
  });
  assert.deepEqual(monthBounds(new Date("2026-09-30T21:00:00Z")), {
    start: "2026-09-30T21:00:00.000Z", end: "2026-10-31T21:00:00.000Z",
  });
});
