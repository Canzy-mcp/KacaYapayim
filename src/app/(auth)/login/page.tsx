import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/auth-forms";
import { getViewer } from "@/lib/viewer";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { accountHome, providerSetupPath, requestReturnPath } from "@/lib/account/home";
import { isPlatformAdmin } from "@/lib/account/platform-admin";
export const metadata = { title: "Giriş Yap" };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reset?: string; error?: string; next?: string }> }) {
  const params = await searchParams;
  const next = requestReturnPath(params.next);
  const viewer = await getViewer();
  if (viewer) redirect(next ?? (await isPlatformAdmin(viewer.id) ? "/admin" : accountHome(viewer.business, viewer.preference)));
  const configured = isSupabaseConfigured();
  const notice = params.reset === "success" ? "Şifren güncellendi. Yeni şifrenle giriş yap." : params.error ? "Bağlantı geçersiz veya süresi dolmuş. Tekrar dene." : undefined;
  if (!configured) return <AuthShell title="KaçaYapayım’ı keşfet." description="Henüz hesabın olmasa da örnek verilerle uygulamanın içini gezebilirsin."><Link href="/demo" className="flex min-h-12 items-center justify-center rounded-full bg-primary px-5 text-[14px] font-semibold text-white hover:bg-primary">Şifresiz Demoya Gir</Link><p className="mt-4 text-center text-[12px] leading-5 text-muted">Demo yalnızca önizlemedir; yaptığın seçimler kaydedilmez. Gerçek hesap girişi Supabase bağlandığında açılır.</p></AuthShell>;
  const register = next === providerSetupPath ? `/register?hesap=usta&next=${encodeURIComponent(next)}`
    : next ? `/register?next=${encodeURIComponent(next)}` : "/register";
  return <AuthShell title="Tekrar hoş geldin." description="Taleplerine, tekliflerine ve işlerine ulaş."
    footer={<>Hesabın yok mu? <Link href={register} className="font-semibold text-primary hover:underline">Kayıt Ol</Link></>}>
    <LoginForm notice={notice} next={next} />
    <Link href="/usta-bul" className="mt-4 flex min-h-11 items-center justify-center rounded-xl border border-line text-sm font-semibold text-primary-hover hover:bg-surface-2">Usta arıyorum</Link>
  </AuthShell>;
}
