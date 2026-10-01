import assert from "node:assert/strict";
import test from "node:test";
import { canRespondToQuote } from "../src/lib/quotes/decision.ts";
import { actualProfitSummary, canStartJob, canSaveActualCosts } from "../src/lib/jobs/lifecycle.ts";

test("only current undecided quotes can receive a response", () => {
  assert.equal(canRespondToQuote("viewed", "2026-10-06", "2026-09-29"), true);
  assert.equal(canRespondToQuote("ready", "2026-09-28", "2026-09-29"), false);
  for (const state of ["draft", "accepted", "rejected", "expired", "cancelled"])
    assert.equal(canRespondToQuote(state, "2026-10-06", "2026-09-29"), false);
});
test("job actions follow the work lifecycle", () => {
  assert.equal(canStartJob("accepted"), true);
  assert.equal(canStartJob("completed"), false);
  assert.equal(canSaveActualCosts("in_progress"), true);
  assert.equal(canSaveActualCosts("completed"), true);
  assert.equal(canSaveActualCosts("quoted"), false);
});
test("actual profit and margin use the accepted sale price and allow losses", () => {
  const regular = actualProfitSummary(82200, 57510, 61500);
  assert.equal(regular.actualProfit, 20700);
  assert.ok(Math.abs(regular.actualMargin - 25.18248175) < 0.001);
  assert.equal(regular.costVariance, 3990);
  assert.equal(regular.profitVariance, -3990);
  const loss = actualProfitSummary(82200, 57510, 90000);
  assert.equal(loss.actualProfit, -7800);
  assert.ok(loss.actualMargin < 0);
});
