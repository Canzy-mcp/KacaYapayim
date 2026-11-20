import Link from "next/link";
import { marketDirectory, marketPage, marketRead, requireMarketViewer } from "@/lib/marketplace/service";
import { MarketForm } from "@/components/marketplace/form";
import { linkButton, MarketEmpty, MarketHeading, MarketPagination, ProviderCard } from "@/components/marketplace/ui";

export const metadata = { title: "Favori Ustalar" };

export default async function FavoritesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireMarketViewer("/talepler/favoriler");
  const page = marketPage((await searchParams).page);
  const [providers, directory] = await Promise.all([marketRead("favorites", page), marketDirectory()]);
  return <><MarketHeading title="Favori ustalar" />
    {providers.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{providers.slice(0, 20).map((provider) =>
      <ProviderCard key={provider.id} provider={provider} categories={directory?.categories ?? []}>
        <MarketForm action="unfavorite" fields={{ provider: provider.id }} label="Favoriden çıkar" inline subtle />
      </ProviderCard>)}</div> : <MarketEmpty photo>
        <p className="text-lg font-semibold text-[#1d1d1f]">{page > 1 ? "Bu sayfada favori usta yok." : "Henüz favori ustan yok."}</p>{page === 1 && <p className="mt-2">Beğendiğin ustaları profilinden favoriye ekle, burada hızlıca bul.</p>}
        {page === 1 && <div className="mt-5 flex flex-wrap gap-2"><Link href="/usta-bul" className={linkButton}>Usta rehberini aç</Link></div>}
      </MarketEmpty>}
    <MarketPagination page={page} more={providers.length > 20} href={(next) => `/talepler/favoriler?page=${next}`} />
  </>;
}
