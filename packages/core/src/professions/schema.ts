export type FieldType = "number" | "currency" | "text" | "textarea" | "select" | "multi_select" | "checkbox" | "toggle" | "date" | "integer" | "percentage" | "quantity";
export type FieldValue = string | number | boolean | string[] | null;
export type FieldValues = Record<string, FieldValue>;
export type ConditionOperator = "equals" | "not_equals" | "greater_than" | "less_than" | "contains" | "is_true" | "is_false";
export type Condition = { field: string; operator: ConditionOperator; value?: FieldValue };
export type ProfessionSection = { key: string; title: string; description?: string; sortOrder: number };
export type ProfessionField = {
  key: string; label: string; description?: string; fieldType: FieldType; unit?: string;
  placeholder?: string; defaultValue?: FieldValue; required?: boolean; minValue?: number;
  maxValue?: number; step?: number; options?: Array<{ value: string; label: string }>;
  visibilityCondition?: Condition; section: string; sortOrder: number;
};
export type ProfessionSetting = { key: string; name: string; defaultValue: number; minValue?: number; maxValue?: number; unit?: string };
export type ProfessionCost = { key: string; name: string; category: "material" | "labor" | "transport" | "consumable" | "overhead" | "other";
  unit: "piece" | "liter" | "kilogram" | "meter" | "square_meter" | "hour" | "day" | "kilometer" | "fixed" | "percent";
  defaultValue: number; required?: boolean; sortOrder: number };
export type FormulaType = "quantity" | "cost" | "duration" | "derived_value" | "warning";
export type ProfessionFormula = { key: string; name: string; expression: string; formulaType: FormulaType;
  costTemplateKey?: string; quantityExpression?: string; condition?: Condition; sortOrder: number };
export type QuoteTemplateItem = { key: string; name: string; description?: string; condition?: Condition;
  nameFieldSuffix?: string; sortOrder: number };
export type ProfessionValidation = { key: string; message: string; expression: string; condition?: Condition };
export type ProfessionTemplate = {
  slug: string; name: string; description: string; icon: string; category: string;
  version: number; sections: ProfessionSection[]; fields: ProfessionField[];
  settings: ProfessionSetting[]; costs: ProfessionCost[]; formulas: ProfessionFormula[];
  quoteItems: QuoteTemplateItem[]; quoteExclusions: string[]; validations?: ProfessionValidation[];
};

export class TemplateError extends Error {
  code: string;
  key?: string;
  constructor(code: string, message: string, key?: string) { super(message); this.name = "TemplateError"; this.code = code; this.key = key; }
}

export function evaluateCondition(condition: Condition | undefined, values: FieldValues): boolean {
  if (!condition) return true;
  const actual = values[condition.field];
  switch (condition.operator) {
    case "equals": return actual === condition.value;
    case "not_equals": return actual !== condition.value;
    case "greater_than": return typeof actual === "number" && typeof condition.value === "number" && actual > condition.value;
    case "less_than": return typeof actual === "number" && typeof condition.value === "number" && actual < condition.value;
    case "contains": return Array.isArray(actual) && typeof condition.value === "string" && actual.includes(condition.value);
    case "is_true": return actual === true;
    case "is_false": return actual === false;
  }
}

export function validateFieldValues(template: ProfessionTemplate, raw: FieldValues): { values: FieldValues; errors: Record<string, string> } {
  const values: FieldValues = {};
  const errors: Record<string, string> = {};
  const keys = new Set(template.fields.map((field) => field.key));
  if (template.fields.length > 100 || Object.keys(raw).length > 120 || JSON.stringify(raw).length > 32000)
    throw new TemplateError("INPUT_TOO_LARGE", "İş formunda çok fazla veri var.");
  for (const field of template.fields) {
    const value = Object.prototype.hasOwnProperty.call(raw, field.key) ? raw[field.key] : field.defaultValue ?? null;
    if (value !== null && typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean" &&
      !(Array.isArray(value) && value.every((item) => typeof item === "string"))) {
      errors[field.key] = "Bu alanın değeri geçersiz."; continue;
    }
    values[field.key] = value;
  }
  for (const field of template.fields) {
    if (!evaluateCondition(field.visibilityCondition, values)) { values[field.key] = null; continue; }
    const value = values[field.key];
    if (field.required && (value === null || value === "" || Array.isArray(value) && value.length === 0)) {
      errors[field.key] = `${field.label} alanını doldur.`; continue;
    }
    if (value === null || value === "") continue;
    const numeric = ["number", "currency", "integer", "percentage", "quantity"].includes(field.fieldType);
    if (numeric) {
      if (typeof value !== "number" || !Number.isFinite(value) || Math.abs(value) > 1e9 ||
        field.fieldType === "integer" && !Number.isInteger(value) ||
        field.minValue !== undefined && value < field.minValue ||
        field.maxValue !== undefined && value > field.maxValue ||
        field.fieldType === "percentage" && (value < 0 || value > 100)) errors[field.key] = `${field.label} için geçerli bir sayı gir.`;
      continue;
    }
    if (["checkbox", "toggle"].includes(field.fieldType)) {
      if (typeof value !== "boolean") errors[field.key] = `${field.label} seçimini kontrol et.`;
    } else if (field.fieldType === "multi_select") {
      if (!Array.isArray(value) || value.length > 20 || value.some((part) => !field.options?.some((option) => option.value === part))) errors[field.key] = `${field.label} seçimini kontrol et.`;
    } else if (field.fieldType === "select") {
      if (typeof value !== "string" || !field.options?.some((option) => option.value === value)) errors[field.key] = `${field.label} seçimini kontrol et.`;
    } else if (field.fieldType === "date") {
      if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(new Date(`${value}T12:00:00Z`).getTime())) errors[field.key] = "Geçerli bir tarih gir.";
    } else if (typeof value !== "string" || value.length > (field.fieldType === "textarea" ? 2000 : 300)) errors[field.key] = `${field.label} metnini kontrol et.`;
  }
  for (const key of Object.keys(raw)) if (!keys.has(key)) errors[key] = "Bilinmeyen alan.";
  return { values, errors };
}

export function generateQuoteScope(template: ProfessionTemplate, values: FieldValues) {
  return template.quoteItems.filter((item) => evaluateCondition(item.condition, values))
    .sort((a, b) => a.sortOrder - b.sortOrder).map((item) => ({
      name: item.nameFieldSuffix && typeof values[item.nameFieldSuffix] === "number"
        ? `${values[item.nameFieldSuffix]} ${item.name}` : item.name,
      description: item.description ?? "",
    }));
}
