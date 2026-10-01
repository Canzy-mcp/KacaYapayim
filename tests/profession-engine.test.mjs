import assert from "node:assert/strict";
import test from "node:test";
import { calculateProfessionJob, compileTemplate } from "../src/lib/professions/engine.ts";
import { parseExpression, evaluateExpression } from "../src/lib/professions/expression.ts";
import { builtInTemplates, painterTemplate, electricianTemplate, plumberTemplate, hvacTemplate } from "../src/lib/professions/templates.ts";
import { evaluateCondition, TemplateError } from "../src/lib/professions/schema.ts";

const costsFor = (template) => template.costs.map((item) => ({ id: item.key, key: item.key,
  name: item.name, category: item.category, unit: item.unit, unit_cost: item.defaultValue,
  template_id: item.key, is_active: true }));
const defaults = (template) => Object.fromEntries(template.fields.map((field) => [field.key, field.defaultValue ?? null]));

test("all built-in profession snapshots have valid dependency graphs", () => {
  for (const template of builtInTemplates) assert.ok(compileTemplate(template).length > 0);
});

test("generic painter engine retains the 57,510 TL regression result", () => {
  const fields = { ...defaults(painterTemplate), wall_area: 200, ceiling_area: 80, wall_coats: 2, ceiling_coats: 2,
    primer_required: true, primer_coats: 1, putty_required: false, days: 3, master_count: 2,
    helper_count: 1, include_consumables: true, include_transport: true, waste_percentage: 10 };
  const result = calculateProfessionJob({ template: painterTemplate, fieldValues: fields, businessCosts: costsFor(painterTemplate) });
  assert.equal(result.totalCost, 57510);
  assert.deepEqual(result.costBreakdown.map((line) => [line.key, line.quantity, line.total_cost]), [
    ["interior_paint", 44, 19800], ["primer", 22, 6600], ["ceiling_paint", 17.6, 6160],
    ["master_labor", 6, 18000], ["helper_labor", 3, 5400], ["consumables", 1, 750], ["transport", 1, 800],
  ]);
  assert.ok(result.quoteScope.some((item) => item.name === "1 kat astar uygulaması"));
});

test("generic painter rules retain area and optional primer validation", () => {
  assert.throws(() => calculateProfessionJob({ template: painterTemplate,
    fieldValues: defaults(painterTemplate), businessCosts: costsFor(painterTemplate) }),
  (error) => error instanceof TemplateError && error.code === "INVALID_INPUT" && error.key === "area_required");
  assert.throws(() => calculateProfessionJob({ template: painterTemplate,
    fieldValues: { ...defaults(painterTemplate), ceiling_area: 30, primer_required: true }, businessCosts: costsFor(painterTemplate) }),
  (error) => error instanceof TemplateError && error.key === "primer_wall_required");
});

test("electrician uses business cost overrides", () => {
  const fields = { ...defaults(electricianTemplate), socket_count: 10, cable_2_5_length: 100,
    days: 2, electrician_count: 1, include_consumables: false, include_transport: false };
  const base = calculateProfessionJob({ template: electricianTemplate, fieldValues: fields, businessCosts: costsFor(electricianTemplate) });
  const changed = calculateProfessionJob({ template: electricianTemplate, fieldValues: fields,
    businessCosts: costsFor(electricianTemplate).map((cost) => cost.key === "cable_2_5" ? { ...cost, unit_cost: 22 } : cost) });
  assert.equal(changed.totalCost - base.totalCost, 420);
  assert.equal(base.quoteScope[0].name, "Priz montajı");
});

test("plumber and HVAC templates calculate without occupation-specific engine code", () => {
  const plumber = calculateProfessionJob({ template: plumberTemplate, fieldValues: { ...defaults(plumberTemplate), pipe_length: 10 }, businessCosts: costsFor(plumberTemplate) });
  const hvac = calculateProfessionJob({ template: hvacTemplate, fieldValues: { ...defaults(hvacTemplate), pipe_length: 5, wall_holes: 1 }, businessCosts: costsFor(hvacTemplate) });
  assert.ok(plumber.totalCost > 0);
  assert.ok(hvac.totalCost > 0);
  assert.ok(hvac.quoteScope.some((item) => item.name === "Bakır boru bağlantısı"));
});

test("hidden required field is skipped; visible required field is enforced", () => {
  const template = structuredClone(hvacTemplate);
  template.fields.find((field) => field.key === "electrical_line_length").required = true;
  const hidden = calculateProfessionJob({ template, fieldValues: { ...defaults(template), electrical_line: false }, businessCosts: costsFor(template) });
  assert.ok(hidden.totalCost > 0);
  assert.throws(() => calculateProfessionJob({ template, fieldValues: { ...defaults(template), electrical_line: true, electrical_line_length: null }, businessCosts: costsFor(template) }),
    (error) => error instanceof TemplateError && error.code === "INVALID_INPUT");
});

test("missing cost and unknown field fail closed", () => {
  assert.throws(() => calculateProfessionJob({ template: electricianTemplate,
    fieldValues: { ...defaults(electricianTemplate), socket_count: 1 },
    businessCosts: costsFor(electricianTemplate).filter((cost) => cost.key !== "socket") }),
    (error) => error instanceof TemplateError && error.code === "MISSING_COST");
  assert.throws(() => calculateProfessionJob({ template: painterTemplate,
    fieldValues: { ...defaults(painterTemplate), injected: 1 }, businessCosts: costsFor(painterTemplate) }),
    (error) => error instanceof TemplateError && error.code === "INVALID_INPUT");
});

test("circular dependency and unknown reference block publishing", () => {
  const cyclic = structuredClone(electricianTemplate);
  cyclic.formulas = [{ key: "a", name: "A", formulaType: "quantity", expression: "result.b + 1", sortOrder: 1 },
    { key: "b", name: "B", formulaType: "quantity", expression: "result.a + 1", sortOrder: 2 }];
  assert.throws(() => compileTemplate(cyclic), (error) => error instanceof TemplateError && error.code === "CIRCULAR_FORMULA");
  cyclic.formulas[1].expression = "field.unknown + 1";
  assert.throws(() => compileTemplate(cyclic), (error) => error instanceof TemplateError && error.code === "UNKNOWN_REFERENCE");
});

test("expression parser rejects executable syntax and zero division", () => {
  assert.throws(() => parseExpression("process.exit(1)"), TemplateError);
  assert.throws(() => parseExpression("field.a; alert(1)"), TemplateError);
  const parsed = parseExpression("field.a / field.b");
  assert.throws(() => evaluateExpression(parsed.node, { field: { a: 2, b: 0 }, setting: {}, cost: {}, result: {} }),
    (error) => error instanceof TemplateError && error.code === "DIVISION_BY_ZERO");
  assert.equal(evaluateCondition({ field: "enabled", operator: "is_true" }, { enabled: true }), true);
});

test("saved template snapshots retain the previous calculation and quote scope", () => {
  const saved = structuredClone(electricianTemplate);
  const newer = structuredClone(saved);
  newer.version = 2;
  newer.quoteItems[0].name = "Yeni priz uygulaması";
  newer.formulas.find((item) => item.key === "socket_cost").quantityExpression = "field.socket_count * 2";
  newer.formulas.find((item) => item.key === "socket_cost").expression = "field.socket_count * 2 * cost.socket";
  const fields = { ...defaults(saved), socket_count: 2 };
  const oldResult = calculateProfessionJob({ template: saved, fieldValues: fields, businessCosts: costsFor(saved) });
  const newResult = calculateProfessionJob({ template: newer, fieldValues: fields, businessCosts: costsFor(newer) });
  assert.equal(saved.version, 1);
  assert.equal(newResult.totalCost - oldResult.totalCost, 500);
  assert.equal(oldResult.quoteScope[0].name, "Priz montajı");
  assert.equal(newResult.quoteScope[0].name, "Yeni priz uygulaması");
});

test("cost formulas must match their saved quantity and unit price", () => {
  const inconsistent = structuredClone(electricianTemplate);
  inconsistent.formulas.find((item) => item.key === "socket_cost").expression = "field.socket_count * cost.socket + 100";
  assert.throws(() => calculateProfessionJob({ template: inconsistent,
    fieldValues: { ...defaults(inconsistent), socket_count: 2 }, businessCosts: costsFor(inconsistent) }),
  (error) => error instanceof TemplateError && error.code === "COST_FORMULA_MISMATCH");
});
