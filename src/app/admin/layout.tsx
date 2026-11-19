import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { adminChallenge } from "./access";

export const metadata = { robots: { index: false, follow: false } };

const sections = [
  ["/admin", "Genel bakış"],
  ["/admin/analytics", "Ürün ölçümleri"],
  ["/admin/professions", "Meslek şablonları"],
  ["/admin/talepler", "Bildirimler"],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const challenge = await adminChallenge();
  if (challenge) return challenge;
  async function signOut() {
    "use server";
    await logoutAction();
    redirect("/login");
  }

  return <div className="min-h-screen bg-slate-50 text-slate-900">
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3">
        <Link href="/admin" className="font-semibold">KaçaYapayım Yönetim</Link>
        <nav aria-label="Yönetim" className="flex flex-1 flex-wrap gap-x-4">
          {sections.map(([href, label]) => <Link key={href} href={href} className="inline-flex min-h-11 items-center text-sm font-medium hover:underline">{label}</Link>)}
        </nav>
        <form action={signOut}><button className="min-h-11 text-sm font-medium hover:underline">Çıkış yap</button></form>
      </div>
    </header>
    <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
  </div>;
}
