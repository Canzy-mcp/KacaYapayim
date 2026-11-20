import type { MetadataRoute } from "next";
import { professions, guides } from "@/lib/marketing/content";
import { calculators } from "@/lib/marketing/calculators";
import { guideDates, siteContentModified } from "@/lib/marketing/guides-data";
import { legalReady } from "@/lib/marketing/legal";
import { siteOrigin, isStaging } from "@/lib/marketing/seo";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 3600;

const PAGE_SIZE = 20;
const MAX_PROFILES = 2000;

// Published provider ids via the public directory function (granted to anon, so no service-role key is needed).
// The RPC caps offset at 2000 profiles, far below the 50,000 URL sitemap limit, so one sitemap.xml is enough.
// Past ~1000 profiles, move to generateSitemaps chunks and update the submitted sitemap URL (it becomes /sitemap/{id}.xml).
// The directory payload carries no updated_at, so profile URLs have no lastmod rather than a made-up one.
async function publishedProfileIds(): Promise<string[]> {
  const ids: string[] = [];
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return [];
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
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
    ...["/meslekler", "/hesaplama-araclari", "/rehber", "/fiyatlandirma", "/ozellikler", "/metodoloji", "/hakkimizda", "/nasil-calisir", "/ustalar-icin", "/guvenli-hizmet", "/yayin-politikasi"].map(p => entry(p, 0.7, "monthly")),
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
