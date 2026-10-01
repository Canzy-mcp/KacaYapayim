import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/auth-forms";
export const metadata = { title: "Yeni Şifre" };
export default function ResetPasswordPage() { return <AuthShell title="Yeni şifreni belirle." description="Hesabın için güçlü bir şifre seç." footer={<Link href="/login" className="font-semibold text-[#0071E3] hover:underline">Girişe Dön</Link>}><ResetPasswordForm /></AuthShell>; }
