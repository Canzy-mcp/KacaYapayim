// Pure helpers: query-string handling for the directory, compare page and request form prefill.
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const slug = /^[a-z0-9-]{1,80}$/;

export const filterKeys = ["category", "city", "district", "q"] as const;
export type DirectoryFilters = Record<(typeof filterKeys)[number], string>;
export const maxCompare = 3;

export function cleanText(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return Array.from(value.replace(/\s+/g, " ").trim()).slice(0, max).join("");
}

export function parseCompareIds(value: unknown) {
  const raw = typeof value === "string" ? value.split(",") : [];
  return [...new Set(raw.map((item) => item.trim().toLowerCase()).filter((item) => uuid.test(item)))].slice(0, maxCompare);
}

export function directoryHref(filters: Partial<DirectoryFilters>, extra: { page?: number; compare?: string[] } = {}) {
  const query = new URLSearchParams();
  for (const key of filterKeys) if (filters[key]) query.set(key, filters[key]!);
  if (extra.compare?.length) query.set("compare", extra.compare.join(","));
  if (extra.page && extra.page > 1) query.set("page", String(extra.page));
  return query.size ? `/usta-bul?${query}` : "/usta-bul";
}

export type RequestPrefill = { category: string; city: string; district: string };

export function requestHref(values: Partial<RequestPrefill> & { usta?: string }) {
  const query = new URLSearchParams();
  for (const key of ["usta", "category", "city", "district"] as const) if (values[key]) query.set(key, values[key]!);
  return query.size ? `/talepler/yeni?${query}` : "/talepler/yeni";
}

export function parseRequestPrefill(params: Record<string, string | string[] | undefined>, categorySlugs: string[]): RequestPrefill {
  const category = typeof params.category === "string" && slug.test(params.category) && categorySlugs.includes(params.category) ? params.category : "";
  return { category, city: cleanText(params.city, 80), district: cleanText(params.district, 80) };
}

export const briefTemplates = [
  { id: "boya", label: "Boya badana", title: "Boya badana", text: "Boyanacak alan: (oda sayısı ve yaklaşık m²)\nMevcut durum: (eski boya, rutubet, çatlak, alçı ihtiyacı)\nMalzeme kimden: (boya ve malzemeyi usta mı getirsin, ben mi alayım)\nTercih edilen zaman: (hangi hafta, eşyalar boşaltılacak mı)" },
  { id: "elektrik", label: "Elektrik arızası", title: "Elektrik arızası", text: "Sorun: (hangi priz, sigorta veya aydınlatma çalışmıyor)\nMevcut durum: (ne zaman başladı, sigorta atıyor mu, koku veya kıvılcım var mı)\nMalzeme kimden: (parça gerekirse usta mı getirsin)\nTercih edilen zaman: (acil mi, hangi gün ve saat uygun)" },
  { id: "su", label: "Su tesisatı: kaçak veya tıkanıklık", title: "Su tesisatı", text: "Sorun: (kaçak mı tıkanıklık mı, hangi mekanda)\nMevcut durum: (ne zamandır var, ana vana kapatıldı mı)\nMalzeme kimden: (batarya, sifon, boru gibi parçaları kim alacak)\nTercih edilen zaman: (acil mi, hangi gün ve saat uygun)" },
  { id: "klima", label: "Klima bakım", title: "Klima bakımı", text: "Cihaz: (marka, kaç adet, iç ve dış ünite nerede)\nMevcut durum: (son bakım zamanı, soğutma veya su akıtma sorunu var mı)\nMalzeme kimden: (filtre veya gaz gerekirse usta mı getirsin)\nTercih edilen zaman: (hangi gün ve saat uygun, dış üniteye erişim nasıl)" },
] as const;

export const requestStages = [
  { state: "open", label: "Açık" },
  { state: "awarded", label: "Usta seçildi" },
  { state: "in_progress", label: "İşte" },
  { state: "awaiting_completion", label: "Onay bekliyor" },
  { state: "completed", label: "Tamamlandı" },
] as const;

export function trimDescription(text: string, max = 155) {
  const flat = text.replace(/\s+/g, " ").trim();
  if (Array.from(flat).length <= max) return flat;
  return Array.from(flat).slice(0, max - 1).join("").replace(/\s+\S*$/, "") + "…";
}

export function parseDirectoryFilters(params: Record<string, string | string[] | undefined>): DirectoryFilters {
  return Object.fromEntries(filterKeys.map((key) => [key, cleanText(params[key], key === "q" ? 100 : 80)])) as DirectoryFilters;
}

// Compare link keeps the directory filters and page so "back" returns to the same list.
export function compareHref(ids: string[], filters: Partial<DirectoryFilters> = {}, page = 1) {
  const query = new URLSearchParams({ ids: ids.join(",") });
  for (const key of filterKeys) if (filters[key]) query.set(key, filters[key]!);
  if (page > 1) query.set("page", String(page));
  return `/usta-bul/karsilastir?${query}`;
}
