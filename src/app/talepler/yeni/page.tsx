import { notFound, redirect } from "next/navigation";
import { validMarketId } from "@kacayapayim/core/marketplace";
import { getViewer } from "@/lib/viewer";
import { marketDirectory } from "@/lib/marketplace/service";
import { MarketHeading, panel } from "@/components/marketplace/ui";
import { RequestForm } from "@/components/marketplace/request-form";

export const metadata = { title: "Yeni Hizmet Talebi" };

export default async function NewMarketRequestPage({ searchParams }: { searchParams: Promise<{ usta?: string }> }) {
  const { usta } = await searchParams;
  if (usta && !validMarketId(usta)) notFound();
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(usta ? `/talepler/yeni?usta=${usta}` : "/talepler/yeni")}`);
  const directory = await marketDirectory(usta ? { id: usta } : {});
  if (!directory || (usta && !directory.providers.length)) notFound();
  const provider = usta ? directory.providers[0] : undefined;
  return <div className="mx-auto max-w-2xl">
    <MarketHeading title={provider ? "Ustaya Çağrı Gönder" : "İş İlanı Ver"} description={provider ? `${provider.display_name} talebini inceleyip fiyat ve kapsam içeren teklif gönderebilir.` : "İşini tarif et. Hizmet bölgende çalışan ustalardan teklif al."} />
    <div className={panel}><RequestForm provider={provider} categories={directory.categories} /></div>
  </div>;
}
