import {FirstQuoteGuide} from "@/components/dashboard/first-quote-guide";
import { NotificationInbox } from "@/components/work/notification-inbox";
import { WorkReminders } from "@/components/work/reminders";
import { CalculatorContinuation } from "@/components/jobs/calculator-continuation";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { resolveDashboardRange } from "@/lib/dashboard/range";
import { getDashboardOverview } from "@/lib/dashboard/service";
import { requireCompletedViewer } from "@/lib/viewer";
import { getBillingSummary } from "@/lib/billing/service";
import Link from "next/link";

export const metadata = { title: "Ana Sayfa" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ period?: string; start?: string; end?: string }> }) {
  const [viewer, params] = await Promise.all([requireCompletedViewer(), searchParams]);
  const range = resolveDashboardRange(params);
  const [data, billing] = await Promise.all([getDashboardOverview(range), getBillingSummary(viewer.business!.id)]);
  const quoteLimit = billing.plan.limits.monthly_quotes;
  const needsEntry = quoteLimit === 0;
  return <><FirstQuoteGuide/><CalculatorContinuation /><NotificationInbox/><WorkReminders />{needsEntry && <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-[#f1d9a8] bg-[#fffaf0] px-5 py-4 text-[13px]"><p><span className="font-semibold">Teklif hazırlamak için usta üyeliği gerekir.</span> 199 ₺, tek seferlik ve süresiz.</p><Link href="/billing" className="font-semibold text-[#006aca]">Üyeliği başlat →</Link></div>}<DashboardContent data={data} range={range} businessName={viewer.business!.name} firstName={viewer.profile?.first_name || "Usta"} advancedReports={billing.plan.features.advanced_reports} canViewActualProfit={billing.plan.features.actual_profit} /></>;
}
