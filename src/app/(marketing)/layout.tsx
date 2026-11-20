import { MarketingHeader, MarketingFooter } from "@/components/marketing/shell";
import { MarketingTracker } from "@/components/marketing/tracker";
import { Suspense } from "react";
import { MarketingMotion } from "@/components/marketing/motion";
import "./marketing.css";
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <div className="public-marketing min-h-screen"><MarketingMotion/>{process.env.ANALYTICS_ENABLED === "true" && <Suspense fallback={null}><MarketingTracker/></Suspense>}<a href="#main-content" className="ky-skip-link">İçeriğe geç</a><MarketingHeader/><main id="main-content" tabIndex={-1} className="scroll-mt-24">{children}</main><MarketingFooter/></div>;
}
