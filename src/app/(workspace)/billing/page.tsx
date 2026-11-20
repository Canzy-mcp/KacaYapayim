import Link from "next/link";
import { CancelSubscription } from "@/components/billing/cancel-subscription";
import { PlanCards } from "@/components/billing/plan-cards";
import { PageHeader } from "@/components/layout";
import { IyzicoBillingProvider } from "@/lib/billing/iyzico";
import { readIyzicoConfig } from "@/lib/billing/iyzico-protocol";
import { getBillingSummary } from "@/lib/billing/service";
import { logFailure } from "@/lib/observability/log";
import { requireCompletedViewer } from "@/lib/viewer";

export const metadata = { title: "Paket ve Kullanım" };
export const dynamic = "force-dynamic";

function Usage({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const pct = limit === null ? 0 : Math.min(100, Math.round(used / limit * 100));
  return <div>
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
      <span className="font-medium">{label}</span><span className="tabular-nums text-[#5B6460]">{used} / {limit ?? "Sınırsız"}</span>
    </div>
    {limit !== null && <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E7E1D6]" aria-hidden="true">
      <div className={`h-full rounded-full ${pct >= 100 ? "bg-[#b33c37]" : pct >= 80 ? "bg-[#C98A2B]" : "bg-[#075D54]"}`} style={{ width: `${pct}%` }} />
    </div>}
  </div>;
}

export default async function BillingPage() {
  const viewer = await requireCompletedViewer();
  const business = viewer.business!;
  const config = readIyzicoConfig(process.env);
  const billingEnabled = Boolean(config);
  const owner = business.owner_id === viewer.id;
  if (owner && config) {
    await new IyzicoBillingProvider(config).reconcilePendingCheckout(business.id).catch(() => {
      logFailure("iyzico pending checkout verification failed");
    });
  }
  const { plan, plans, subscription, usage } = await getBillingSummary(business.id);
  const hasSubscription = Boolean(subscription?.provider_subscription_id && !["cancelled", "expired", "free"].includes(subscription.status));
  const checkout = billingEnabled && owner && !hasSubscription ? {
    name: viewer.profile?.first_name ?? "", surname: viewer.profile?.last_name ?? "", email: viewer.profile?.email ?? "",
    city: business.city ?? "",
  } : undefined;
  const canCancel = billingEnabled && owner && hasSubscription && subscription?.provider === "iyzico";
  const statusText = subscription?.status === "past_due" ? "Son ödeme alınamadı. Erişim, ödenen dönem sonuna kadar sürer."
    : subscription?.cancel_at_period_end ? "Dönem sonunda Ücretsiz pakete geçecek."
    : subscription?.status === "incomplete" ? "Abonelik etkinleştirilmeyi bekliyor."
    : plan.id === "free" ? "Ücretsiz kullanım" : "Aktif abonelik";

  return <div className="mx-auto max-w-[1180px] text-[#202923]">
    <PageHeader title="Paket ve Kullanım" description="Kullanımını gör, işletmene uygun paketi incele." />
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <section className="min-w-0 rounded-2xl border border-[#E7E1D6] bg-white p-6">
        <p className="text-sm font-medium text-[#5B6460]">Mevcut paket</p>
        <h2 className="mt-2 text-[27px] font-semibold tracking-tight">{plan.name}</h2>
        <p className="mt-2 text-sm text-[#5B6460]">{statusText}</p>
        {plan.id !== "free" && subscription?.current_period_end && <p className="mt-4 text-sm text-[#5B6460]">
          Dönem sonu {new Date(subscription.current_period_end).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" })}
        </p>}
        <p className="mt-4 text-sm text-[#5B6460]">Paket değişse de mevcut müşterilerin ve tekliflerin saklanır.</p>
        {canCancel && <CancelSubscription />}
      </section>
      <section className="min-w-0 rounded-2xl border border-[#E7E1D6] bg-white p-6">
        <h2 className="text-lg font-semibold">Kullanımın</h2>
        <p className="mt-1 text-sm text-[#5B6460]">Teklif hakkı her takvim ayı başında yenilenir.</p>
        <div className="mt-6 space-y-6">
          <Usage label="Bu ay oluşturulan teklifler" used={usage.monthlyQuotes} limit={plan.limits.monthly_quotes} />
          <Usage label="Aktif müşteriler" used={usage.activeCustomers} limit={plan.limits.active_customers} />
        </div>
      </section>
    </div>
    <section id="plans" className="mt-12">
      <h2 className="mb-5 text-[26px] font-semibold tracking-tight">Paketleri karşılaştır</h2>
      {(!billingEnabled || hasSubscription) && <p className="mb-5 text-sm text-[#5B6460]">
        {billingEnabled ? "Başka bir pakete geçmek için önce mevcut aboneliğini sonlandır." : "Abonelik ödemeleri henüz kullanıma açılmadı."}
      </p>}
      <PlanCards plans={plans} currentPlan={plan.id} checkout={checkout} />
      <Link href="/settings" className="mt-3 inline-flex min-h-11 items-center rounded-md text-sm font-semibold text-[#075D54] focus-visible:outline-2 focus-visible:outline-[#075D54]">Ayarlarına dön</Link>
    </section>
  </div>;
}
