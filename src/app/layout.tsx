import type { Metadata } from "next";
import { AnalyticsConsent } from "@/components/marketing/analytics-consent";
import { GoogleAnalytics } from "@/components/marketing/google-analytics";
import { headers } from "next/headers";
import Script from "next/script";
import { Inter } from "next/font/google";
import { siteOrigin, siteSummary } from "@/lib/marketing/seo";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext"], display: "swap", variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: { default: "KaçaYapayım | İşini doğru fiyatlandır", template: "%s | KaçaYapayım" },
  description: siteSummary,
  openGraph: { siteName: "KaçaYapayım", locale: "tr_TR", type: "website", images: [{ url: `${siteOrigin}/api/og?image=hero`, width: 1200, height: 630, alt: "KaçaYapayım" }] },
  twitter: { card: "summary_large_image", images: [`${siteOrigin}/api/og?image=hero`] },
  applicationName: "KaçaYapayım",
  category: "business",
  formatDetection: { telephone: false, email: false, address: false },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "5YHiKGyRlhZoPmBvxTmYVWfHZypE79zmrB3wgaJmciI",
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } : undefined,
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return <html lang="tr" className={inter.variable}><body><GoogleAnalytics/><AnalyticsConsent/>{children}
    <Script id="google-tag-consent-default" strategy="beforeInteractive" nonce={nonce}>{`
      window.dataLayer = window.dataLayer || [];
      function gtag(){window.dataLayer.push(arguments);}
      gtag('consent', 'default', {analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'});
      gtag('js', new Date());
      gtag('config', 'G-T73M9QZQ5J', {send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false});
    `}</Script>
    <Script src="https://www.googletagmanager.com/gtag/js?id=G-T73M9QZQ5J" strategy="beforeInteractive" nonce={nonce} />
  </body></html>;
}
