import { cache } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, MapPin, ShieldCheck, Star } from "lucide-react";
import { validMarketId } from "@kacayapayim/core/marketplace";
import { marketDirectory, marketRead } from "@/lib/marketplace/service";
import { getViewer } from "@/lib/viewer";
import { MarketForm } from "@/components/marketplace/form";
import { input, linkButton, marketDate, MarketEmpty, panel, plainButton, Rating } from "@/components/marketplace/ui";
import { requestHref, trimDescription } from "@/lib/marketplace/prefill";
import { JsonLd, siteMetadata, siteOrigin } from "@/lib/marketing/seo";

const loadProfile = cache(async (id: string) => marketDirectory({ id }).catch(() => null));

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  if (!validMarketId(id)) return { title: "Usta Profili", robots: { index: false } };
  const directory = await loadProfile(id);
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
  if (!directory) return <div className="mx-auto max-w-4xl px-5 py-12"><MarketEmpty>
    <h1 className="text-lg font-semibold text-[#202923]">Usta profili yüklenemedi.</h1>
    <a href={`/usta-bul/${id}`} className={`mt-3 ${linkButton}`}>Tekrar dene</a>
  </MarketEmpty></div>;
  const provider = directory.providers[0];
  if (!provider) notFound();
  const viewer = await getViewer();
  const favorite = viewer ? await marketRead("favorite", 1, id).catch(() => null) : null;
  const services = directory.categories.filter(({ slug }) => provider.categories.includes(slug));
  const request = requestHref({ usta: provider.id, category: services.length === 1 ? services[0].slug : "" });
  const url = `${siteOrigin}/usta-bul/${provider.id}`;
  const areas = provider.districts.length ? provider.districts : [];
  const reviewCount = provider.review_count ?? 0;
  const jsonLd = {
    "@context": "https://schema.org", "@type": "HomeAndConstructionBusiness", "@id": `${url}#usta`, url, name: provider.display_name,
    ...(provider.bio ? { description: trimDescription(provider.bio, 300) } : {}),
    knowsAbout: services.map(({ name }) => name),
    areaServed: areas.length ? areas.map((district) => ({ "@type": "AdministrativeArea", name: `${district}, ${provider.city}` })) : { "@type": "City", name: provider.city },
    ...(reviewCount > 0 && provider.rating != null ? {
      aggregateRating: { "@type": "AggregateRating", ratingValue: provider.rating, reviewCount, bestRating: 5, worstRating: 1 },
      review: directory.reviews.map((review) => ({ "@type": "Review", reviewRating: { "@type": "Rating", ratingValue: review.rating, bestRating: 5, worstRating: 1 },
        reviewBody: review.body, datePublished: review.created_at.slice(0, 10), author: { "@type": "Person", name: "KaçaYapayım müşterisi" } })),
    } : {}),
  };

  return <div className="bg-[#FAF7F1] text-[#202923]"><div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
    <JsonLd data={jsonLd} />
    <Link href="/usta-bul" className="mb-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#075D54] hover:underline"><ArrowLeft size={17} aria-hidden="true" /> Usta rehberi</Link>
    <header className="mb-5 rounded-2xl border border-[#E7E1D6] bg-white p-6 sm:p-9">
      <div className="flex items-start gap-4">
        <span aria-hidden="true" className="grid size-16 shrink-0 place-items-center rounded-2xl bg-[#E4EFEC] text-lg font-semibold text-[#075D54]">{provider.display_name.slice(0, 2).toLocaleUpperCase("tr-TR")}</span>
        <div className="min-w-0">
          <h1 className="break-words text-3xl font-semibold tracking-tight sm:text-5xl">{provider.display_name}</h1>
          <p className="mt-2 flex items-start gap-2 break-words text-base text-[#5B6460]"><MapPin size={16} aria-hidden="true" className="mt-1 shrink-0" /> <span className="min-w-0">{provider.city} · {areas.length ? areas.join(", ") : "Tüm ilçeler"}</span></p>
          <div className="mt-2"><Rating provider={provider} /></div>
          {services.length > 0 && <ul className="mt-3 flex flex-wrap gap-2">{services.map((service) => <li key={service.slug} className="rounded-full bg-[#F3EEE4] px-3 py-1.5 text-sm font-medium">{service.name}</li>)}</ul>}
        </div>
      </div>
      <div className="mt-6 flex flex-wrap items-start gap-2"><Link href={request} className={linkButton}>Bu ustadan teklif iste <ArrowRight size={17} aria-hidden="true" /></Link>
        <Link href={`/usta-bul/karsilastir?ids=${provider.id}`} className={plainButton}>Karşılaştırmaya ekle</Link>
        {favorite !== null && <MarketForm action={favorite ? "unfavorite" : "favorite"} fields={{ provider: id }} label={favorite ? "Favorilerden çıkar" : "Favoriye ekle"} inline subtle />}</div>
    </header>
    <div className="grid gap-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <section className={panel}>
        <h2 className="text-xl font-semibold">Usta hakkında</h2><p className="mt-2 whitespace-pre-wrap break-words text-base leading-7 text-[#3B4540]">{provider.bio || "Usta henüz tanıtım yazısı eklemedi."}</p>
      </section>
      <section className={panel}><h2 className="text-xl font-semibold">Hizmet bölgesi</h2>
        <p className="mt-2 break-words text-base leading-7 text-[#3B4540]">{provider.city}</p>
        <p className="break-words text-base leading-7 text-[#3B4540]">{areas.length ? areas.join(", ") : "Tüm ilçeler"}</p>
      </section>
    </div>
    <section className="mt-8" aria-labelledby="reviews-title">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <h2 id="reviews-title" className="text-2xl font-semibold">Müşteri değerlendirmeleri</h2>
        {reviewCount > 0 && provider.rating != null && <p className="flex items-center gap-1.5 text-base font-semibold"><Star size={18} className="fill-[#C98A2B] text-[#C98A2B]" aria-hidden="true" />{provider.rating.toLocaleString("tr-TR")} / 5 <span className="font-normal text-[#5B6460]">· {reviewCount} değerlendirme</span></p>}
      </div>
      <p className="mb-4 flex items-start gap-2 rounded-xl bg-[#E4EFEC] px-4 py-3 text-sm text-[#064A43]"><ShieldCheck size={17} className="mt-0.5 shrink-0" aria-hidden="true" />Yalnızca tamamlanan işlerden sonra müşterinin bıraktığı değerlendirmeler gösterilir.</p>
      {directory.reviews.length ? <div className="grid gap-3">{directory.reviews.map((review, index) => <article className={panel} key={`${review.created_at}-${index}`}>
        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold"><span className="inline-flex items-center gap-1"><Star size={15} className="fill-[#C98A2B] text-[#C98A2B]" aria-hidden="true" />{review.rating} / 5</span><span className="font-normal text-[#5B6460]">· {marketDate(review.created_at)}</span></p>
        <p className="mt-2 whitespace-pre-wrap break-words text-base leading-relaxed text-[#3B4540]">{review.body}</p>
      </article>)}</div> : <MarketEmpty>Bu ustanın henüz değerlendirmesi yok.</MarketEmpty>}
    </section>
    {viewer && <details className={`mt-6 ${panel}`}><summary className="cursor-pointer text-sm font-semibold">Profili bildir</summary><div className="mt-3"><MarketForm action="report" fields={{ provider: id }} label="Bildirimi gönder" success="Bildirimin incelemeye alındı.">
      <label className="grid gap-1 text-sm">Bildirim nedeni<textarea className={input} name="body" required minLength={5} maxLength={1200} /></label>
    </MarketForm></div></details>}
  </div></div>;
}
