export const money = (value: number | null | undefined) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(value || 0);
export const date = (value: string | null | undefined) => value
  ? new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value)) : "—";
export const numberFromInput = (value: string) => Number(value.replace(/\s/g, "").replace(",", "."));
export const errorText = (error: unknown) => error instanceof Error ? error.message : "İşlem tamamlanamadı. Tekrar dene.";
