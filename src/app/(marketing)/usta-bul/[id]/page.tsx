import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Star } from "lucide-react";
import { validMarketId } from "@kacayapayim/core/marketplace";
import { marketDirectory, marketRead } from "@/lib/marketplace/service";
import { getViewer } from "@/lib/viewer";
import { MarketForm } from "@/components/marketplace/form";
import { input, linkButton, marketDate, MarketEmpty, MarketHeading, panel } from "@/components/marketplace/ui";

export const metadata = { title: "Usta Profili" };

export default async function ProviderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!validMarketId(id)) notFound();
  const directory = await marketDirectory({ id });
  const provider = directory?.providers[0];
  if (!directory || !provider) notFound();
  const viewer = await getViewer();
  const favorite = viewer && await marketRead("favorite", 1, id);
  const request = `/talepler/yeni?usta=${id}`;
  return <div className="mx-auto max-w-4xl px-5 py-9 text-[#112046] sm:py-12">
    <Link href="/usta-bul" className="mb-5 inline-block text-sm font-semibold text-[#075fc7]">← Usta rehberi</Link>
    <MarketHeading title={provider.display_name}>
      <div className="flex flex-wrap gap-2"><Link href={request} className={linkButton}>Ustaya Çağrı Gönder</Link>
        {viewer && <MarketForm action={favorite ? "unfavorite" : "favorite"} fields={{ provider: id }} label={favorite ? "Favorilerden çıkar" : "Favoriye ekle"} inline subtle />}</div>
    </MarketHeading>
    <div className="grid gap-4 sm:grid-cols-[1.5fr_1fr]"><section className={panel}>
      <h2 className="text-lg font-bold">Usta hakkında</h2><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{provider.bio || "Usta henüz tanıtım yazısı eklemedi."}</p>
      <h3 className="mt-5 text-sm font-semibold">Hizmetler</h3><p className="mt-2 text-sm text-slate-700">{directory.categories.filter((c) => provider.categories.includes(c.slug)).map((c) => c.name).join(", ")}</p>
    </section><section className={panel}><h2 className="flex items-center gap-2 text-lg font-bold"><MapPin size={19} /> Hizmet bölgesi</h2>
      <p className="mt-2 text-sm text-slate-700">{provider.city} · {provider.districts.length ? provider.districts.join(", ") : "Tüm ilçeler"}</p>
      {provider.rating != null && <p className="mt-4 flex items-center gap-2 text-sm text-slate-700"><Star className="fill-amber-400 text-amber-500" size={17} /> {provider.rating} / 5 · {provider.review_count} değerlendirme</p>}
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
