import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/auth-forms";
import { getViewer } from "@/lib/viewer";
export const metadata = { title: "Kayıt Ol" };
export default async function RegisterPage() {
  const viewer = await getViewer();
  if (viewer) redirect(viewer.business?.onboarding_completed ? "/dashboard" : "/onboarding");
  if (process.env.PUBLIC_SIGNUPS_ENABLED === "false") return <AuthShell title="Yeni hesap açılışı kapalı." description="KaçaYapayım şu anda yeni kayıt almıyor." footer={<Link href="/" className="font-semibold text-[#0071E3] hover:underline">Ana Sayfaya Dön</Link>}><p className="text-sm text-[#6E6E73]">Hesabın varsa giriş yapabilirsin.</p><Link href="/login" className="mt-5 inline-block font-semibold text-[#0071E3]">Giriş Yap</Link></AuthShell>;
  return <AuthShell title="KaçaYapayım'a başla." description="İlk teklifini birkaç dakika içinde oluşturmaya başla." footer={<>Zaten hesabın var mı? <Link href="/login" className="font-semibold text-[#0071E3] hover:underline">Giriş Yap</Link></>}><RegisterForm /></AuthShell>;
}
