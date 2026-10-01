import type { CostCategory, CostUnit } from "@/types/database";

export const categoryOptions: { value: CostCategory; label: string }[] = [
  { value: "material", label: "Malzeme" },
  { value: "labor", label: "İşçilik" },
  { value: "consumable", label: "Sarf Malzemesi" },
  { value: "transport", label: "Ulaşım" },
  { value: "overhead", label: "Genel Gider" },
  { value: "other", label: "Diğer" },
];

export const unitOptions: { value: CostUnit; label: string; display: string }[] = [
  { value: "piece", label: "Adet", display: "Adet" },
  { value: "liter", label: "Litre", display: "Litre" },
  { value: "kilogram", label: "Kg", display: "Kg" },
  { value: "meter", label: "Metre", display: "Metre" },
  { value: "square_meter", label: "m²", display: "m²" },
  { value: "hour", label: "Saat", display: "Saat" },
  { value: "day", label: "Gün", display: "Gün" },
  { value: "kilometer", label: "Km", display: "Km" },
  { value: "fixed", label: "Sabit (iş başına)", display: "İş" },
  { value: "percent", label: "%", display: "%" },
];

export const costCategories = categoryOptions.map((option) => option.value);
export const costUnits = unitOptions.map((option) => option.value);
export const unitDisplay = (unit: CostUnit) => unitOptions.find((option) => option.value === unit)?.display || unit;

export const painterSettingsDefaults = {
  paint_coverage_per_liter: 10,
  primer_coverage_per_liter: 10,
  ceiling_paint_coverage_per_liter: 10,
  putty_kg_per_square_meter: 1,
  waste_percentage: 10,
};
export type PainterSettings = typeof painterSettingsDefaults;

export function readPainterSettings(settings: Record<string, unknown> | null): PainterSettings {
  const result = { ...painterSettingsDefaults };
  if (!settings) return result;
  for (const key of Object.keys(result) as (keyof PainterSettings)[]) {
    const value = settings[key];
    if (typeof value === "number" && Number.isFinite(value)) result[key] = value;
  }
  return result;
}
