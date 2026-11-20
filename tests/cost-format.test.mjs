import test from "node:test";
import assert from "node:assert/strict";
import { formatMoney, parseCostInput } from "../src/lib/costs/format.ts";

test("Turkish costs show grouped whole and fractional lira", () => {
  assert.equal(formatMoney(3000), "3.000 TL");
  assert.equal(formatMoney(1850.5), "1.850,50 TL");
});

test("cost input accepts plain decimals and accepts Turkish grouping and rejects negative or ambiguous input", () => {
  assert.equal(parseCostInput("3000"), 3000);
  assert.equal(parseCostInput("1850,50"), 1850.5);
  assert.equal(parseCostInput("0"), 0);
  assert.equal(parseCostInput("-1"), null);
  assert.equal(parseCostInput("1.000,50"), 1000.5);
  assert.equal(parseCostInput("1.234"), 1234);
  assert.equal(parseCostInput("1,234.5"), null);
});
