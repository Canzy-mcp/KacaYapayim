import type { Metadata } from "next";
import { AnalyticsConsent } from "@/components/marketing/analytics-consent";
import { GoogleAnalytics } from "@/components/marketing/google-analytics";
import "./globals.css";

const siteUrl = process.env.APP_URL || "http://localhost:3005";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "KaçaYapayım | İşini doğru fiyatlandır", template: "%s | KaçaYapayım" },
  description: "Kendi maliyetlerini hesapla, hedef kârını gör ve müşterine profesyonel teklif gönder.",
  applicationName: "KaçaYapayım",
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "5YHiKGyRlhZoPmBvxTmYVWfHZypE79zmrB3wgaJmciI",
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } : undefined,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body><GoogleAnalytics/><AnalyticsConsent/>{children}</body></html>;
}
