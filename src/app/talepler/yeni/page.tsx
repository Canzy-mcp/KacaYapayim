import Link from "next/link";
import { notFound } from "next/navigation";
import { validMarketId } from "@kacayapayim/core/marketplace";
import { marketDirectory, marketRead, requireMarketViewer } from "@/lib/marketplace/service";
import { MarketEmpty, MarketHeading, panel, plainButton } from "@/components/marketplace/ui";
import { RequestForm } from "@/components/marketplace/request-form";

export const metadata = { title: "Yeni Hizmet Talebi" };

export default async function NewMarketRequestPage({ searchParams }: { searchParams: Promise<{ usta?: string }> }) {
  const { usta } = await searchParams;
  if (usta !== undefined && !validMarketId(usta)) notFound();
  await requireMarketViewer(usta ? `/talepler/yeni?usta=${usta}` : "/talepler/yeni");
  const [directory, settings] = await Promise.all([marketDirectory(usta ? { id: usta } : {}), usta ? marketRead("provider") : null]);
  if (!directory) notFound();
  const provider = usta ? directory.providers.find((entry) => entry.id.toLowerCase() === usta.toLowerCase()) : undefined;
  const ownProfile = provider && settings?.profile?.id === provider.id;
  if (usta && (!provider || ownProfile)) return <div className="mx-auto max-w-2xl">
    <MarketHeading title="Ustaya Çağrı Gönder" />
    <MarketEmpty><p>{ownProfile ? "Kendi usta profiline çağrı gönderemezsin. İş ilanı açarak başka ustalardan teklif alabilirsin." : "Bu usta şu anda doğrudan çağrı alamıyor. Rehberdeki diğer ustaları inceleyebilirsin."}</p>
      <Link href={ownProfile ? "/talepler/yeni" : "/usta-bul"} className={`mt-4 ${plainButton}`}>{ownProfile ? "İş ilanı ver" : "Usta rehberine dön"}</Link>
    </MarketEmpty>
  </div>;
  return <div className="mx-auto max-w-2xl">
    <MarketHeading title={provider ? "Ustaya Çağrı Gönder" : "İş İlanı Ver"} description={provider ? `${provider.display_name} talebini inceleyip fiyat ve kapsam içeren teklif gönderebilir.` : "İşini tarif et. Hizmet bölgende çalışan ustalardan teklif al."}>
      <Link href={provider ? `/usta-bul/${provider.id}` : "/talepler"} className={plainButton}>{provider ? "Usta profiline dön" : "Taleplerime dön"}</Link>
    </MarketHeading>
    <div className={panel}><RequestForm provider={provider} categories={directory.categories} /></div>
  </div>;
}
