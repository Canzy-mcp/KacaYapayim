import Link from "next/link";
import { Plus } from "lucide-react";
import { marketDirectory, marketPage, marketRead, requireMarketViewer } from "@/lib/marketplace/service";
import { linkButton, MarketEmpty, MarketHeading, MarketPagination, plainButton, RequestList } from "@/components/marketplace/ui";

export const metadata = { title: "Hizmet Taleplerim" };

export default async function RequestsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireMarketViewer("/talepler");
  const page = marketPage((await searchParams).page);
  const [rows, directory] = await Promise.all([marketRead("own", page), marketDirectory()]);
  return <>
    <MarketHeading title="Taleplerim" description="Açtığın ilanları, doğrudan usta çağrılarını ve gelen teklifleri takip et.">
      <Link href="/talepler/yeni" className={linkButton}><Plus size={19} /> İş İlanı Ver</Link>
    </MarketHeading>
    {rows.length > 0 || page > 1 ? <RequestList rows={rows.slice(0, 20)} categories={directory?.categories ?? []} empty="Bu sayfada talep yok." /> :
      <MarketEmpty photo><p className="text-lg font-semibold text-[#1d1d1f]">Henüz bir talep açmadın.</p>
        <p className="mt-1">İş ilanı açarak teklif alabilir veya bir ustaya doğrudan çağrı gönderebilirsin.</p>
        <div className="mt-5 flex flex-wrap gap-2"><Link href="/talepler/yeni" className={linkButton}>İş ilanı ver</Link><Link href="/usta-bul" className={plainButton}>Usta rehberine git</Link></div>
      </MarketEmpty>}
    <MarketPagination page={page} more={rows.length > 20} href={(next) => `/talepler?page=${next}`} />
  </>;
}
