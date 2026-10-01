import { PageHeader } from "@/components/layout";
import { SettingsForm } from "@/components/settings/settings-form";
import { requireCompletedViewer } from "@/lib/viewer";
import Link from "next/link";
import { FeedbackForm } from "@/components/settings/feedback-form";
export const metadata = { title: "Ayarlar" };
export default async function SettingsPage() {
  const viewer = await requireCompletedViewer();
  if (!viewer.profile || !viewer.business) throw new Error("Bilgiler yüklenemedi.");
  return <><PageHeader title="Ayarlar" description="Profilini, işletmeni ve kâr hedeflerini güncelle." /><Link href="/billing" className="mb-6 flex min-h-14 items-center justify-between rounded-[16px] border border-[#e5e5e9] bg-white px-5 text-[14px] font-semibold text-[#0071E3]">Paket ve Kullanım <span aria-hidden>→</span></Link><SettingsForm key={`${viewer.profile.updated_at}-${viewer.business.updated_at}`} profile={viewer.profile} business={viewer.business} /><FeedbackForm/><div className="mt-6 flex gap-5 text-sm"><Link href="/rehber" className="text-[#0071e3]">Yardım / Rehber</Link><Link href="/iletisim" className="text-[#0071e3]">İletişim</Link></div></>;
}
