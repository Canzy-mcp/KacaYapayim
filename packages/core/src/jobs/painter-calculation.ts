import type { BusinessCostItem, CostCategory, CostUnit } from "../types/database.ts";

export type PainterWorkInput = {
  wall_area: number; ceiling_area: number; wall_coats: number; ceiling_coats: number;
  primer_required: boolean; primer_coats: number; putty_required: boolean; putty_area: number;
  days: number; master_count: number; helper_count: number;
  include_consumables: boolean; include_transport: boolean; waste_percentage: number;
  notes: string;
};
export type PainterTechnicalSettings = {
  paint_coverage_per_liter: number; primer_coverage_per_liter: number;
  ceiling_paint_coverage_per_liter: number; putty_kg_per_square_meter: number;
  waste_percentage: number;
};
export type ExtraCostSelection = { cost_item_id: string; quantity: number };
export type CalculationLine = {
  cost_item_id: string; name: string; category: CostCategory; unit: CostUnit;
  quantity: number; unit_cost: number; total_cost: number;
  source_type: "material" | "labor" | "fixed" | "extra";
  metadata: Record<string, number>;
};
export type PainterCalculation = {
  breakdown: CalculationLine[]; material_total: number; labor_total: number;
  other_total: number; grand_total: number; warnings: string[];
};
export class PainterCalculationError extends Error {
  code: string;
  field?: string;
  constructor(code: string, message: string, field?: string) { super(message); this.code = code; this.field = field; }
}

const requiredUnits: Record<string, CostUnit> = {
  interior_paint: "liter", primer: "liter", ceiling_paint: "liter", putty: "kilogram",
  master_labor: "day", helper_labor: "day", consumables: "fixed", transport: "fixed",
};
const names: Record<string, string> = {
  interior_paint: "İç cephe boyası", primer: "Astar", ceiling_paint: "Tavan boyası", putty: "Macun",
  master_labor: "Usta", helper_labor: "Yardımcı", consumables: "Sarf malzemeleri", transport: "Yol / araç",
};
const round4 = (value: number) => Math.round((value + Number.EPSILON) * 10000) / 10000;
const cents = (value: number) => Math.round((value + Number.EPSILON) * 100);
const amount = (value: number) => value / 100;

export function validatePainterWork(input: PainterWorkInput): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of ["wall_area", "ceiling_area", "putty_area"] as const) {
    if (!Number.isFinite(input[field]) || input[field] < 0 || input[field] > 100000 || Math.abs(Math.round(input[field] * 100) - input[field] * 100) > 1e-6)
      errors[field] = "0–100.000 arasında, en fazla iki ondalıklı bir alan gir.";
  }
  if (!errors.wall_area && !errors.ceiling_area && input.wall_area === 0 && input.ceiling_area === 0)
    errors.wall_area = "Duvar veya tavan alanından en az birini gir.";
  for (const field of ["wall_coats", "ceiling_coats", "primer_coats"] as const) {
    if (!Number.isInteger(input[field]) || input[field] < 1 || input[field] > 10) errors[field] = "1–10 arasında kat sayısı seç.";
  }
  if (input.primer_required && input.wall_area === 0) errors.primer_required = "Astar için duvar alanı gir.";
  if (input.putty_required && (input.wall_area === 0 || input.putty_area <= 0)) errors.putty_area = "Macun uygulanacak alanı gir.";
  if (!Number.isFinite(input.days) || input.days <= 0 || input.days > 365 || Math.abs(Math.round(input.days * 100) - input.days * 100) > 1e-6)
    errors.days = "İş süresini 0'dan büyük, en fazla 365 gün olarak gir.";
  for (const field of ["master_count", "helper_count"] as const) {
    if (!Number.isInteger(input[field]) || input[field] < 0 || input[field] > 100) errors[field] = "0–100 arasında kişi sayısı gir.";
  }
  if (!Number.isFinite(input.waste_percentage) || input.waste_percentage < 0 || input.waste_percentage > 100 ||
      Math.abs(Math.round(input.waste_percentage * 100) - input.waste_percentage * 100) > 1e-6)
    errors.waste_percentage = "Fire payı 0–100 arasında olmalı.";
  if (typeof input.notes !== "string" || input.notes.length > 2000) errors.notes = "Notlar en fazla 2.000 karakter olabilir.";
  return errors;
}

export function calculatePainterJobCost(input: {
  work: PainterWorkInput; settings: PainterTechnicalSettings;
  costs: BusinessCostItem[]; extras: ExtraCostSelection[];
}): PainterCalculation {
  const { work, settings, costs, extras } = input;
  const errors = validatePainterWork(work);
  if (Object.keys(errors).length) throw new PainterCalculationError("INVALID_WORK", Object.values(errors)[0], Object.keys(errors)[0]);
  for (const key of ["paint_coverage_per_liter", "primer_coverage_per_liter", "ceiling_paint_coverage_per_liter", "putty_kg_per_square_meter"] as const) {
    if (!Number.isFinite(settings[key]) || settings[key] <= 0 || settings[key] > 1000)
      throw new PainterCalculationError("INVALID_SETTINGS", "İş ayarlarını Maliyetlerim sayfasında kontrol et.");
  }
  if (extras.length > 20 || new Set(extras.map((extra) => extra.cost_item_id)).size !== extras.length)
    throw new PainterCalculationError("INVALID_EXTRAS", "Ek maliyetleri kontrol et.");
  const byKey = new Map(costs.map((cost) => [cost.key, cost]));
  const byId = new Map(costs.map((cost) => [cost.id, cost]));
  const breakdown: CalculationLine[] = [];
  const wasteFactor = 1 + work.waste_percentage / 100;
  function add(cost: BusinessCostItem | undefined, key: string, quantity: number, source_type: CalculationLine["source_type"], metadata: Record<string, number> = {}) {
    if (quantity <= 0) return;
    const label = names[key] || cost?.name || "Ek maliyet";
    if (!cost) throw new PainterCalculationError("MISSING_COST", `${label} maliyetin tanımlı değil.`, key);
    if (!cost.is_active) throw new PainterCalculationError("INACTIVE_COST", `${label} maliyetin pasif durumda.`, key);
    if (requiredUnits[key] && cost.unit !== requiredUnits[key])
      throw new PainterCalculationError("INVALID_UNIT", `${label} birimini Maliyetlerim sayfasında kontrol et.`, key);
    if (!Number.isFinite(cost.unit_cost) || cost.unit_cost < 0)
      throw new PainterCalculationError("INVALID_COST", `${label} fiyatını Maliyetlerim sayfasında kontrol et.`, key);
    const preciseQuantity = round4(quantity);
    breakdown.push({ cost_item_id: cost.id, name: cost.name, category: cost.category, unit: cost.unit,
      quantity: preciseQuantity, unit_cost: cost.unit_cost, total_cost: amount(Math.round(preciseQuantity * cents(cost.unit_cost))), source_type, metadata });
  }
  add(byKey.get("interior_paint"), "interior_paint", work.wall_area * work.wall_coats / settings.paint_coverage_per_liter * wasteFactor, "material");
  if (work.primer_required) add(byKey.get("primer"), "primer", work.wall_area * work.primer_coats / settings.primer_coverage_per_liter * wasteFactor, "material");
  add(byKey.get("ceiling_paint"), "ceiling_paint", work.ceiling_area * work.ceiling_coats / settings.ceiling_paint_coverage_per_liter * wasteFactor, "material");
  if (work.putty_required) add(byKey.get("putty"), "putty", work.putty_area * settings.putty_kg_per_square_meter * wasteFactor, "material");
  add(byKey.get("master_labor"), "master_labor", work.master_count * work.days, "labor", { worker_count: work.master_count, days: work.days });
  add(byKey.get("helper_labor"), "helper_labor", work.helper_count * work.days, "labor", { worker_count: work.helper_count, days: work.days });
  if (work.include_consumables) add(byKey.get("consumables"), "consumables", 1, "fixed");
  if (work.include_transport) add(byKey.get("transport"), "transport", 1, "fixed");
  for (const extra of extras) {
    if (!Number.isFinite(extra.quantity) || extra.quantity <= 0 || extra.quantity > 100000 || round4(extra.quantity) !== extra.quantity)
      throw new PainterCalculationError("INVALID_EXTRAS", "Ek maliyet miktarını kontrol et.");
    const cost = byId.get(extra.cost_item_id);
    if (!cost || cost.template_id !== null) throw new PainterCalculationError("MISSING_EXTRA_COST", "Seçtiğin ek maliyet bulunamadı.");
    add(cost, cost.key, extra.quantity, "extra");
  }
  const sum = (type: CalculationLine["source_type"]) => breakdown.filter((line) => line.source_type === type).reduce((total, line) => total + cents(line.total_cost), 0);
  const material = sum("material"), labor = sum("labor"), other = sum("fixed") + sum("extra");
  return { breakdown, material_total: amount(material), labor_total: amount(labor), other_total: amount(other),
    grand_total: amount(material + labor + other), warnings: work.master_count === 0 && work.helper_count === 0 ? ["Bu iş için işçilik eklemedin."] : [] };
}
