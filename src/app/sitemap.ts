import type { MetadataRoute } from "next";
import { professions, guides, contentUpdatedAt } from "@/lib/marketing/content";
import { calculators } from "@/lib/marketing/calculators";
import { siteOrigin, isStaging } from "@/lib/marketing/seo";
export default function sitemap(): MetadataRoute.Sitemap {
 if(isStaging)return [];
 const paths=["/","/ozellikler","/meslekler","/fiyatlandirma","/hesaplama-araclari","/rehber","/metodoloji","/hakkimizda",...professions.map(p=>`/meslekler/${p.slug}`),...guides.map(g=>`/rehber/${g.slug}`),...calculators.map(c=>`/hesaplama-araclari/${c.slug}`)];
 return paths.map(path=>({url:`${siteOrigin}${path}`,changeFrequency:path==="/"?"weekly":"monthly",priority:path==="/"?1:.7,...(path.startsWith("/rehber/")?{lastModified:new Date(`${contentUpdatedAt}T00:00:00+03:00`)}:{})}));
}
