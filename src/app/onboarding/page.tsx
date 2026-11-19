import Link from "next/link";
import { redirect } from "next/navigation";
import { chooseCustomerMode } from "@/app/actions/account";
import { BrandLogo } from "@/components/brand-logo";
import { OnboardingWizard } from "@/components/onboarding/wizard";
import { providerSetupPath } from "@/lib/account/home";
import { isPlatformAdmin } from "@/lib/account/platform-admin";
import { getViewer } from "@/lib/viewer";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "İlk Kurulum" };

async function startCustomer() {
  "use server";
  const result = await chooseCustomerMode();
  redirect(result.ok ? "/talepler" : "/onboarding?hata=tercih");
}

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ usta?: string; hata?: string }> }) {
  const { usta, hata } = await searchParams;
  const setupProvider = usta === "1";
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(setupProvider ? providerSetupPath : "/onboarding")}`);
  if (await isPlatformAdmin(viewer.id)) redirect("/admin");
  if (viewer.preference === "customer" && !setupProvider) redirect("/talepler");
  if (viewer.business?.onboarding_completed) redirect("/dashboard");

  if (!setupProvider) return <main className="mx-auto max-w-xl px-5 py-12 sm:py-20">
    <Link href="/" aria-label="KaçaYapayım ana sayfa"><BrandLogo size={38} /></Link>
    <h1 className="mt-8 text-3xl font-semibold tracking-tight">KaçaYapayım’ı nasıl kullanacaksın?</h1>
    <p className="mt-3 text-sm leading-relaxed text-slate-600">Bölgende usta bulabilir ya da işletme panelini kurabilirsin.</p>
    {hata === "tercih" && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">Hesap tercihin kaydedilemedi. Tekrar dene.</p>}
    <div className="mt-6 grid gap-3">
      <form action={startCustomer}>
        <button type="submit" className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#0071e3] px-5 text-sm font-semibold text-white hover:bg-[#0061c4]">Usta arıyorum</button>
      </form>
      <Link href={providerSetupPath} className="flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-800 hover:bg-slate-50">Ustayım</Link>
    </div>
  </main>;

  const supabase = await createClient();
  const { data } = await supabase.from("professions").select("name").eq("is_active", true).eq("is_public", true)
    .not("current_version", "is", null).order("sort_order");
  return <OnboardingWizard initialBusiness={viewer.business} professionOptions={(data || []).map((item) => item.name)} />;
}
