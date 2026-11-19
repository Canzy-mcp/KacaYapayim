import Link from "next/link";
import { ArrowRight, ClipboardList, MapPin, Search } from "lucide-react";
import { CategoryOptions, input, linkButton, MarketEmpty, MarketPagination, plainButton, ProviderCard } from "@/components/marketplace/ui";
import { marketDirectory, marketPage } from "@/lib/marketplace/service";
import { siteMetadata } from "@/lib/marketing/seo";

export const metadata = siteMetadata("Usta Bul", "İl ve ilçene hizmet veren ustaları bul, profillerini incele veya iş ilanı ver.", "/usta-bul");

const filterNames = { category: "Hizmet", city: "İl", district: "İlçe", q: "Usta adı" };

export default async function DirectoryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const filters = Object.fromEntries(Object.keys(filterNames).map((key) => [key, typeof params[key] === "string" ? params[key].trim().slice(0, 100) : ""]));
  const page = marketPage(params.page);
  const directory = await marketDirectory({ ...filters, page: String(page) }).catch(() => null);
  const hasFilters = Object.values(filters).some(Boolean);
  const providers = directory?.providers.slice(0, 20) ?? [];
  const currentUrl = (next: number) => {
    const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
    if (next > 1) query.set("page", String(next));
    return query.size ? `/usta-bul?${query}` : "/usta-bul";
  };

  return <div className="min-h-[60vh] bg-[#f5f5f7] text-[#1d1d1f]">
    <section aria-labelledby="directory-title" className="bg-[radial-gradient(ellipse_at_50%_0%,#e9f3ff,transparent_72%)]">
      <div className="mx-auto max-w-6xl px-5 pt-11 sm:px-8 sm:pt-18">
        <div className="mx-auto max-w-2xl text-center">
          <h1 id="directory-title" className="text-[clamp(2.65rem,7vw,5.25rem)] leading-[1.02] font-semibold tracking-[-.065em] text-balance">Yakınındaki ustaları bul.</h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-[#56565d] sm:text-lg">Hizmeti ve bölgeni seç, profilleri karşılaştır ve uygun ustaya çağrı gönder.</p>
        </div>
        <form key={currentUrl(1)} action="/usta-bul" aria-label="Usta ara" className="mt-9 grid gap-4 rounded-[28px] border border-[#e4e4e9] bg-white p-5 shadow-[0_16px_48px_#20334e0c] sm:grid-cols-2 sm:p-6 lg:grid-cols-[1.35fr_1fr_1fr_1fr_auto] lg:items-end">
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
      </div>
    </section>

    <section aria-labelledby="directory-results" className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <h2 id="directory-results" className="text-2xl font-semibold tracking-tight sm:text-3xl">Usta profilleri</h2>
        {hasFilters && <Link href="/usta-bul" className={plainButton}>Filtreleri temizle</Link>}
      </div>
      {!directory ? <MarketEmpty>
        <p>Usta rehberi şu anda yüklenemedi.</p>
        <a href={currentUrl(page)} className={`mt-3 ${plainButton}`}>Tekrar dene</a>
      </MarketEmpty> : providers.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{providers.map((provider) => <ProviderCard key={provider.id} provider={provider} categories={directory.categories} />)}</div>
      ) : <MarketEmpty>
        <MapPin className="mb-3 text-[#075fc7]" aria-hidden="true" size={23} />
        <p className="font-semibold text-[#1d1d1f]">{page > 1 ? "Bu sayfada profil bulunamadı." : hasFilters ? "Bu aramaya uyan bir usta bulunamadı." : "Henüz yayımlanmış usta profili yok."}</p>
        {hasFilters && page === 1 && <p className="mt-1">Aramanı genişletmek için ilçe veya usta adı filtresini kaldırabilirsin.</p>}
      </MarketEmpty>}
      {directory && <MarketPagination page={page} more={directory.providers.length > 20} href={currentUrl} />}

      <aside className="mt-10 flex flex-wrap items-center justify-between gap-5 rounded-[28px] bg-white p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#eaf3ff] text-[#075fc7]"><ClipboardList aria-hidden="true" size={21} /></span>
          <div><h2 className="text-xl font-semibold tracking-tight">Ustalar sana teklif versin.</h2><p className="mt-1 text-sm leading-relaxed text-[#56565d]">Yapılacak işi tarif et, gelen teklifleri tek yerden karşılaştır.</p></div>
        </div>
        <div className="flex flex-wrap gap-2"><Link className={plainButton} href="/talepler">Taleplerim</Link><Link className={linkButton} href="/talepler/yeni">İş ilanı ver <ArrowRight aria-hidden="true" size={17} /></Link></div>
      </aside>
    </section>
  </div>;
}
