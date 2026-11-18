import { notFound, redirect } from "next/navigation";
import { validMarketId } from "@kacayapayim/core/marketplace";
import { requireViewer } from "@/lib/viewer";
import { marketDirectory, marketRead } from "@/lib/marketplace/service";
import { MarketHeading, panel } from "@/components/marketplace/ui";
import { RequestForm } from "@/components/marketplace/request-form";

export const metadata = { title: "İlanı Düzenle" };

export default async function EditMarketRequestPage({ params }: { params: Promise<{ id: string }> }) {
  await requireViewer();
  const { id } = await params;
  if (!validMarketId(id)) notFound();
  const [detail, directory] = await Promise.all([marketRead("detail", 1, id), marketDirectory()]);
  if (!detail?.is_customer || !directory) notFound();
  if (detail.request.state !== "open" || detail.request.is_direct || detail.offers.length) redirect(`/talepler/${id}`);
  return <div className="mx-auto max-w-2xl"><MarketHeading title="İlanı Düzenle" /><div className={panel}><RequestForm existing={detail.request} categories={directory.categories} /></div></div>;
}
