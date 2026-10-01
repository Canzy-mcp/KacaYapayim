import test from "node:test";
import assert from "node:assert/strict";
import { calculatePainterJobCost, PainterCalculationError } from "../src/lib/jobs/painter-calculation.ts";

const definitions = [
  ["interior_paint", "material", "liter", 450], ["primer", "material", "liter", 300],
  ["ceiling_paint", "material", "liter", 350], ["putty", "material", "kilogram", 60],
  ["master_labor", "labor", "day", 3000], ["helper_labor", "labor", "day", 1800],
  ["consumables", "consumable", "fixed", 750], ["transport", "transport", "fixed", 800],
];
const costs = definitions.map(([key, category, unit, unit_cost]) => ({
  id: key, key, name: key, category, unit, unit_cost, template_id: key, is_active: true,
}));
const settings = { paint_coverage_per_liter: 10, primer_coverage_per_liter: 10,
  ceiling_paint_coverage_per_liter: 10, putty_kg_per_square_meter: 1, waste_percentage: 10 };
const work = { wall_area: 200, ceiling_area: 80, wall_coats: 2, ceiling_coats: 2,
  primer_required: true, primer_coats: 1, putty_required: false, putty_area: 0,
  days: 3, master_count: 2, helper_count: 1, include_consumables: true,
  include_transport: true, waste_percentage: 10, notes: "" };
const calculate = (overrides = {}) => calculatePainterJobCost({ work: { ...work, ...overrides }, settings, costs, extras: [] });

test("demo calculation totals 57.510 TL with a stable breakdown", () => {
  const result = calculate();
  assert.deepEqual(result.breakdown.map((line) => [line.cost_item_id, line.quantity, line.total_cost]), [
    ["interior_paint", 44, 19800], ["primer", 22, 6600], ["ceiling_paint", 17.6, 6160],
    ["master_labor", 6, 18000], ["helper_labor", 3, 5400], ["consumables", 1, 750], ["transport", 1, 800],
  ]);
  assert.equal(result.material_total, 32560);
  assert.equal(result.labor_total, 23400);
  assert.equal(result.other_total, 1550);
  assert.equal(result.grand_total, 57510);
});

test("coverage, waste and optional operations change only applicable lines", () => {
  const result = calculate({ wall_area: 100, ceiling_area: 0, wall_coats: 2,
    primer_required: false, waste_percentage: 10, master_count: 0, helper_count: 0 });
  assert.equal(result.breakdown.find((line) => line.cost_item_id === "interior_paint")?.quantity, 22);
  assert.equal(result.breakdown.some((line) => line.cost_item_id === "primer"), false);
  assert.equal(result.breakdown.some((line) => line.cost_item_id === "ceiling_paint"), false);
  assert.deepEqual(result.warnings, ["Bu iş için işçilik eklemedin."]);
  const noWaste = calculate({ wall_area: 100, ceiling_area: 0, wall_coats: 2, primer_required: false, waste_percentage: 0 });
  assert.equal(noWaste.breakdown.find((line) => line.cost_item_id === "interior_paint")?.quantity, 20);
});

test("putty and selected custom cost use their own quantities", () => {
  const custom = { id: "custom", key: "custom_protection", name: "Koruma Naylonu", category: "consumable",
    unit: "piece", unit_cost: 220, template_id: null, is_active: true };
  const result = calculatePainterJobCost({ work: { ...work, putty_required: true, putty_area: 20 }, settings,
    costs: [...costs, custom], extras: [{ cost_item_id: "custom", quantity: 3 }] });
  assert.equal(result.breakdown.find((line) => line.cost_item_id === "putty")?.quantity, 22);
  assert.equal(result.breakdown.find((line) => line.cost_item_id === "custom")?.total_cost, 660);
});

test("missing and inactive required costs cannot silently become zero", () => {
  assert.throws(() => calculatePainterJobCost({ work, settings, costs: costs.filter((cost) => cost.key !== "primer"), extras: [] }),
    (error) => error instanceof PainterCalculationError && error.code === "MISSING_COST");
  assert.throws(() => calculatePainterJobCost({ work, settings,
    costs: costs.map((cost) => cost.key === "primer" ? { ...cost, is_active: false } : cost), extras: [] }),
    (error) => error instanceof PainterCalculationError && error.code === "INACTIVE_COST");
});

test("calculated result is independent of later cost changes", () => {
  const prior = calculate();
  const current = calculatePainterJobCost({ work, settings,
    costs: costs.map((cost) => cost.key === "interior_paint" ? { ...cost, unit_cost: 550 } : cost), extras: [] });
  assert.equal(prior.grand_total, 57510);
  assert.equal(current.grand_total, 61910);
});

test("fractional unit prices retain kuruş precision", () => {
  const result = calculatePainterJobCost({
    work: { ...work, wall_area: 1, ceiling_area: 0, wall_coats: 1, primer_required: false,
      master_count: 0, helper_count: 0, include_consumables: false, include_transport: false, waste_percentage: 0 },
    settings,
    costs: costs.map((cost) => cost.key === "interior_paint" ? { ...cost, unit_cost: 475.50 } : cost),
    extras: [],
  });
  assert.equal(result.breakdown[0].quantity, 0.1);
  assert.equal(result.grand_total, 47.55);
});
