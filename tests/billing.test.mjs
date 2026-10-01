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

test("Free limits and plan features remain distinct", () => {
  const [free, usta, pro] = fallbackPlans;
  assert.equal(limitReached(free, "monthly_quotes", 4), false);
  assert.equal(limitReached(free, "monthly_quotes", 5), true);
  assert.equal(limitReached(free, "active_customers", 20), true);
  assert.equal(limitReached(usta, "monthly_quotes", 500), false);
  assert.equal(hasFeature(free, "remove_branding"), false);
  assert.equal(hasFeature(pro, "remove_branding"), true);
});

test("quote allowance resets at Istanbul calendar month boundary", () => {
  assert.deepEqual(monthBounds(new Date("2026-09-30T20:59:59Z")), {
    start: "2026-08-31T21:00:00.000Z", end: "2026-09-30T21:00:00.000Z",
  });
  assert.deepEqual(monthBounds(new Date("2026-09-30T21:00:00Z")), {
    start: "2026-09-30T21:00:00.000Z", end: "2026-10-31T21:00:00.000Z",
  });
});
