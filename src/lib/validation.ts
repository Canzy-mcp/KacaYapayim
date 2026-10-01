export type FieldErrors = Record<string, string>;

export function emailError(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? "" : "Geçerli bir e-posta adresi gir.";
}

export function passwordError(value: string) {
  return value.length >= 8 ? "" : "Şifren en az 8 karakter olmalı.";
}

export function marginErrors(target: number, minimum: number): FieldErrors {
  const errors: FieldErrors = {};
  if (!Number.isFinite(target) || target < 0 || target > 90) errors.target = "Hedef marj 0–90 arasında olmalı.";
  if (!Number.isFinite(minimum) || minimum < 0 || minimum > 90) errors.minimum = "Minimum marj 0–90 arasında olmalı.";
  if (!errors.target && !errors.minimum && minimum > target) errors.minimum = "Minimum marj hedef marjdan büyük olamaz.";
  return errors;
}

export function parseMargin(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() !== "" ? Number(value) : Number.NaN;
}

export function cleanText(value: FormDataEntryValue | null, max = 120) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
