import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, Star } from "lucide-react";
import { validMarketId } from "@kacayapayim/core/marketplace";
import { marketDirectory, marketRead } from "@/lib/marketplace/service";
import { getViewer } from "@/lib/viewer";
import { MarketForm } from "@/components/marketplace/form";
import { input, linkButton, marketDate, MarketEmpty, panel } from "@/components/marketplace/ui";

export const metadata = { title: "Usta Profili" };

export default async function ProviderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!validMarketId(id)) notFound();
  const directory = await marketDirectory({ id }).catch(() => null);
  if (!directory) return <div className="mx-auto max-w-4xl px-5 py-12"><MarketEmpty>
    <h1 className="text-lg font-semibold text-[#1d1d1f]">Usta profili yüklenemedi.</h1>
    <a href={`/usta-bul/${id}`} className={`mt-3 ${linkButton}`}>Tekrar dene</a>
  </MarketEmpty></div>;
  const provider = directory.providers[0];
  if (!provider) notFound();
  const viewer = await getViewer();
  const favorite = viewer ? await marketRead("favorite", 1, id).catch(() => null) : null;
  const services = directory.categories.filter(({ slug }) => provider.categories.includes(slug));
  const request = `/talepler/yeni?usta=${id}`;
  return <div className="mx-auto max-w-5xl px-5 py-8 text-[#1d1d1f] sm:px-8 sm:py-12">
    <Link href="/usta-bul" className="mb-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#075fc7] hover:underline"><ArrowLeft size={17} aria-hidden="true" /> Usta rehberi</Link>
    <header className="mb-5 rounded-[32px] border border-[#e0e7ef] bg-[linear-gradient(130deg,#fff_35%,#eaf4ff)] p-6 sm:p-9">
      <span aria-hidden="true" className="grid size-16 place-items-center rounded-[24px] bg-[#e2efff] text-lg font-semibold text-[#075fc7]">{provider.display_name.slice(0, 2).toLocaleUpperCase("tr-TR")}</span>
      <h1 className="mt-4 break-words text-4xl font-semibold tracking-[-.05em] sm:text-5xl">{provider.display_name}</h1>
      <p className="mt-2 flex items-center gap-2 break-words text-sm font-medium text-slate-700"><MapPin size={16} aria-hidden="true" className="shrink-0" /> <span className="min-w-0">{provider.city}</span></p>
      <div className="mt-5 flex flex-wrap items-start gap-2"><Link href={request} className={linkButton}><CalendarDays size={17} aria-hidden="true" /> Ustaya çağrı gönder</Link>
        {favorite !== null && <MarketForm action={favorite ? "unfavorite" : "favorite"} fields={{ provider: id }} label={favorite ? "Favorilerden çıkar" : "Favoriye ekle"} inline subtle />}</div>
    </header>
    <div className="grid gap-4 sm:grid-cols-[1.5fr_1fr]"><section className={panel}>
      <h2 className="text-lg font-bold">Usta hakkında</h2><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{provider.bio || "Usta henüz tanıtım yazısı eklemedi."}</p>
      {services.length > 0 && <><h3 className="mt-5 text-sm font-semibold">Hizmetler</h3><ul className="mt-2 flex flex-wrap gap-2">{services.map((service) => <li key={service.slug} className="rounded-full bg-[#edf4ff] px-3 py-1.5 text-sm text-[#18335a]">{service.name}</li>)}</ul></>}
    </section><section className={panel}><h2 className="text-lg font-bold">Hizmet bölgesi</h2>
      <p className="mt-2 break-words text-sm leading-6 text-slate-700">{provider.city} · {provider.districts.length ? provider.districts.join(", ") : "Tüm ilçeler"}</p>
      {provider.rating != null && <p className="mt-4 flex items-center gap-2 text-sm text-slate-700"><Star className="shrink-0 fill-amber-400 text-amber-500" aria-hidden="true" size={17} /> {provider.rating.toLocaleString("tr-TR")} / 5 · {provider.review_count} değerlendirme</p>}
    </section></div>
    <section className="mt-7"><h2 className="mb-3 text-xl font-bold">Müşteri değerlendirmeleri</h2>
      {directory.reviews.length ? <div className="grid gap-3">{directory.reviews.map((review, index) => <article className={panel} key={`${review.created_at}-${index}`}>
        <p className="text-sm font-semibold">{review.rating} / 5 · {marketDate(review.created_at)}</p><p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-700">{review.body}</p>
      </article>)}</div> : <MarketEmpty>Bu ustanın henüz değerlendirmesi yok.</MarketEmpty>}
    </section>
    {viewer && <details className={`mt-6 ${panel}`}><summary className="cursor-pointer text-sm font-semibold">Profili bildir</summary><div className="mt-3"><MarketForm action="report" fields={{ provider: id }} label="Bildirimi gönder" success="Bildirimin incelemeye alındı.">
      <label className="grid gap-1 text-sm">Bildirim nedeni<textarea className={input} name="body" required minLength={5} maxLength={1200} /></label>
    </MarketForm></div></details>}
  </div>;
}
