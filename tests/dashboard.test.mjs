import assert from "node:assert/strict";
import test from "node:test";
import { resolveDashboardRange } from "../src/lib/dashboard/range.ts";
import { deriveDashboardMetrics } from "../src/lib/dashboard/metrics.ts";

test("Istanbul dashboard periods use inclusive days and exclusive end", () => {
  assert.deepEqual(resolveDashboardRange({ period: "this_month" }, "2026-09-29"), {
    period: "this_month", label: "Bu Ay", startDate: "2026-09-01", endDate: "2026-09-29", endExclusive: "2026-09-30",
  });
  assert.equal(resolveDashboardRange({ period: "last_month" }, "2026-03-01").endDate, "2026-02-28");
  assert.equal(resolveDashboardRange({ period: "last_30" }, "2026-03-01").startDate, "2026-01-31");
  assert.equal(resolveDashboardRange({ period: "this_year" }, "2026-09-29").startDate, "2026-01-01");
  assert.equal(resolveDashboardRange({ period: "custom", start: "2026-08-30", end: "2026-09-02" }, "2026-09-29").endExclusive, "2026-09-03");
  assert.equal(resolveDashboardRange({ period: "custom", start: "2026-02-30", end: "2026-03-01" }, "2026-09-29").period, "this_month");
});

test("acceptance rate excludes pending; profit variance compares completed work", () => {
  const result = deriveDashboardMetrics({ decisions: { acceptedAmount: 0, acceptedCount: 7, rejectedCount: 3 },
    completed: { actualProfit: 44000, estimatedProfit: 50000, completedAmount: 0, count: 5 },
    active: { count: 5, volume: 0, expectedProfit: 0 } });
  assert.equal(result.acceptanceRate, 70);
  assert.equal(result.profitVariance, -6000);
  assert.equal(result.activeCount, 5);
  const empty = deriveDashboardMetrics({ decisions: { acceptedAmount: 0, acceptedCount: 0, rejectedCount: 0 },
    completed: { actualProfit: 0, estimatedProfit: 0, completedAmount: 0, count: 0 }, active: { count: 0, volume: 0, expectedProfit: 0 } });
  assert.equal(empty.acceptanceRate, null);
  assert.equal(empty.profitVariance, null);
});
