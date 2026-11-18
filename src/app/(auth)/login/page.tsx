import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/auth-forms";
import { getViewer } from "@/lib/viewer";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { accountHome, requestReturnPath } from "@/lib/account/home";
export const metadata = { title: "Giriş Yap" };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reset?: string; error?: string; next?: string }> }) {
  const params = await searchParams;
  const next = requestReturnPath(params.next);
  const viewer = await getViewer();
  if (viewer) redirect(next ?? accountHome(viewer.business, viewer.preference));
  const configured = isSupabaseConfigured();
  const notice = params.reset === "success" ? "Şifren güncellendi. Yeni şifrenle giriş yap." : params.error ? "Bağlantı geçersiz veya süresi dolmuş. Tekrar dene." : undefined;
  if (!configured) return <AuthShell title="KaçaYapayım’ı keşfet." description="Henüz hesabın olmasa da örnek verilerle uygulamanın içini gezebilirsin."><Link href="/demo" className="flex min-h-12 items-center justify-center rounded-[13px] bg-[#0071E3] px-5 text-[14px] font-semibold text-white hover:bg-[#0065cc]">Şifresiz Demoya Gir</Link><p className="mt-4 text-center text-[12px] leading-5 text-[#77777e]">Demo yalnızca önizlemedir; yaptığın seçimler kaydedilmez. Gerçek hesap girişi Supabase bağlandığında açılır.</p></AuthShell>;
  return <AuthShell title="Tekrar hoş geldin." description="Taleplerine, tekliflerine ve işlerine ulaş." footer={<>Hesabın yok mu? <Link href={next ? `/register?hesap=musteri&next=${encodeURIComponent(next)}` : "/register"} className="font-semibold text-[#0071E3] hover:underline">Kayıt Ol</Link></>}><LoginForm notice={notice} next={next} /></AuthShell>;
}
