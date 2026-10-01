import type { PainterJobDetail } from "../../types/database.ts";

export type ScopeDraft = { name: string; description: string };
export const paymentPresets = [
  { label: "%50 başlangıç / %50 teslimde", value: "%50 işe başlamadan önce, %50 iş tesliminde." },
  { label: "%30 başlangıç / %70 teslimde", value: "%30 işe başlamadan önce, %70 iş tesliminde." },
  { label: "Tamamı teslimde", value: "Tamamı iş tesliminde." },
  { label: "Peşin", value: "Tamamı işe başlamadan önce." },
] as const;

export const suggestedExclusions = [
  "Mobilya taşıma", "Elektrik ve tesisat onarımları", "Büyük yüzey tamiratları", "Özel iskele veya vinç işleri",
];

export function suggestedPainterScope(details: Pick<PainterJobDetail,
  "wall_area" | "ceiling_area" | "wall_coats" | "ceiling_coats" | "primer_required" | "primer_coats" | "putty_required" | "master_count" | "helper_count" | "include_consumables">): ScopeDraft[] {
  const items: ScopeDraft[] = [];
  if (details.wall_area > 0) items.push({ name: "Duvar yüzey hazırlığı", description: "Uygulama öncesi temel yüzey hazırlığı." });
  if (details.putty_required) items.push({ name: "Gerekli alanlarda macun uygulaması", description: "" });
  if (details.primer_required) items.push({ name: `${details.primer_coats} kat astar uygulaması`, description: "" });
  if (details.wall_area > 0) items.push({ name: `${details.wall_coats} kat iç cephe boya uygulaması`, description: "" });
  if (details.ceiling_area > 0) items.push({ name: `${details.ceiling_coats} kat tavan boyası`, description: "" });
  if (details.master_count + details.helper_count > 0) items.push({ name: "İşçilik", description: "" });
  if (details.include_consumables) items.push({ name: "Temel sarf malzemeleri", description: "" });
  return items;
}

export function todayInIstanbul(now = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
export function dateInIstanbul(timestamp: string) { return todayInIstanbul(new Date(timestamp)); }

export function addDaysToDateKey(dateKey: string, days: number) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || !Number.isInteger(days)) throw new Error("Geçersiz tarih.");
  const date = new Date(`${dateKey}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) throw new Error("Geçersiz tarih.");
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function formatQuoteDate(dateKey: string) {
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${dateKey}T12:00:00Z`));
}
