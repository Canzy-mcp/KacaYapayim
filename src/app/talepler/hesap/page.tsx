import { redirect } from "next/navigation";
import { requireMarketViewer } from "@/lib/marketplace/service";
import { logoutAction } from "@/app/actions/auth";
import { AccountSecurity } from "@/components/settings/account-security";
import { Mfa } from "@/components/settings/mfa";
import { ExportPanel } from "@/components/settings/export-panel";
import { MarketHeading, panel, plainButton } from "@/components/marketplace/ui";

export const metadata = { title: "Hizmet Hesabım" };

async function logout() {
  "use server";
  await logoutAction();
  redirect("/");
}

export default async function MarketAccountPage() {
  const { profile } = await requireMarketViewer("/talepler/hesap");
  return <div className="mx-auto max-w-2xl"><MarketHeading title="Hesabım" />
    <section className={panel}><h2 className="text-lg font-semibold">{profile?.first_name} {profile?.last_name}</h2>
      <p className="mt-1 break-words text-sm text-[#5B6460]">{profile?.email}</p>
      <form action={logout} className="mt-4"><button className={plainButton}>Çıkış yap</button></form>
    </section>
    <Mfa destination="/talepler/hesap" />
    <ExportPanel accountOnly />
    <AccountSecurity />
  </div>;
}
