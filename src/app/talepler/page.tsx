import Link from "next/link";
import { Plus } from "lucide-react";
import { requireViewer } from "@/lib/viewer";
import { marketDirectory, marketPage, marketRead } from "@/lib/marketplace/service";
import { linkButton, MarketHeading, MarketPagination, RequestList } from "@/components/marketplace/ui";

export const metadata = { title: "Hizmet Taleplerim" };

export default async function RequestsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireViewer();
  const page = marketPage((await searchParams).page);
  const [rows, directory] = await Promise.all([marketRead("own", page), marketDirectory()]);
  return <>
    <MarketHeading title="Taleplerim" description="Açtığın ilanları, doğrudan usta çağrılarını ve gelen teklifleri takip et.">
      <Link href="/talepler/yeni" className={linkButton}><Plus size={19} /> İş İlanı Ver</Link>
    </MarketHeading>
    <RequestList rows={rows.slice(0, 20)} categories={directory?.categories ?? []} empty="Henüz bir talep açmadın." />
    <MarketPagination page={page} more={rows.length > 20} href={(next) => `/talepler?page=${next}`} />
  </>;
}
