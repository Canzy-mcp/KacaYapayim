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
// People search the brand as two words; say so explicitly so Google ties "kaça yapayım" to the site.
export const brandAlternateNames = ["Kaça Yapayım", "Kaca Yapayim", "kacayapayim.com"];
export const siteSummary = "KaçaYapayım (Kaça Yapayım), Türkiye'de usta bulmayı ve ustaların maliyete dayalı teklif hazırlamasını kolaylaştıran bir platformdur.";

export type OgImageKey = "hero" | "painter" | "electrician" | "plumber" | "hvac" | "tadilat" | "teklif" | "randevu";
type MetaOptions = { type?: "website" | "article"; publishedTime?: string; modifiedTime?: string; image?: OgImageKey };

// Default photo per section so every page gets a relevant OG image without each page choosing one.
const ogImageByPath: [string, OgImageKey][] = [
  ["/meslekler/boyaci", "painter"], ["/meslekler/elektrikci", "electrician"], ["/meslekler/tesisatci", "plumber"], ["/meslekler/klimaci", "hvac"],
  ["/usta-bul", "randevu"], ["/ustalar-icin", "teklif"], ["/guvenli-hizmet", "randevu"], ["/nasil-calisir", "hero"], ["/hesaplama-araclari", "teklif"], ["/rehber", "tadilat"],
];

export function ogImageUrl(title: string, description: string, path = "/", image?: OgImageKey) {
  const key = image ?? ogImageByPath.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`))?.[1] ?? "hero";
  return `${siteOrigin}/api/og?${new URLSearchParams({ title, description, image: key }).toString()}`;
}

export function siteMetadata(title: string, description: string, path: string, options: MetaOptions = {}): Metadata {
  const image = ogImageUrl(title, description, path, options.image);
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

export const organizationKnowsAbout = ["ev hizmetleri", "boya badana", "elektrik", "su tesisatı", "klima", "tadilat", "maliyet hesaplama", "teklif hazırlama"];

export function imageObjectNode(o: { url: string; width: number; height: number; caption?: string; id?: string }) {
  const url = o.url.startsWith("http") ? o.url : `${siteOrigin}${o.url}`;
  return { "@type": "ImageObject", ...(o.id ? { "@id": o.id } : {}), url, contentUrl: url, width: o.width, height: o.height, ...(o.caption ? { caption: o.caption } : {}) };
}

// No postal address, founding date or social profiles are published anywhere in the repo, so none are claimed here.
export function organizationNode() {
  return {
    "@type": "Organization", "@id": organizationId, name: siteName, alternateName: brandAlternateNames, url: siteOrigin,
    logo: imageObjectNode({ id: `${siteOrigin}/#logo`, url: "/brand/logo.png", width: 256, height: 256, caption: `${siteName} logosu` }),
    description: siteSummary, slogan: "İşinin maliyetini bil. Kârını koru.",
    knowsAbout: organizationKnowsAbout, areaServed: { "@type": "Country", name: "Türkiye" },
    contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || supportEmail, availableLanguage: "tr", areaServed: "TR" },
  };
}

export function websiteNode() {
  return {
    "@type": "WebSite", "@id": websiteId, name: siteName, alternateName: brandAlternateNames, url: siteOrigin, inLanguage: "tr-TR", publisher: { "@id": organizationId },
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

export function itemListNode(o: { path: string; name: string; items: readonly { name: string; path: string }[] }) {
  return {
    "@type": "ItemList", "@id": `${siteOrigin}${o.path}#list`, name: o.name, numberOfItems: o.items.length,
    itemListElement: o.items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, url: `${siteOrigin}${item.path}` })),
  };
}

export function collectionPageNode(o: { path: string; name: string; description: string; listPath?: string }) {
  return { ...webPageNode({ path: o.path, name: o.name, description: o.description, type: "CollectionPage" }), ...(o.listPath ? { mainEntity: { "@id": `${siteOrigin}${o.listPath}#list` } } : {}) };
}

export function howToNode(o: { path: string; name: string; description: string; steps: readonly (readonly [string, string])[] }) {
  return {
    "@type": "HowTo", "@id": `${siteOrigin}${o.path}#howto`, name: o.name, description: o.description, inLanguage: "tr-TR",
    step: o.steps.map(([name, text], i) => ({ "@type": "HowToStep", position: i + 1, name, text })),
  };
}

// KaçaYapayım is a marketplace: the Service node names the platform as brand, never as the provider of the work.
export function serviceNode(o: { path: string; name: string; description: string; serviceType: string }) {
  return {
    "@type": "Service", "@id": `${siteOrigin}${o.path}#service`, name: o.name, description: o.description, serviceType: o.serviceType,
    url: `${siteOrigin}${o.path}`, areaServed: { "@type": "Country", name: "Türkiye" }, inLanguage: "tr-TR", brand: { "@id": organizationId },
  };
}
