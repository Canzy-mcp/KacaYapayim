import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";
export const metadata = { title: "Şifremi Unuttum" };
export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return <AuthShell title="Şifreni sıfırla." description="E-posta adresine bir sıfırlama bağlantısı göndereceğiz." footer={<Link href="/login" className="font-semibold text-[#0071E3] hover:underline">Girişe Dön</Link>}><ForgotPasswordForm notice={params.error ? "Bağlantı geçersiz veya süresi dolmuş. Yeni bağlantı iste." : undefined} /></AuthShell>;
}
