import type { MetadataRoute } from "next";
import { professions, guides } from "@/lib/marketing/content";
import { calculators } from "@/lib/marketing/calculators";
import { guideDates, siteContentModified } from "@/lib/marketing/guides-data";
import { legalReady } from "@/lib/marketing/legal";
import { siteOrigin, isStaging } from "@/lib/marketing/seo";
import { createServiceClient } from "@/lib/supabase/admin";

export const revalidate = 3600;

const PAGE_SIZE = 20;
const MAX_PROFILES = 2000;

// Published provider ids via the public directory function. A failure here must never break the sitemap.
async function publishedProfileIds(): Promise<string[]> {
  const ids: string[] = [];
  try {
    const client = createServiceClient();
    for (let page = 1; ids.length < MAX_PROFILES && page <= 101; page++) {
      const { data, error } = await client.rpc("market_directory", { p_filters: { page: String(page) } });
      if (error || !data) break;
      const providers = ((data as { providers?: { id?: string }[] }).providers ?? []);
      for (const p of providers.slice(0, PAGE_SIZE)) if (p.id) ids.push(p.id);
      if (providers.length < PAGE_SIZE + 1) break;
    }
  } catch { /* sitemap stays available without profiles */ }
  return ids.slice(0, MAX_PROFILES);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (isStaging) return [];
  const site = new Date(`${siteContentModified}T00:00:00+03:00`);
  const entry = (path: string, priority: number, changeFrequency: "weekly" | "monthly", lastModified: Date = site) => ({ url: `${siteOrigin}${path}`, lastModified, changeFrequency, priority });
  const entries: MetadataRoute.Sitemap = [
    entry("/", 1, "weekly"), entry("/usta-bul", 0.9, "weekly"),
    ...["/meslekler", "/hesaplama-araclari", "/rehber", "/fiyatlandirma", "/ozellikler", "/metodoloji", "/hakkimizda"].map(p => entry(p, 0.7, "monthly")),
    ...professions.map(p => entry(`/meslekler/${p.slug}`, 0.8, "monthly")),
    ...calculators.map(c => entry(`/hesaplama-araclari/${c.slug}`, c.slug === "kar-marji" ? 0.9 : 0.8, "monthly")),
    ...guides.map(g => entry(`/rehber/${g.slug}`, 0.7, "monthly", new Date(`${guideDates[g.slug].modified}T00:00:00+03:00`))),
  ];
  if (legalReady) {
    entries.push(entry("/iletisim", 0.4, "monthly"));
    for (const id of await publishedProfileIds()) entries.push({ url: `${siteOrigin}/usta-bul/${id}`, changeFrequency: "weekly", priority: 0.6 });
  }
  return entries;
}
