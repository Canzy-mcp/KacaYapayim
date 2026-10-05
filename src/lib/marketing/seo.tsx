import type { Metadata } from "next";

export const siteOrigin = (process.env.APP_URL || "http://localhost:3005").replace(/\/$/, "");
export const isStaging = process.env.DEPLOYMENT_ENV === "staging";

export function siteMetadata(title: string, description: string, path: string): Metadata {
  const image = siteOrigin + '/api/og?' + new URLSearchParams({title,description}).toString();
  const url = `${siteOrigin}${path}`;
  return {
    title, description,
    alternates: { canonical: path },
    openGraph: { type: "website", siteName: "KaçaYapayım", title, description, url, locale: "tr_TR", images: [{ url: image, width: 1200, height: 630, alt: "KaçaYapayım" }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
    ...(isStaging ? { robots: { index: false, follow: false } } : {}),
  };
}

export function JsonLd({ data }: { data: object | object[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export function breadcrumbs(items: { name: string; path: string }[]) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, item: `${siteOrigin}${item.path}` })) };
}
