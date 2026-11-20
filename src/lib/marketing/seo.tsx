import type { Metadata } from "next";
import { supportEmail } from "./contact";

const productionLike = process.env.DEPLOYMENT_ENV === "production" || process.env.VERCEL_ENV === "production";

// Production must never fall back to localhost canonicals.
export function resolveSiteOrigin(env: Record<string, string | undefined> = process.env): string {
  const raw = env.APP_URL?.trim();
  const prod = env.DEPLOYMENT_ENV === "production" || env.VERCEL_ENV === "production";
  if (!raw) {
    if (prod) throw new Error("APP_URL yapılandırması eksik.");
    return "http://localhost:3005";
  }
  const url = new URL(raw);
  if (prod && (url.protocol !== "https:" || ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))) {
    throw new Error("APP_URL production için herkese açık bir https adresi olmalı.");
  }
  return url.origin;
}

export const siteOrigin = resolveSiteOrigin();
export const isStaging = process.env.DEPLOYMENT_ENV === "staging";
export const isProductionLike = productionLike;

export const siteName = "KaçaYapayım";
export const siteSummary = "KaçaYapayım, Türkiye'de usta bulmayı ve ustaların maliyete dayalı teklif hazırlamasını kolaylaştıran bir platformdur.";

type MetaOptions = { type?: "website" | "article"; publishedTime?: string; modifiedTime?: string };

export function siteMetadata(title: string, description: string, path: string, options: MetaOptions = {}): Metadata {
  const image = `${siteOrigin}/api/og?${new URLSearchParams({ title, description }).toString()}`;
  const url = `${siteOrigin}${path}`;
  const article = options.type === "article";
  return {
    title, description,
    alternates: { canonical: url, languages: { "tr-TR": url, "x-default": url } },
    openGraph: {
      type: article ? "article" : "website", siteName, title, description, url, locale: "tr_TR",
      ...(article ? { publishedTime: options.publishedTime, modifiedTime: options.modifiedTime } : {}),
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
    ...(isStaging ? { robots: { index: false, follow: false } } : {}),
  };
}

export function JsonLd({ data }: { data: object | object[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export const organizationId = `${siteOrigin}/#organization`;
export const websiteId = `${siteOrigin}/#website`;

export function organizationNode() {
  return {
    "@type": "Organization", "@id": organizationId, name: siteName, url: siteOrigin,
    logo: `${siteOrigin}/brand/logo.png`, description: siteSummary,
    contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || supportEmail, availableLanguage: "tr", areaServed: "TR" },
  };
}

export function websiteNode() {
  return {
    "@type": "WebSite", "@id": websiteId, name: siteName, url: siteOrigin, inLanguage: "tr-TR", publisher: { "@id": organizationId },
    potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: `${siteOrigin}/usta-bul?q={search_term_string}` }, "query-input": "required name=search_term_string" },
  };
}

export function graph(...nodes: object[]) {
  return { "@context": "https://schema.org", "@graph": [organizationNode(), websiteNode(), ...nodes] };
}

export function breadcrumbNode(items: { name: string; path: string }[]) {
  const last = items[items.length - 1];
  return { "@type": "BreadcrumbList", "@id": `${siteOrigin}${last.path}#breadcrumb`, itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, item: `${siteOrigin}${item.path}` })) };
}

export function breadcrumbs(items: { name: string; path: string }[]) {
  return { "@context": "https://schema.org", ...breadcrumbNode(items) };
}

export function webPageNode(o: { path: string; name: string; description: string; type?: string; hasBreadcrumb?: boolean }) {
  const url = `${siteOrigin}${o.path}`;
  return {
    "@type": o.type ?? "WebPage", "@id": `${url}#webpage`, url, name: o.name, description: o.description, inLanguage: "tr-TR",
    isPartOf: { "@id": websiteId }, publisher: { "@id": organizationId },
    ...(o.hasBreadcrumb === false ? {} : { breadcrumb: { "@id": `${url}#breadcrumb` } }),
  };
}

export function faqNode(path: string, items: readonly (readonly [string, string])[]) {
  return {
    "@type": "FAQPage", "@id": `${siteOrigin}${path}#faq`, inLanguage: "tr-TR",
    mainEntity: items.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
}
