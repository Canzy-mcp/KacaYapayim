import Link from "next/link";
import { notFound } from "next/navigation";
import { marketOfferLabels, marketStateLabels, validMarketId, type MarketAction, type MarketDetail, type MarketMessage } from "@kacayapayim/core/marketplace";
import { requireViewer } from "@/lib/viewer";
import { marketDirectory, marketPage, marketRead } from "@/lib/marketplace/service";
import { MarketForm } from "@/components/marketplace/form";
import { RefreshMarketDetail } from "@/components/marketplace/refresh";
import { input, marketDate, MarketEmpty, MarketHeading, MarketPagination, money, panel, plainButton } from "@/components/marketplace/ui";

export const metadata = { title: "Hizmet Talebi" };

function OfferSection({ detail }: { detail: MarketDetail }) {
  const { request, is_customer, provider_suspended, offers } = detail;
  const ownOffer = offers[0];
  return <section className={panel}>
    <h2 className="mb-3 text-xl font-bold">{is_customer ? "Gelen teklifler" : "Teklifin"}</h2>
    {offers.length ? <div className="grid gap-3">{offers.map((offer) => <article key={offer.id} className="rounded-xl border border-[#e0e5ee] p-4">
      <div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold">{offer.display_name}</h3><p className="font-bold">{money.format(offer.amount)}</p></div>
      <p className="mt-1 text-xs font-semibold text-[#075fc7]">{marketOfferLabels[offer.state]}</p>
      <p className="mt-3 whitespace-pre-wrap break-words text-sm text-slate-700">{offer.scope}</p>
      {is_customer && request.state === "open" && offer.state === "active" && <details className="mt-3">
        <summary className="cursor-pointer text-sm font-semibold text-[#075fc7]">Bu teklifi kabul et</summary>
        <p className="my-2 text-sm text-slate-700">{offer.display_name} adlı ustanın {money.format(offer.amount)} tutarındaki teklifini seçiyorsun.</p>
        <MarketForm action="award" fields={{ id: request.id, offer: offer.id, version: offer.updated_at }} label="Kabulü onayla" inline />
      </details>}
    </article>)}</div> : <p className="text-sm text-slate-600">Henüz teklif yok.</p>}
    {!is_customer && !provider_suspended && request.state === "open" && <div className="mt-5 border-t border-[#e0e5ee] pt-4">
      <MarketForm action="offer" fields={{ id: request.id }} label={ownOffer?.state === "active" ? "Teklifi güncelle" : "Teklif gönder"}>
        <label className="grid gap-1 text-sm font-medium">Toplam fiyat (₺)<input type="number" min="0.01" max="9999999999.99" step="0.01" name="amount" className={input} defaultValue={ownOffer?.amount} required /></label>
        <label className="grid gap-1 text-sm font-medium">İş kapsamı ve koşullar<textarea name="body" className={input} rows={4} minLength={5} maxLength={1600} defaultValue={ownOffer?.scope} required /></label>
      </MarketForm>
      {ownOffer?.state === "active" && <div className="mt-3"><MarketForm action="withdraw" fields={{ id: request.id }} label="Teklifi geri çek" inline subtle /></div>}
    </div>}
  </section>;
}

function WorkSection({ detail }: { detail: MarketDetail }) {
  const { request: req, is_customer, provider_id, winner_name } = detail;
  const winner = req.winner_id != null && req.winner_id === provider_id;
  const controls: { action: MarketAction; label: string; subtle?: boolean }[] = [];
  if (is_customer && ["open", "awarded"].includes(req.state) || winner && req.state === "awarded") controls.push({ action: "cancel", label: "Talebi iptal et", subtle: true });
  if (!is_customer && req.target_id === provider_id && req.is_direct && req.state === "open") controls.push({ action: "decline", label: "Çağrıyı reddet", subtle: true });
  if (winner && req.state === "awarded" && (!req.appointment_at || req.appointment_confirmed)) controls.push({ action: "start", label: "İşe başla" });
  if (winner && req.state === "in_progress") controls.push({ action: "finish", label: "Tamamlandığını bildir" });
  if (is_customer && req.state === "awaiting_completion") controls.push({ action: "complete", label: "İşi tamamlandı olarak onayla" }, { action: "reopen", label: "İş yeniden açılsın", subtle: true });
  const maySchedule = (is_customer || winner) && req.state === "awarded" && !!req.winner_id;
  const mayShare = is_customer && ["awarded", "in_progress"].includes(req.state) && !!req.winner_id;
  return <section className={panel}>
    <h2 className="text-xl font-bold">İş ve randevu</h2>
    <p className="mt-2 text-sm text-slate-700">{marketStateLabels[req.state]}{winner_name && ` · ${winner_name}`}</p>
    {req.appointment_at && <p className="mt-3 rounded-xl bg-[#edf4ff] p-3 text-sm">{marketDate(req.appointment_at)} · {req.appointment_confirmed ? "Randevu onaylandı" : "Randevu onayı bekleniyor"}</p>}
    {req.appointment_confirmed && req.state !== "cancelled" && (is_customer || winner) &&
      <a href={`/talepler/${req.id}/randevu`} className={`mt-2 ${plainButton}`}>Takvime ekle (.ics)</a>}
    {maySchedule && <div className="mt-4 grid gap-3">
      {req.appointment_at && !req.appointment_confirmed && req.appointment_proposer !== (is_customer ? "customer" : "provider") &&
        <MarketForm action="confirm_appointment" fields={{ id: req.id, version: req.appointment_at }} label="Randevuyu onayla" inline />}
      <MarketForm action="appointment" fields={{ id: req.id }} label={req.appointment_at ? "Yeni saat öner" : "Randevu öner"} subtle>
        <label className="grid gap-1 text-sm font-medium">Gün ve saat (Türkiye saati)<input type="datetime-local" name="at" className={input} required /></label>
      </MarketForm>
    </div>}
    {mayShare && <div className="mt-5 border-t border-[#e0e5ee] pt-4">
      <MarketForm action="address" fields={{ id: req.id }} label="Adres paylaşımını kaydet" subtle>
        <label className="grid gap-1 text-sm">Açık adres<textarea name="body" className={input} maxLength={500} defaultValue={req.address ?? ""} /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="share" defaultChecked={req.address_shared} /> Seçtiğim ustayla paylaş</label>
      </MarketForm>
    </div>}
    {winner && req.address && <p className="mt-4 break-words rounded-xl bg-[#edf4ff] p-3 text-sm">Müşterinin paylaştığı adres · {req.address}</p>}
    {req.job_id && <Link className={`mt-4 ${plainButton}`} href={`/jobs/${req.job_id}`}>Usta panelinde işi aç</Link>}
    {controls.length > 0 && <div className="mt-5 flex flex-wrap gap-2">{controls.map((control) => <MarketForm key={control.action} {...control} fields={{ id: req.id }} inline />)}</div>}
  </section>;
}

function MessageSection({ detail, messages, page }: { detail: MarketDetail; messages: MarketMessage[]; page: number }) {
  const { request: req, is_customer, provider_id, provider_suspended, target_name, winner_name, offers } = detail;
  const open = req.state === "open";
  const working = ["awarded", "in_progress", "awaiting_completion"].includes(req.state);
  const threads = new Map<string, string>();
  if (open && req.target_id && target_name) threads.set(req.target_id, target_name);
  if (open) offers.filter((offer) => offer.state === "active").forEach((offer) => threads.set(offer.provider_id, offer.display_name));
  if (working && req.winner_id && winner_name) threads.set(req.winner_id, winner_name);
  if (!is_customer) for (const key of threads.keys()) if (key !== provider_id || provider_suspended) threads.delete(key);
  return <section className={panel}>
    <h2 className="mb-3 text-xl font-bold">Mesajlar</h2>
    {messages.length > 0 ? <ol className="mb-4 grid gap-2">{messages.slice(0, 50).reverse().map((message) =>
      <li key={message.id} className={`rounded-xl p-3 text-sm ${message.sender === "customer" ? "bg-[#f2f4f8]" : "bg-[#edf4ff]"}`}>
        <p className="text-xs font-semibold text-slate-700">{message.sender === "customer" ? `Müşteri → ${message.display_name}` : message.display_name} · {marketDate(message.created_at)}</p>
        <p className="mt-1 whitespace-pre-wrap break-words">{message.body}</p>
      </li>)}</ol> : <p className="mb-4 text-sm text-slate-600">Henüz mesaj yok.</p>}
    {[...threads].map(([id, name]) => <details className="my-2 rounded-xl border border-[#e0e5ee] p-3" key={id} open={threads.size === 1}>
      <summary className="cursor-pointer text-sm font-semibold">{is_customer ? `${name} ile yazış` : "Müşteriye yaz"}</summary>
      <div className="mt-3"><MarketForm action="message" fields={{ id: req.id, provider: id }} label="Mesaj gönder" success="Mesaj gönderildi.">
        <label className="grid gap-1 text-sm">Mesaj<textarea name="body" className={input} required maxLength={1600} /></label>
      </MarketForm></div></details>)}
    <MarketPagination page={page} more={messages.length > 50} href={(next) => `/talepler/${req.id}?mesaj=${next}#mesajlar`} />
  </section>;
}

export default async function MarketRequestDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ mesaj?: string }> }) {
  await requireViewer();
  const { id } = await params;
  if (!validMarketId(id)) notFound();
  const page = marketPage((await searchParams).mesaj);
  const [detail, directory] = await Promise.all([marketRead("detail", 1, id), marketDirectory()]);
  if (!detail) notFound();
  const messages = await marketRead("thread", page, id);
  const req = detail.request;
  return <>
    {!["completed", "cancelled"].includes(req.state) && <RefreshMarketDetail />}
    <Link href={detail.is_customer ? "/talepler" : "/usta-talepleri"} className="mb-4 inline-block text-sm font-semibold text-[#075fc7]">← {detail.is_customer ? "Taleplerim" : "Usta talepleri"}</Link>
    <MarketHeading title={req.title} description={`${req.district}, ${req.city} · ${marketStateLabels[req.state]}`}>
      {detail.is_customer && req.state === "open" && !req.is_direct && !detail.offers.length && <Link href={`/talepler/${id}/duzenle`} className={plainButton}>İlanı düzenle</Link>}
    </MarketHeading>
    <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
      <div className="grid content-start gap-4">
        <section className={panel}>
          <h2 className="text-xl font-bold">İşin kapsamı</h2>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium text-slate-600">
            <span>{directory?.categories.find((c) => c.slug === req.category)?.name}</span>
            {req.is_direct && <span>Doğrudan çağrı{detail.target_name && ` · ${detail.target_name}`}</span>}
            {req.preferred_date && <span>Tercih · {marketDate(req.preferred_date)}</span>}
            {req.budget != null && <span>Bütçe · {money.format(req.budget)}</span>}
          </div>
          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{req.description}</p>
        </section>
        <OfferSection detail={detail} />
        <div id="mesajlar"><MessageSection detail={detail} messages={messages} page={page} /></div>
      </div>
      <div className="grid content-start gap-4">
        <WorkSection detail={detail} />
        {detail.is_customer && req.state === "completed" && req.winner_id && (detail.has_review ? <MarketEmpty>Bu iş için değerlendirme gönderdin.</MarketEmpty> :
          <section className={panel}><h2 className="mb-3 text-lg font-bold">Ustayı değerlendir</h2><MarketForm action="review" fields={{ id }} label="Değerlendirmeyi yayımla">
            <label className="grid gap-1 text-sm">Puan<select name="rating" className={input} required defaultValue=""><option value="" disabled>Puan seç</option>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} / 5</option>)}</select></label>
            <label className="grid gap-1 text-sm">Deneyimin<textarea name="body" className={input} minLength={5} maxLength={1000} required /></label>
          </MarketForm></section>)}
        <details className={panel}><summary className="cursor-pointer text-sm font-semibold">Bu talebi bildir</summary>
          <div className="mt-3"><MarketForm action="report" fields={{ id }} label="Bildirimi gönder" success="Bildirimin incelemeye alındı.">
            <label className="grid gap-1 text-sm">Bildirim nedeni<textarea name="body" className={input} minLength={5} maxLength={1200} required /></label>
          </MarketForm></div>
        </details>
      </div>
    </div>
  </>;
}
