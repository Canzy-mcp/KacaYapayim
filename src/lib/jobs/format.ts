const quantityFormatter = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 4 });
export function formatQuantity(value: number) { return quantityFormatter.format(value); }
