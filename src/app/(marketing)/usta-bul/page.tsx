import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ClipboardList, MapPin, Search, X } from "lucide-react";
import { CategoryOptions, chip, input, linkButton, MarketEmpty, MarketPagination, plainButton, ProviderCard } from "@/components/marketplace/ui";
import { marketDirectory, marketPage } from "@/lib/marketplace/service";
import { cleanText, directoryHref, filterKeys, maxCompare, parseCompareIds, requestHref, type DirectoryFilters } from "@/lib/marketplace/prefill";
import { siteMetadata } from "@/lib/marketing/seo";

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
  const filters = Object.fromEntries(filterKeys.map((key) => [key, cleanText(params[key], key === "q" ? 100 : key === "category" ? 80 : 80)])) as DirectoryFilters;
  const page = marketPage(params.page);
  const compare = parseCompareIds(params.compare);
  const directory = await marketDirectory({ ...filters, page: String(page) }).catch(() => null);
  const active = filterKeys.filter((key) => filters[key]);
  const providers = directory?.providers.slice(0, 20) ?? [];
  const pageUrl = (next: number) => directoryHref(filters, { page: next, compare });
  const without = (...keys: (keyof DirectoryFilters)[]) => directoryHref({ ...filters, ...Object.fromEntries(keys.map((key) => [key, ""])) }, { compare });
  const valueLabel = (key: keyof DirectoryFilters) => key === "category" ? directory?.categories.find((item) => item.slug === filters.category)?.name ?? filters.category : filters[key];
  const toggle = (id: string) => directoryHref(filters, { page, compare: compare.includes(id) ? compare.filter((item) => item !== id) : [...compare, id] });

  return <div className="min-h-[60vh] bg-[#FAF7F1] text-[#202923]">
    <section aria-labelledby="directory-title" className="border-b border-[#E7E1D6]">
      <div className="mx-auto max-w-6xl px-5 pb-8 pt-10 sm:px-8 sm:pt-14">
        <h1 id="directory-title" className="max-w-3xl text-[clamp(2.2rem,5.5vw,3.75rem)] leading-[1.05] font-semibold tracking-tight text-balance">Yakınındaki ustaları bul.</h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-[#5B6460] sm:text-lg">Hizmeti ve bölgeni seç, profilleri karşılaştır ve uygun ustadan teklif iste.</p>
        <form key={pageUrl(1)} action="/usta-bul" aria-label="Usta ara" className="mt-7 grid gap-4 rounded-2xl border border-[#E7E1D6] bg-white p-5 shadow-[0_1px_2px_#2029230a] sm:grid-cols-2 sm:p-6 lg:grid-cols-[1.3fr_1fr_1fr_1fr_auto] lg:items-end">
          {compare.length > 0 && <input type="hidden" name="compare" value={compare.join(",")} />}
          <div className="grid min-w-0 gap-2 text-sm font-semibold"><label htmlFor="directory-category">Hizmet</label><select id="directory-category" className={input} name="category" defaultValue={filters.category}>
            <option value="">Tüm hizmetler</option>
            {filters.category && !directory?.categories.some((category) => category.slug === filters.category) && <option value={filters.category}>Seçili hizmet</option>}
            <CategoryOptions categories={directory?.categories ?? []} />
          </select></div>
          <label className="grid min-w-0 gap-2 text-sm font-semibold">İl<input className={input} name="city" defaultValue={filters.city} placeholder="Örn. İstanbul" maxLength={80} /></label>
          <label className="grid min-w-0 gap-2 text-sm font-semibold">İlçe<input className={input} name="district" defaultValue={filters.district} placeholder="Örn. Kadıköy" maxLength={80} /></label>
          <label className="grid min-w-0 gap-2 text-sm font-semibold">Usta adı<input className={input} name="q" defaultValue={filters.q} placeholder="Ada göre ara" maxLength={100} /></label>
          <button type="submit" className={linkButton}><Search aria-hidden="true" size={17} /> Ara</button>
        </form>
        {active.length > 0 && <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Seçili filtreler">
          <span className="text-sm text-[#5B6460]">Seçili filtreler:</span>
          {active.map((key) => <Link key={key} href={without(key)} className={`${chip} hover:bg-[#E4DCC9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#075D54]`} aria-label={`${filterNames[key]} filtresini kaldır: ${valueLabel(key)}`}>
            <span className="text-[#5B6460]">{filterNames[key]}:</span> {valueLabel(key)} <X size={14} aria-hidden="true" /></Link>)}
          <Link href={directoryHref({}, { compare })} className="inline-flex min-h-9 items-center px-2 text-sm font-semibold text-[#075D54] hover:underline">Tümünü temizle</Link>
        </div>}
      </div>
    </section>

    <section aria-labelledby="directory-results" className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-12">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <h2 id="directory-results" className="text-2xl font-semibold tracking-tight sm:text-3xl">Usta profilleri</h2>
        {compare.length > 0 && <Link href={`/usta-bul/karsilastir?ids=${compare.join(",")}`} className={compare.length > 1 ? linkButton : plainButton} aria-disabled={compare.length < 2}>
          {compare.length > 1 ? `${compare.length} ustayı karşılaştır` : "Karşılaştırmak için bir usta daha seç"}</Link>}
      </div>
      {!directory ? <MarketEmpty>
        <p>Usta rehberi şu anda yüklenemedi.</p>
        <a href={pageUrl(page)} className={`mt-3 ${plainButton}`}>Tekrar dene</a>
      </MarketEmpty> : providers.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{providers.map((provider) => <ProviderCard key={provider.id} provider={provider} categories={directory.categories}
          compare={{ href: toggle(provider.id), selected: compare.includes(provider.id), full: compare.length >= maxCompare }} />)}</div>
      ) : <MarketEmpty>
        <MapPin className="mb-3 text-[#075D54]" aria-hidden="true" size={23} />
        <p className="font-semibold text-[#202923]">{page > 1 ? "Bu sayfada profil bulunamadı." : active.length ? "Bu aramaya uyan bir usta bulunamadı." : "Henüz yayımlanmış usta profili yok."}</p>
        {page === 1 && active.length > 0 && <p className="mt-1">Aramayı genişletmek için filtreyi kaldırabilir veya işini ilan olarak paylaşıp ustalardan teklif alabilirsin.</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          {page === 1 && filters.district && <Link href={without("district")} className={plainButton}>İlçe filtresini kaldır</Link>}
          {page > 1 && <Link href={pageUrl(1)} className={plainButton}>İlk sayfaya dön</Link>}
          <Link href={requestHref({ category: filters.category, city: filters.city, district: filters.district })} className={linkButton}>İş ilanı ver <ArrowRight aria-hidden="true" size={17} /></Link>
        </div>
      </MarketEmpty>}
      {directory && <MarketPagination page={page} more={directory.providers.length > 20} href={pageUrl} />}

      <aside className="mt-10 flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-[#E7E1D6] bg-white p-6 sm:p-8">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#E4EFEC] text-[#075D54]"><ClipboardList aria-hidden="true" size={21} /></span>
          <div className="min-w-0"><h2 className="text-xl font-semibold tracking-tight">Ustalar sana teklif versin.</h2><p className="mt-1 text-sm leading-relaxed text-[#5B6460]">Yapılacak işi tarif et, gelen teklifleri tek yerden karşılaştır.</p></div>
        </div>
        <div className="flex flex-wrap gap-2"><Link className={plainButton} href="/talepler">Taleplerim</Link><Link className={linkButton} href={requestHref({ category: filters.category, city: filters.city, district: filters.district })}>İş ilanı ver <ArrowRight aria-hidden="true" size={17} /></Link></div>
      </aside>
    </section>
  </div>;
}
