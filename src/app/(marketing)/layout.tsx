import { AnalyticsConsent } from "@/components/marketing/analytics-consent";
import { MarketingHeader, MarketingFooter } from "@/components/marketing/shell";
import { MarketingTracker } from "@/components/marketing/tracker";
import { Suspense } from "react";
import { MarketingMotion } from "@/components/marketing/motion";
import "./marketing.css";
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <div className="public-marketing min-h-screen bg-[#f5f5f7] text-[#1d1d1f]"><MarketingMotion/>{process.env.ANALYTICS_ENABLED === "true" && <Suspense fallback={null}><MarketingTracker/><AnalyticsConsent/></Suspense>}<MarketingHeader/><main id="main-content">{children}</main><MarketingFooter/></div>;
}
