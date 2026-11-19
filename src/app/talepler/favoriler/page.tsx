import Link from "next/link";
import { marketDirectory, marketPage, marketRead, requireMarketViewer } from "@/lib/marketplace/service";
import { MarketForm } from "@/components/marketplace/form";
import { MarketEmpty, MarketHeading, MarketPagination, plainButton, ProviderCard } from "@/components/marketplace/ui";

export const metadata = { title: "Favori Ustalar" };

export default async function FavoritesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireMarketViewer("/talepler/favoriler");
  const page = marketPage((await searchParams).page);
  const [providers, directory] = await Promise.all([marketRead("favorites", page), marketDirectory()]);
  return <><MarketHeading title="Favori ustalar" />
    {providers.length ? <div className="grid gap-4 sm:grid-cols-2">{providers.slice(0, 20).map((provider) =>
      <ProviderCard key={provider.id} provider={provider} categories={directory?.categories ?? []}>
        <MarketForm action="unfavorite" fields={{ provider: provider.id }} label="Favoriden çıkar" inline subtle />
      </ProviderCard>)}</div> : <MarketEmpty>
        <p>{page > 1 ? "Bu sayfada favori usta yok." : "Rehberden favorilerine eklediğin ustalar burada görünür."}</p>
        {page === 1 && <Link href="/usta-bul" className={`mt-4 ${plainButton}`}>Usta rehberini aç</Link>}
      </MarketEmpty>}
    <MarketPagination page={page} more={providers.length > 20} href={(next) => `/talepler/favoriler?page=${next}`} />
  </>;
}
