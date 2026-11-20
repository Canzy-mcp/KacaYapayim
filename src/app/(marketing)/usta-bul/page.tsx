import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ClipboardList, MapPin, Search, X } from "lucide-react";
import { CategoryOptions, chip, CompareTray, input, linkButton, MarketEmpty, MarketPagination, plainButton, ProviderCard } from "@/components/marketplace/ui";
import { marketDirectory, marketPage } from "@/lib/marketplace/service";
import { cleanText, compareHref, directoryHref, filterKeys, maxCompare, parseCompareIds, parseDirectoryFilters, requestHref, type DirectoryFilters } from "@/lib/marketplace/prefill";
import { JsonLd, organizationId, siteMetadata, siteOrigin, websiteId } from "@/lib/marketing/seo";

export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
  const params = await searchParams;
  const filtered = filterKeys.some((key) => cleanText(params[key], 100));
  const page = marketPage(params.page);
  const base = siteMetadata("Usta Bul", "İl ve ilçene hizmet veren ustaları bul, profillerini incele veya iş ilanı ver.", !filtered && page > 1 ? `/usta-bul?page=${page}` : "/usta-bul");
  return filtered ? { ...base, robots: { index: false, follow: true } } : base;
}

const filterNames: Record<keyof DirectoryFilters, string> = { category: "Hizmet", city: "İl", district: "İlçe", q: "Usta adı" };

export default async function DirectoryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const filters = parseDirectoryFilters(params);
  const page = marketPage(params.page);
  const compare = parseCompareIds(params.compare);
  // Outage or missing configuration must surface as a 500 (error.tsx), never as a 200 page claiming "no results".
  const directory = await marketDirectory({ ...filters, page: String(page) });
  if (!directory) throw new Error("Usta rehberi yüklenemedi.");
  const active = filterKeys.filter((key) => filters[key]);
  const providers = directory.providers.slice(0, 20);
  const pageUrl = (next: number) => directoryHref(filters, { page: next, compare });
  const without = (...keys: (keyof DirectoryFilters)[]) => directoryHref({ ...filters, ...Object.fromEntries(keys.map((key) => [key, ""])) }, { compare });
  const valueLabel = (key: keyof DirectoryFilters) => key === "category" ? directory.categories.find((item) => item.slug === filters.category)?.name ?? filters.category : filters[key];
  const toggle = (id: string) => directoryHref(filters, { page, compare: compare.includes(id) ? compare.filter((item) => item !== id) : [...compare, id] });
  const names = compare.flatMap((id) => providers.find((provider) => provider.id === id)?.display_name ?? []);
  const request = requestHref({ category: filters.category, city: filters.city, district: filters.district });
  const listUrl = `${siteOrigin}${directoryHref({}, { page })}`;
  const jsonLd = {
    "@context": "https://schema.org", "@type": "CollectionPage", "@id": `${listUrl}#collection`, url: listUrl, name: "Usta Bul", inLanguage: "tr-TR",
    isPartOf: { "@id": websiteId }, publisher: { "@id": organizationId },
    mainEntity: {
      "@type": "ItemList", numberOfItems: providers.length, itemListOrder: "https://schema.org/ItemListUnordered",
      itemListElement: providers.map((provider, index) => ({ "@type": "ListItem", position: (page - 1) * 20 + index + 1, name: provider.display_name, url: `${siteOrigin}/usta-bul/${provider.id}` })),
    },
  };

  return <div className={`min-h-[60vh] bg-white text-[#1d1d1f] ${compare.length ? "pb-24" : ""}`}>
    <JsonLd data={jsonLd} />
    <section aria-labelledby="directory-title" className="bg-white">
      <div className="mx-auto max-w-[1180px] px-5 pb-8 pt-12 sm:px-8 sm:pt-16">
        <h1 id="directory-title" className="max-w-3xl text-[clamp(2.5rem,6vw,4.5rem)] font-[650] leading-[1.08] tracking-[-0.04em] text-balance">Yakınındaki ustaları bul.</h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-[#515154]">Hizmeti ve bölgeni seç, profilleri karşılaştır ve uygun ustadan teklif iste.</p>
        <form key={pageUrl(1)} action="/usta-bul" aria-label="Usta ara" className="mt-8 grid gap-4 rounded-[20px] bg-[#f5f5f7] p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-[1.3fr_1fr_1fr_1fr_auto] lg:items-end">
          {compare.length > 0 && <input type="hidden" name="compare" value={compare.join(",")} />}
          <div className="grid min-w-0 gap-2 text-sm font-semibold"><label htmlFor="directory-category">Hizmet</label><select id="directory-category" className={input} name="category" defaultValue={filters.category}>
            <option value="">Tüm hizmetler</option>
            {filters.category && !directory.categories.some((category) => category.slug === filters.category) && <option value={filters.category}>Seçili hizmet</option>}
            <CategoryOptions categories={directory.categories} />
          </select></div>
          <label className="grid min-w-0 gap-2 text-sm font-semibold">İl<input className={input} name="city" defaultValue={filters.city} placeholder="Örn. İstanbul" maxLength={80} /></label>
          <label className="grid min-w-0 gap-2 text-sm font-semibold">İlçe<input className={input} name="district" defaultValue={filters.district} placeholder="Örn. Kadıköy" maxLength={80} /></label>
          <label className="grid min-w-0 gap-2 text-sm font-semibold">Usta adı<input className={input} name="q" defaultValue={filters.q} placeholder="Ada göre ara" maxLength={100} /></label>
          <button type="submit" className={`${linkButton} min-h-12`}><Search aria-hidden="true" size={17} /> Ara</button>
        </form>
        {active.length > 0 && <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Seçili filtreler">
          <span className="text-sm text-[#515154]">Seçili filtreler:</span>
          {active.map((key) => <Link key={key} href={without(key)} className={`${chip} hover:bg-[#d2d2d7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#075d54]`} aria-label={`${filterNames[key]} filtresini kaldır: ${valueLabel(key)}`}>
            <span className="text-[#515154]">{filterNames[key]}:</span> {valueLabel(key)} <X size={14} aria-hidden="true" /></Link>)}
          <Link href={directoryHref({}, { compare })} className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-[#075d54] hover:underline">Tümünü temizle</Link>
        </div>}
      </div>
    </section>

    <section aria-labelledby="directory-results" className="bg-[#f5f5f7] py-12 sm:py-16">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <h2 id="directory-results" className="mb-6 text-[clamp(1.6rem,3vw,2.5rem)] font-semibold tracking-[-0.03em]">Usta profilleri</h2>
        {providers.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{providers.map((provider) => <ProviderCard key={provider.id} provider={provider} categories={directory.categories}
            compare={{ href: toggle(provider.id), selected: compare.includes(provider.id), full: compare.length >= maxCompare }} />)}</div>
        ) : <MarketEmpty photo>
          <MapPin className="mb-3 text-[#075d54]" aria-hidden="true" size={23} />
          <p className="text-lg font-semibold text-[#1d1d1f]">{page > 1 ? "Bu sayfada profil bulunamadı." : active.length ? "Bu aramaya uyan bir usta bulunamadı." : "Henüz yayımlanmış usta profili yok."}</p>
          {page === 1 && active.length > 0 && <p className="mt-2">Aramayı genişletebilir veya işini ilan olarak paylaşıp ustalardan teklif alabilirsin.</p>}
          <div className="mt-5 flex flex-wrap gap-2">
            {page === 1 && filters.district && <Link href={without("district")} className={plainButton}>İlçe filtresini kaldır</Link>}
            {page === 1 && active.length > 0 && <Link href={directoryHref({}, { compare })} className={plainButton}>Tüm filtreleri kaldır</Link>}
            {page > 1 && <Link href={pageUrl(1)} className={plainButton}>İlk sayfaya dön</Link>}
            <Link href={request} className={linkButton}>İş ilanı ver <ArrowRight aria-hidden="true" size={17} /></Link>
          </div>
        </MarketEmpty>}
        <MarketPagination page={page} more={directory.providers.length > 20} href={pageUrl} />
      </div>
    </section>

    <section className="bg-white py-12 sm:py-16"><div className="mx-auto max-w-[1180px] px-5 sm:px-8">
      <aside className="flex flex-wrap items-center justify-between gap-5 rounded-[20px] bg-[#f5f5f7] p-6 sm:p-10">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#e4f0ed] text-[#075d54]"><ClipboardList aria-hidden="true" size={21} /></span>
          <div className="min-w-0"><h2 className="text-xl font-semibold tracking-[-0.02em] sm:text-2xl">Ustalar sana teklif versin.</h2><p className="mt-1 text-sm leading-relaxed text-[#515154]">Yapılacak işi tarif et, gelen teklifleri tek yerden karşılaştır.</p></div>
        </div>
        <div className="flex flex-wrap gap-2"><Link className={plainButton} href="/talepler">Taleplerim</Link><Link className={linkButton} href={request}>İş ilanı ver <ArrowRight aria-hidden="true" size={17} /></Link></div>
      </aside>
    </div></section>
    <CompareTray count={compare.length} names={names} href={compareHref(compare, filters, page)} clearHref={directoryHref(filters, { page })} />
  </div>;
}
