import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/auth-forms";
import { getViewer } from "@/lib/viewer";
import { accountHome, requestReturnPath } from "@/lib/account/home";
export const metadata = { title: "Kayıt Ol" };
export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ hesap?: string; next?: string }> }) {
  const { hesap, next: returnTo } = await searchParams;
  const next = requestReturnPath(returnTo);
  const viewer = await getViewer();
  if (viewer) redirect(next ?? (hesap === "musteri" ? "/talepler" : accountHome(viewer.business, viewer.preference)));
  if (process.env.PUBLIC_SIGNUPS_ENABLED === "false") return <AuthShell title="Yeni hesap açılışı kapalı." description="KaçaYapayım şu anda yeni kayıt almıyor." footer={<Link href="/" className="font-semibold text-[#0071E3] hover:underline">Ana Sayfaya Dön</Link>}><p className="text-sm text-[#6E6E73]">Hesabın varsa giriş yapabilirsin.</p><Link href="/login" className="mt-5 inline-block font-semibold text-[#0071E3]">Giriş Yap</Link></AuthShell>;
  return <AuthShell title="KaçaYapayım'a başla." description="Hizmet almak veya usta olarak çalışmak için hesabını oluştur." footer={<>Zaten hesabın var mı? <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="font-semibold text-[#0071E3] hover:underline">Giriş Yap</Link></>}><RegisterForm account={hesap === "musteri" || next ? "customer" : "provider"} next={next} /></AuthShell>;
}
