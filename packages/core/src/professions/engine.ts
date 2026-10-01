import type { BusinessCostItem, CostCategory, CostUnit } from "../types/database.ts";
import { evaluateExpression, parseExpression, type ExpressionNode, type FormulaContext } from "./expression.ts";
import { evaluateCondition, generateQuoteScope, TemplateError, validateFieldValues,
  type FieldValues, type ProfessionFormula, type ProfessionTemplate } from "./schema.ts";

type CompiledFormula = { formula: ProfessionFormula; node: ExpressionNode; quantityNode?: ExpressionNode; references: Set<string> };
const keyPattern = /^[a-z][a-z0-9_]*$/;
const fieldTypes = new Set(["number","currency","text","textarea","select","multi_select","checkbox","toggle","date","integer","percentage","quantity"]);
const categories = new Set(["material","labor","transport","consumable","overhead","other"]);
const units = new Set(["piece","liter","kilogram","meter","square_meter","hour","day","kilometer","fixed","percent"]);
const formulaTypes = new Set(["quantity","cost","duration","derived_value","warning"]);
const conditionOperators = new Set(["equals","not_equals","greater_than","less_than","contains","is_true","is_false"]);
const cents = (value: number) => Math.round((value + Number.EPSILON) * 100);
const round4 = (value: number) => Math.round((value + Number.EPSILON) * 10000) / 10000;
export type GenericCostLine = { cost_item_id: string; key: string; name: string; category: CostCategory; unit: CostUnit;
  quantity: number; unit_cost: number; total_cost: number; source_type: "material" | "labor" | "fixed" | "extra";
  metadata: Record<string, string | number> };
export type ProfessionCalculation = { computedValues: Record<string, number>; costBreakdown: GenericCostLine[];
  warnings: string[]; totalCost: number; materialTotal: number; laborTotal: number; otherTotal: number;
  normalizedFields: FieldValues; quoteScope: Array<{ name: string; description: string }> };

function uniqueKeys(items: Array<{ key: string }>, label: string) {
  const seen = new Set<string>();
  for (const item of items) {
    if (!keyPattern.test(item.key) || seen.has(item.key)) throw new TemplateError("DUPLICATE_KEY", `${label} anahtarı geçersiz veya tekrar ediyor: ${item.key}`, item.key);
    seen.add(item.key);
  }
  return seen;
}

export function compileTemplate(template: ProfessionTemplate): CompiledFormula[] {
  if (!keyPattern.test(template.slug) || !Number.isInteger(template.version) || template.version < 1 ||
    template.fields.length > 100 || template.formulas.length > 100 || template.costs.length > 100 ||
    template.sections.length > 30 || template.quoteItems.length > 100) throw new TemplateError("TEMPLATE_SIZE", "Meslek şablonu geçersiz veya çok büyük.");
  const fields = uniqueKeys(template.fields, "Alan");
  const settings = uniqueKeys(template.settings, "Ayar");
  const costs = uniqueKeys(template.costs, "Maliyet");
  const results = uniqueKeys(template.formulas, "Formül");
  const sections = uniqueKeys(template.sections, "Bölüm");
  uniqueKeys(template.quoteItems, "Teklif satırı");
  if ((template.validations?.length || 0) > 50) throw new TemplateError("TEMPLATE_SIZE", "Çok fazla doğrulama kuralı var.");
  uniqueKeys(template.validations || [], "Doğrulama");
  const checkCondition = (condition: { field: string; operator: string } | undefined, key: string) => {
    if (condition && (!fields.has(condition.field) || !conditionOperators.has(condition.operator)))
      throw new TemplateError("INVALID_CONDITION", `${key} koşulu geçersiz.`, key);
  };
  for (const section of template.sections) if (!section.title?.trim() || section.title.length > 120)
    throw new TemplateError("INVALID_SECTION", "Bölüm başlığını kontrol et.", section.key);
  for (const field of template.fields) {
    if (!fieldTypes.has(field.fieldType) || !field.label?.trim() || field.label.length > 120 ||
      field.minValue !== undefined && !Number.isFinite(field.minValue) ||
      field.maxValue !== undefined && !Number.isFinite(field.maxValue) ||
      field.minValue !== undefined && field.maxValue !== undefined && field.minValue > field.maxValue)
      throw new TemplateError("INVALID_FIELD", `${field.key} alanı geçersiz.`, field.key);
    if (!sections.has(field.section)) throw new TemplateError("UNKNOWN_SECTION", `${field.label} için bölüm bulunamadı.`, field.key);
    checkCondition(field.visibilityCondition, field.key);
    if (["select", "multi_select"].includes(field.fieldType) && (!field.options?.length || field.options.length > 50))
      throw new TemplateError("INVALID_OPTIONS", `${field.label} seçeneklerini kontrol et.`, field.key);
    if (field.options && new Set(field.options.map((option) => option.value)).size !== field.options.length)
      throw new TemplateError("INVALID_OPTIONS", `${field.label} seçenekleri tekrarlanıyor.`, field.key);
  }
  for (const setting of template.settings) if (!setting.name?.trim() || !Number.isFinite(setting.defaultValue) ||
    setting.defaultValue < (setting.minValue ?? -1e9) || setting.defaultValue > (setting.maxValue ?? 1e9))
    throw new TemplateError("INVALID_SETTING", `${setting.key} ayarı geçersiz.`, setting.key);
  for (const cost of template.costs) if (!cost.name?.trim() || !categories.has(cost.category) || !units.has(cost.unit) ||
    !Number.isFinite(cost.defaultValue) || cost.defaultValue < 0 || cost.defaultValue > 1e9)
    throw new TemplateError("INVALID_COST", `${cost.key} maliyet kalemi geçersiz.`, cost.key);
  for (const rule of template.validations || []) {
    if (!rule.message?.trim() || typeof rule.expression !== "string") throw new TemplateError("INVALID_VALIDATION", "Doğrulama kuralı geçersiz.", rule.key);
    checkCondition(rule.condition, rule.key);
    const expression = parseExpression(rule.expression);
    for (const reference of expression.references) if (!reference.startsWith("field.") || !fields.has(reference.slice(6)))
      throw new TemplateError("UNKNOWN_REFERENCE", `${rule.key} doğrulamasında ${reference} bulunamadı.`, rule.key);
  }
  const compiled = template.formulas.map((formula) => {
    if (!formulaTypes.has(formula.formulaType) || !formula.name?.trim() || typeof formula.expression !== "string")
      throw new TemplateError("INVALID_FORMULA", `${formula.key} formülü geçersiz.`, formula.key);
    checkCondition(formula.condition, formula.key);
    if (formula.formulaType === "cost" && (!formula.costTemplateKey || !costs.has(formula.costTemplateKey)))
      throw new TemplateError("UNKNOWN_COST", `${formula.name} maliyet kalemi bulunamadı.`, formula.key);
    const expression = parseExpression(formula.expression);
    const quantity = formula.quantityExpression ? parseExpression(formula.quantityExpression) : undefined;
    const references = new Set([...expression.references, ...(quantity?.references || [])]);
    for (const reference of references) {
      const [namespace, key] = reference.split(".");
      const valid = namespace === "field" ? fields : namespace === "setting" ? settings : namespace === "cost" ? costs : results;
      if (!valid.has(key)) throw new TemplateError("UNKNOWN_REFERENCE", `${formula.name} formülünde ${reference} bulunamadı.`, formula.key);
    }
    return { formula, node: expression.node, quantityNode: quantity?.node, references };
  });
  for (const item of template.quoteItems) {
    checkCondition(item.condition, item.key);
    if (!item.name?.trim() || item.name.length > 160 || item.nameFieldSuffix && !fields.has(item.nameFieldSuffix))
      throw new TemplateError("UNKNOWN_FIELD", `${item.name} teklif satırında alan bulunamadı.`, item.key);
  }
  const byKey = new Map(compiled.map((item) => [item.formula.key, item]));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const order: CompiledFormula[] = [];
  function visit(key: string) {
    if (visiting.has(key)) throw new TemplateError("CIRCULAR_FORMULA", "Formüller arasında döngü var.", key);
    if (visited.has(key)) return;
    visiting.add(key);
    const item = byKey.get(key)!;
    for (const reference of item.references) if (reference.startsWith("result.")) visit(reference.slice(7));
    visiting.delete(key); visited.add(key); order.push(item);
  }
  for (const formula of [...template.formulas].sort((a, b) => a.sortOrder - b.sortOrder)) visit(formula.key);
  return order;
}

export function calculateProfessionJob(input: {
  template: ProfessionTemplate; fieldValues: FieldValues; businessCosts: BusinessCostItem[];
  businessSettings?: Record<string, number>; manualExtraCosts?: Array<{ costItemId: string; quantity: number }>;
}): ProfessionCalculation {
  const { template, businessCosts } = input;
  const compiled = compileTemplate(template);
  const { values, errors } = validateFieldValues(template, input.fieldValues);
  if (Object.keys(errors).length) throw new TemplateError("INVALID_INPUT", Object.values(errors)[0], Object.keys(errors)[0]);
  const context: FormulaContext = { field: {}, setting: {}, cost: {}, result: {} };
  for (const [key, value] of Object.entries(values)) if (typeof value === "number") context.field[key] = value;
  for (const rule of template.validations || []) if (evaluateCondition(rule.condition, values)) {
    if (evaluateExpression(parseExpression(rule.expression).node, context) <= 0)
      throw new TemplateError("INVALID_INPUT", rule.message, rule.key);
  }
  for (const setting of template.settings) {
    const value = input.businessSettings?.[setting.key] ?? setting.defaultValue;
    if (!Number.isFinite(value) || value < (setting.minValue ?? -1e9) || value > (setting.maxValue ?? 1e9))
      throw new TemplateError("INVALID_SETTING", `${setting.name} ayarını kontrol et.`, setting.key);
    context.setting[setting.key] = value;
  }
  const costByKey = new Map(businessCosts.map((cost) => [cost.key, cost]));
  const costById = new Map(businessCosts.map((cost) => [cost.id, cost]));
  const costLabels = new Map(template.costs.map((cost) => [cost.key, cost.name]));
  const lines: GenericCostLine[] = [];
  const warnings: string[] = [];
  for (const item of compiled) {
    const { formula } = item;
    if (!evaluateCondition(formula.condition, values)) { context.result[formula.key] = 0; continue; }
    for (const reference of item.references) if (reference.startsWith("cost.")) {
      const key = reference.slice(5);
      const cost = costByKey.get(key);
      if (!cost || !cost.is_active) throw new TemplateError("MISSING_COST", `${costLabels.get(key) || key} maliyetin tanımlı değil.`, key);
      if (!Number.isFinite(cost.unit_cost) || cost.unit_cost < 0 || cost.unit_cost > 1e9)
        throw new TemplateError("INVALID_COST", `${cost.name} fiyatını kontrol et.`, key);
      context.cost[key] = cost.unit_cost;
    }
    const value = evaluateExpression(item.node, context);
    context.result[formula.key] = value;
    if (formula.formulaType === "warning") { if (value > 0) warnings.push(formula.name); continue; }
    if (formula.formulaType !== "cost") continue;
    if (value < 0) throw new TemplateError("NEGATIVE_COST", `${formula.name} negatif maliyet oluşturdu.`, formula.key);
    const key = formula.costTemplateKey!;
    const cost = costByKey.get(key);
    if (!cost || !cost.is_active) throw new TemplateError("MISSING_COST", `${costLabels.get(key) || key} maliyetin tanımlı değil.`, key);
    const templateCost = template.costs.find((item) => item.key === key)!;
    if (cost.unit !== templateCost.unit) throw new TemplateError("INVALID_UNIT", `${cost.name} birimini kontrol et.`, key);
    const quantity = item.quantityNode ? evaluateExpression(item.quantityNode, context) :
      cost.unit_cost > 0 ? value / cost.unit_cost : 0;
    if (quantity < 0 || quantity > 1e9) throw new TemplateError("INVALID_QUANTITY", `${formula.name} miktarını kontrol et.`, formula.key);
    const preciseQuantity = round4(quantity);
    const lineCost = Math.round(preciseQuantity * cents(cost.unit_cost)) / 100;
    if (Math.abs(lineCost - value) > 0.011) throw new TemplateError("COST_FORMULA_MISMATCH", `${formula.name} tutarı ile miktarı uyuşmuyor.`, formula.key);
    if (preciseQuantity === 0) continue;
    lines.push({ cost_item_id: cost.id, key, name: cost.name, category: cost.category, unit: cost.unit,
      quantity: preciseQuantity, unit_cost: cost.unit_cost,
      total_cost: lineCost,
      source_type: cost.category === "material" ? "material" : cost.category === "labor" ? "labor" : "fixed",
      metadata: { formula_key: formula.key } });
  }
  const extras = input.manualExtraCosts ?? [];
  if (extras.length > 20 || new Set(extras.map((extra) => extra.costItemId)).size !== extras.length)
    throw new TemplateError("INVALID_EXTRAS", "Ek maliyetleri kontrol et.");
  for (const extra of extras) {
    const cost = costById.get(extra.costItemId);
    if (!cost || !cost.is_active || cost.template_id !== null) throw new TemplateError("MISSING_EXTRA_COST", "Ek maliyet bulunamadı.");
    if (!Number.isFinite(extra.quantity) || extra.quantity <= 0 || extra.quantity > 1e5 ||
      !Number.isFinite(cost.unit_cost) || cost.unit_cost < 0) throw new TemplateError("INVALID_EXTRAS", "Ek maliyet miktarını kontrol et.");
    const quantity = round4(extra.quantity);
    lines.push({ cost_item_id: cost.id, key: cost.key, name: cost.name, category: cost.category, unit: cost.unit,
      quantity, unit_cost: cost.unit_cost, total_cost: Math.round(quantity * cents(cost.unit_cost)) / 100,
      source_type: "extra", metadata: {} });
  }
  const sum = (type: GenericCostLine["source_type"]) => lines.filter((line) => line.source_type === type).reduce((total, line) => total + cents(line.total_cost), 0);
  const material = sum("material"), labor = sum("labor"), other = sum("fixed") + sum("extra");
  const total = material + labor + other;
  if (total > 1e14) throw new TemplateError("COST_TOO_LARGE", "Toplam maliyet çok büyük.");
  return { computedValues: context.result, costBreakdown: lines, warnings,
    totalCost: total / 100, materialTotal: material / 100, laborTotal: labor / 100, otherTotal: other / 100,
    normalizedFields: values, quoteScope: generateQuoteScope(template, values) };
}
