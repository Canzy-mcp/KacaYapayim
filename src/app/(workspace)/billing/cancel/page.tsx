import Link from "next/link";
export const metadata = { title: "Ödeme Tamamlanmadı" };
export default function BillingCancelPage() {
  return <main className="mx-auto max-w-[620px] rounded-[22px] border border-[#e5e5e9] bg-white p-8 sm:p-10"><h1 className="text-[30px] font-semibold tracking-tight">Ödeme tamamlanmadı.</h1><p className="mt-3 text-[15px] text-[#6E6E73]">Paketinde değişiklik yapılmadı.</p><Link href="/billing" className="mt-7 inline-flex min-h-11 items-center rounded-[12px] bg-[#0071E3] px-5 text-[13px] font-semibold text-white">Paketlere Dön</Link></main>;
}
