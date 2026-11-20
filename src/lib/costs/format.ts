import { parsePrice } from "../money.ts";

const integer = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatMoney(value: number) {
  return `${Number.isInteger(value) ? integer.format(value) : decimal.format(value)} TL`;
}

const percent = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export function formatPercent(value: number | null) {
  return value === null ? "—" : `%${percent.format(value)}`;
}

export function parseCostInput(value: string) {
  const amount = parsePrice(value);
  return amount !== null && amount <= 999999999999.99 ? amount : null;
}
