import { cache } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, MapPin, ShieldCheck, Star } from "lucide-react";
import { validMarketId } from "@kacayapayim/core/marketplace";
import { marketDirectory, marketRead } from "@/lib/marketplace/service";
import { getViewer } from "@/lib/viewer";
import { MarketForm } from "@/components/marketplace/form";
import { Avatar, input, linkButton, marketDate, MarketEmpty, panel, plainButton, Rating } from "@/components/marketplace/ui";
import { directoryHref, requestHref, trimDescription } from "@/lib/marketplace/prefill";
import { JsonLd, organizationId, siteMetadata, siteOrigin, websiteId } from "@/lib/marketing/seo";

// No catch: an outage must reach error.tsx (500). Only a successful empty result is a 404.
const loadProfile = cache(async (id: string) => {
  const directory = await marketDirectory({ id });
  if (!directory) throw new Error("Usta profili yüklenemedi.");
  return directory;
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  if (!validMarketId(id)) return { title: "Usta Profili", robots: { index: false } };
  const directory = await loadProfile(id).catch(() => null);
  const provider = directory?.providers[0];
  if (!directory || !provider) return { title: "Usta Profili", robots: { index: false, follow: false } };
  const services = directory.categories.filter(({ slug }) => provider.categories.includes(slug)).map(({ name }) => name);
  const trade = services.length ? services.slice(0, 3).join(", ").toLocaleLowerCase("tr-TR") : "hizmet";
  const title = `${provider.display_name} – ${trade} ustası, ${provider.city}`;
  const description = trimDescription(provider.bio || `${provider.display_name}, ${provider.city} bölgesinde ${trade} hizmeti veriyor. Profili incele, bu ustadan teklif iste.`);
  return siteMetadata(title, description, `/usta-bul/${provider.id}`);
}

export default async function ProviderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!validMarketId(id)) notFound();
  const directory = await loadProfile(id);
  const provider = directory.providers[0];
  if (!provider) notFound();
  const viewer = await getViewer();
  const favorite = viewer ? await marketRead("favorite", 1, id).catch(() => null) : null;
  const services = directory.categories.filter(({ slug }) => provider.categories.includes(slug));
  const request = requestHref({ usta: provider.id, category: services.length === 1 ? services[0].slug : "" });
  const url = `${siteOrigin}/usta-bul/${provider.id}`;
  const areas = provider.districts.length ? provider.districts : [];
  const reviewCount = provider.review_count ?? 0;
  const business = `${url}#business`;
  const jsonLd = [
    {
      "@context": "https://schema.org", "@type": "ProfilePage", "@id": `${url}#webpage`, url, name: `${provider.display_name} usta profili`, inLanguage: "tr-TR",
      isPartOf: { "@id": websiteId }, publisher: { "@id": organizationId }, mainEntity: { "@id": business },
    },
    {
      // The usta is the business. KaçaYapayım only publishes the page and is never named as the service provider.
      "@context": "https://schema.org", "@type": "HomeAndConstructionBusiness", "@id": business, url, name: provider.display_name,
      ...(provider.bio ? { description: trimDescription(provider.bio, 300) } : {}),
      knowsAbout: services.map(({ name }) => name),
      areaServed: areas.length ? areas.map((district) => ({ "@type": "AdministrativeArea", name: `${district}, ${provider.city}` })) : { "@type": "City", name: provider.city },
      ...(reviewCount > 0 && provider.rating != null ? {
        aggregateRating: { "@type": "AggregateRating", ratingValue: provider.rating, reviewCount, bestRating: 5, worstRating: 1 },
        review: directory.reviews.map((review) => ({ "@type": "Review", reviewRating: { "@type": "Rating", ratingValue: review.rating, bestRating: 5, worstRating: 1 },
          reviewBody: review.body, datePublished: review.created_at.slice(0, 10), author: { "@type": "Person", name: "KaçaYapayım müşterisi" } })),
      } : {}),
    },
  ];

  return <div className="bg-canvas text-ink">
    <JsonLd data={jsonLd} />
    <div className="sticky top-14 z-30 border-b border-line-strong bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex min-h-14 max-w-[1180px] items-center justify-between gap-3 px-5 sm:px-8">
        <Link href="/usta-bul" className="inline-flex min-h-11 shrink-0 items-center gap-1.5 text-sm font-semibold text-primary hover:underline"><ArrowLeft size={17} aria-hidden="true" /> <span className="hidden sm:inline">Usta rehberi</span><span className="sm:hidden">Geri</span></Link>
        <p className="min-w-0 flex-1 truncate text-center text-sm font-semibold sm:text-left">{provider.display_name}</p>
        <Link href={request} className={`${linkButton} shrink-0`}>Teklif iste</Link>
      </div>
    </div>
    <div className="bg-white"><div className="mx-auto max-w-[1180px] px-5 py-10 sm:px-8 sm:py-16">
      <div className="flex flex-wrap items-start gap-5 sm:gap-6">
        <Avatar name={provider.display_name} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="break-words text-[clamp(2rem,5vw,3.5rem)] font-[650] leading-[1.08] tracking-display">{provider.display_name}</h1>
          <p className="mt-3 flex items-start gap-2 break-words text-base text-ink-2"><MapPin size={16} aria-hidden="true" className="mt-1 shrink-0" /> <span className="min-w-0">{provider.city} · {areas.length ? areas.join(", ") : "Tüm ilçeler"}</span></p>
          <div className="mt-2"><Rating provider={provider} /></div>
          {services.length > 0 && <ul className="mt-4 flex flex-wrap gap-2" aria-label="Hizmetler">{services.map((service) => <li key={service.slug} className="rounded-full bg-canvas px-3.5 py-1.5 text-sm font-medium">{service.name}</li>)}</ul>}
        </div>
      </div>
      <div className="mt-8 flex flex-wrap items-start gap-2"><Link href={request} className={linkButton}>Bu ustadan teklif iste <ArrowRight size={17} aria-hidden="true" /></Link>
        <Link href={directoryHref({}, { compare: [provider.id] })} className={plainButton}>Karşılaştırmaya ekle</Link>
        {favorite !== null && <MarketForm action={favorite ? "unfavorite" : "favorite"} fields={{ provider: id }} label={favorite ? "Favorilerden çıkar" : "Favoriye ekle"} inline subtle />}</div>
    </div></div>
    <div className="mx-auto max-w-[1180px] px-5 py-12 sm:px-8 sm:py-16">
      <div className="grid gap-6 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section className={panel}>
          <h2 className="text-xl font-semibold tracking-heading">Usta hakkında</h2><p className="mt-3 whitespace-pre-wrap break-words text-base leading-7 text-ink-2">{provider.bio || "Usta henüz tanıtım yazısı eklemedi."}</p>
        </section>
        <section className={panel}><h2 className="text-xl font-semibold tracking-heading">Hizmet bölgesi</h2>
          <p className="mt-3 break-words text-base leading-7 text-ink-2">{provider.city}</p>
          <p className="break-words text-base leading-7 text-ink-2">{areas.length ? areas.join(", ") : "Tüm ilçeler"}</p>
        </section>
      </div>
      <section className="mt-12" aria-labelledby="reviews-title">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <h2 id="reviews-title" className="text-[clamp(1.6rem,3vw,2.25rem)] font-semibold tracking-heading">Müşteri değerlendirmeleri</h2>
          {reviewCount > 0 && provider.rating != null && <p className="flex items-center gap-1.5 text-base font-semibold"><Star size={18} className="fill-warning text-warning" aria-hidden="true" />{provider.rating.toLocaleString("tr-TR")} / 5 <span className="font-normal text-ink-2">· {reviewCount} değerlendirme</span></p>}
        </div>
        <p className="mb-5 flex items-start gap-2 rounded-xl bg-primary-soft px-4 py-3 text-sm text-primary-hover"><ShieldCheck size={17} className="mt-0.5 shrink-0" aria-hidden="true" />Yalnızca tamamlanan işlerden sonra müşterinin bıraktığı değerlendirmeler gösterilir.</p>
        {directory.reviews.length ? <div className="grid gap-4">{directory.reviews.map((review, index) => <article className={panel} key={`${review.created_at}-${index}`}>
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold"><span className="inline-flex items-center gap-1"><Star size={15} className="fill-warning text-warning" aria-hidden="true" />{review.rating} / 5</span><span className="font-normal text-ink-2">· {marketDate(review.created_at)}</span></p>
          <p className="mt-2 whitespace-pre-wrap break-words text-base leading-relaxed text-ink-2">{review.body}</p>
        </article>)}</div> : <MarketEmpty>Bu ustanın henüz değerlendirmesi yok. Değerlendirmeler yalnızca iş tamamlandıktan sonra eklenir.</MarketEmpty>}
      </section>
      {viewer && <details className={`mt-8 ${panel}`}><summary className="cursor-pointer text-sm font-semibold">Profili bildir</summary><div className="mt-3"><MarketForm action="report" fields={{ provider: id }} label="Bildirimi gönder" success="Bildirimin incelemeye alındı.">
        <label className="grid gap-1 text-sm">Bildirim nedeni<textarea className={input} name="body" required minLength={5} maxLength={1200} /></label>
      </MarketForm></div></details>}
    </div>
  </div>;
}
