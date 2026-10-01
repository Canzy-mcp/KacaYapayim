import test from "node:test";
import assert from "node:assert/strict";
import { calculatePriceForMargin, calculatePricingSummary, calculatePricingStatus,
  roundSuggestedPrice, validateMargins } from "../src/lib/pricing/engine.ts";

test("30% margin on 70,000 cost needs 100,000 sale, not 91,000 markup", () => {
  assert.equal(calculatePriceForMargin(70000, 30), 100000);
});

test("20% minimum margin on 80,000 cost needs 100,000 sale", () => {
  assert.equal(calculatePriceForMargin(80000, 20), 100000);
});

test("Prompt 5 demo rounds both prices upward without crossing margin floors", () => {
  const result = calculatePricingSummary(57510, 30, 20);
  assert.ok(Math.abs(result.exactRecommendedPrice - 82157.142857) < 0.000001);
  assert.equal(result.roundedRecommendedPrice, 82200);
  assert.equal(result.exactMinimumPrice, 71887.5);
  assert.equal(result.minimumPrice, 71900);
  assert.ok(result.profitMargin > 30);
  assert.equal(result.profit, 24690);
  assert.equal(result.status, "target");
  assert.equal(roundSuggestedPrice(71887.5), 71900);
});

test("manual negotiation price computes profit and true margin live", () => {
  const result = calculatePricingSummary(57510, 30, 20, 80000);
  assert.equal(result.profit, 22490);
  assert.equal(result.profitMargin, 28.1125);
  assert.equal(result.status, "acceptable");
  assert.equal(calculatePricingSummary(57510, 30, 20, 70000).status, "below_minimum");
});

test("sale below cost is a loss, including zero sale", () => {
  assert.equal(calculatePricingSummary(57510, 30, 20, 50000).status, "loss");
  const zero = calculatePricingSummary(57510, 30, 20, 0);
  assert.equal(zero.profit, -57510);
  assert.equal(zero.profitMargin, null);
  assert.equal(zero.status, "loss");
});

test("25% is acceptable with 30% target and 20% minimum; 30% meets target", () => {
  assert.equal(calculatePricingStatus(75000, 100000, 30, 20), "acceptable");
  assert.equal(calculatePricingStatus(70000, 100000, 30, 20), "target");
});

test("job margin overrides are validated independently of business defaults", () => {
  assert.equal(validateMargins(25, 20), true);
  assert.equal(validateMargins(30, 35), false);
  assert.equal(validateMargins(0, 0), false);
  assert.equal(validateMargins(100, 20), false);
});
