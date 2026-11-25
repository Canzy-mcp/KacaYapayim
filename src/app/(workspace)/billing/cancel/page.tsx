import Link from "next/link";
export const metadata = { title: "Ödeme Tamamlanmadı" };
export default function BillingCancelPage() {
  return <main className="mx-auto max-w-[620px] rounded-2xl border border-line bg-white p-8 sm:p-10"><h1 className="text-[30px] font-semibold tracking-tight">Ödeme tamamlanmadı.</h1><p className="mt-3 text-[15px] text-muted">Üyeliğinde değişiklik yapılmadı; ücret alınmadı.</p><Link href="/billing" className="mt-7 inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-[13px] font-semibold text-white">Üyeliğe Dön</Link></main>;
}
