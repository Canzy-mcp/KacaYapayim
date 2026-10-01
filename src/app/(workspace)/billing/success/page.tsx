import Link from "next/link";
import { getBillingSummary } from "@/lib/billing/service";
import { requireCompletedViewer } from "@/lib/viewer";
export const metadata = { title: "Paket Durumu" };
export const dynamic = "force-dynamic";
export default async function BillingSuccessPage() {
  const viewer = await requireCompletedViewer();
  const { plan } = await getBillingSummary(viewer.business!.id);
  const active = plan.id !== "free";
  return <main className="mx-auto max-w-[620px] rounded-[22px] border border-[#e5e5e9] bg-white p-8 sm:p-10"><h1 className="text-[30px] font-semibold tracking-tight">{active ? `${plan.name} paketin aktif.` : "Ödemen kontrol ediliyor."}</h1><p className="mt-3 text-[15px] leading-6 text-[#6E6E73]">{active ? "Yeni hakların kullanılabilir durumda." : "Paketin ancak ödeme doğrulandıktan sonra aktif olur. Durumu paket sayfandan takip edebilirsin."}</p><Link href={active ? "/dashboard" : "/billing"} className="mt-7 inline-flex min-h-11 items-center rounded-[12px] bg-[#0071E3] px-5 text-[13px] font-semibold text-white">{active ? "Ana Sayfaya Dön" : "Paket Durumunu Gör"}</Link></main>;
}
