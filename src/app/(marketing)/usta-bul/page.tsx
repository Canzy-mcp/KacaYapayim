import Link from "next/link";
import { Search, ClipboardList } from "lucide-react";
import { CategoryOptions, input, linkButton, MarketEmpty, MarketPagination, plainButton, ProviderCard } from "@/components/marketplace/ui";
import { marketDirectory, marketPage } from "@/lib/marketplace/service";

export const metadata = { title: "Usta Bul", description: "İl ve ilçene hizmet veren ustaları bul. Usta profillerini incele veya iş ilanı aç." };

export default async function DirectoryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const filters = Object.fromEntries(["q", "city", "district", "category"].map((key) => [key, typeof params[key] === "string" ? params[key].trim().slice(0, 100) : ""]));
  const page = marketPage(params.page);
  const directory = await marketDirectory({ ...filters, page: String(page) });
  return <div className="bg-[#f6f8fc] text-[#112046]">
    <section className="border-b border-[#dfe8f3] bg-[linear-gradient(125deg,#eaf3ff_0%,#f8fbff_72%)]">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:py-18">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-6xl">İşin için usta bul.</h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-700 sm:text-lg">Hizmet veren ustaları incele, seçtiğin ustaya çağrı gönder veya ilan açıp teklifleri karşılaştır.</p>
        <div className="mt-6 flex flex-wrap gap-3"><Link className={linkButton} href="/talepler/yeni"><ClipboardList size={17} />İş İlanı Ver</Link><Link className={plainButton} href="/talepler">Taleplerim</Link></div>
        {directory && <form action="/usta-bul" className="mt-9 grid gap-3 rounded-2xl border border-[#dfe8f3] bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr_auto] lg:items-end">
          <label className="grid gap-1 text-sm font-medium">Hizmet<select className={input} name="category" defaultValue={filters.category}><option value="">Tüm hizmetler</option><CategoryOptions categories={directory.categories} /></select></label>
          <label className="grid gap-1 text-sm font-medium">İl<input className={input} name="city" defaultValue={filters.city} placeholder="Örn. İstanbul" maxLength={80} /></label>
          <label className="grid gap-1 text-sm font-medium">İlçe<input className={input} name="district" defaultValue={filters.district} placeholder="Örn. Kadıköy" maxLength={80} /></label>
          <label className="grid gap-1 text-sm font-medium">Usta adı<input className={input} name="q" defaultValue={filters.q} placeholder="Ada göre ara" maxLength={100} /></label>
          <button className={linkButton}><Search size={17} /> Ara</button>
        </form>}
      </div>
    </section>
    <section className="mx-auto max-w-6xl px-5 py-10">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2"><h2 className="text-2xl font-bold">Usta profilleri</h2>
        {Object.values(filters).some(Boolean) && <Link href="/usta-bul" className="text-sm font-semibold text-[#075fc7]">Filtreleri temizle</Link>}</div>
      {!directory ? <MarketEmpty>Usta rehberi şu anda kullanılamıyor.</MarketEmpty> : directory.providers.length ? <>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{directory.providers.slice(0, 20).map((provider) => <ProviderCard key={provider.id} provider={provider} categories={directory.categories} />)}</div>
        <MarketPagination page={page} more={directory.providers.length > 20} href={(next) => `/usta-bul?${new URLSearchParams({ ...filters, page: String(next) })}`} />
      </> : <MarketEmpty>{Object.values(filters).some(Boolean) ? "Bu aramaya uyan bir usta bulunamadı." : "Henüz yayımlanmış usta profili yok."} <Link href="/talepler/yeni" className="font-semibold text-[#075fc7] hover:underline">İş ilanı ver</Link>.</MarketEmpty>}
    </section>
  </div>;
}
