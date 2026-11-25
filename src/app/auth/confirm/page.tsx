import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui";

export const metadata: Metadata = { title: "Bağlantıyı Onayla", robots: { index: false, follow: false } };

export default async function ConfirmPage({ searchParams }: { searchParams: Promise<{ token_hash?: string; type?: string; next?: string }> }) {
  const { token_hash, type, next } = await searchParams;
  if (typeof token_hash !== "string" || !/^[A-Za-z0-9_-]{8,256}$/.test(token_hash) || !["email", "signup", "recovery"].includes(type ?? "")) redirect("/login?error=link");
  const recovery = type === "recovery";
  return <AuthShell title={recovery ? "Şifre sıfırlamaya devam et." : "E-posta bağlantını onayla."} description={recovery ? "Yeni şifre belirlemek için devam et." : "Hesabına giriş yapmak için devam et."}>
    <form method="post" action="/auth/callback" className="space-y-5">
      <input type="hidden" name="token_hash" value={token_hash} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="next" value={typeof next === "string" ? next : ""} />
      <p className="rounded-xl bg-canvas px-4 py-3 text-[14px] leading-6 text-muted">Bu e-postayı sen istemediysen devam etme.</p>
      <Button type="submit" className="min-h-12 w-full">{recovery ? "Şifre sıfırlamaya devam et" : "E-posta bağlantını onayla"}</Button>
    </form>
  </AuthShell>;
}
