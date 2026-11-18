import { requireViewer } from "@/lib/viewer";
import { marketDirectory, marketPage, marketRead } from "@/lib/marketplace/service";
import { MarketForm } from "@/components/marketplace/form";
import { MarketEmpty, MarketHeading, MarketPagination, ProviderCard } from "@/components/marketplace/ui";

export const metadata = { title: "Favori Ustalar" };

export default async function FavoritesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireViewer();
  const page = marketPage((await searchParams).page);
  const [providers, directory] = await Promise.all([marketRead("favorites", page), marketDirectory()]);
  return <><MarketHeading title="Favori ustalar" />
    {providers.length ? <div className="grid gap-4 sm:grid-cols-2">{providers.slice(0, 20).map((provider) =>
      <ProviderCard key={provider.id} provider={provider} categories={directory?.categories ?? []}>
        <MarketForm action="unfavorite" fields={{ provider: provider.id }} label="Favoriden çıkar" inline subtle />
      </ProviderCard>)}</div> : <MarketEmpty>Henüz favori listen boş.</MarketEmpty>}
    <MarketPagination page={page} more={providers.length > 20} href={(next) => `/talepler/favoriler?page=${next}`} />
  </>;
}
