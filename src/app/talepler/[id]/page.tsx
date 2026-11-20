import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, ClipboardCheck, MessageCircle } from "lucide-react";
import { marketOfferLabels, marketStateLabels, validMarketId, type MarketAction, type MarketDetail, type MarketMessage } from "@kacayapayim/core/marketplace";
import { appointmentBounds } from "@/lib/marketplace/appointment";
import { marketDirectory, marketPage, marketRead, requireMarketViewer } from "@/lib/marketplace/service";
import { MarketForm } from "@/components/marketplace/form";
import { RefreshMarketDetail } from "@/components/marketplace/refresh";
import { RequestTimeline } from "@/components/marketplace/timeline";
import { input, marketDate, MarketEmpty, MarketHeading, MarketPagination, money, panel, plainButton } from "@/components/marketplace/ui";

export const metadata = { title: "Hizmet Talebi" };

function OfferSection({ detail }: { detail: MarketDetail }) {
  const { request, is_customer, provider_suspended, offers } = detail;
  const ownOffer = offers[0];
  return <section className={panel}>
    <h2 className="mb-3 flex flex-wrap items-center gap-2 text-xl font-bold">{is_customer ? "Gelen teklifler" : "Teklifin"}
      {is_customer && offers.length > 0 && <span className="rounded-full bg-[#F3EEE4] px-2.5 py-1 text-xs font-semibold text-[#3B4540]">{offers.length}</span>}
    </h2>
    {is_customer && offers.length > 1 && <div className="mb-4 overflow-x-auto rounded-xl border border-[#E7E1D6]">
      <table className="w-full min-w-[460px] border-collapse text-left text-sm">
        <caption className="sr-only">Gelen tekliflerin karşılaştırması</caption>
        <thead className="bg-[#FAF7F1] text-[#5B6460]"><tr><th scope="col" className="p-3 font-semibold">Usta</th><th scope="col" className="p-3 font-semibold">Fiyat</th><th scope="col" className="p-3 font-semibold">Durum</th><th scope="col" className="p-3 font-semibold">Güncelleme</th></tr></thead>
        <tbody>{offers.map((offer) => {
          const lowest = offer.state === "active" && offer.amount === Math.min(...offers.filter((o) => o.state === "active").map((o) => o.amount));
          return <tr key={offer.id} className="border-t border-[#E7E1D6]">
            <th scope="row" className="p-3 font-semibold"><Link href={`/usta-bul/${offer.provider_id}`} className="break-words hover:underline">{offer.display_name}</Link></th>
            <td className="p-3 font-semibold">{money.format(offer.amount)}{lowest && <span className="ml-2 rounded-full bg-[#E4EFEC] px-2 py-0.5 text-xs font-semibold text-[#075D54]">En düşük</span>}</td>
            <td className="p-3 text-[#3B4540]">{marketOfferLabels[offer.state]}</td>
            <td className="p-3 text-[#5B6460]"><time dateTime={offer.updated_at}>{marketDate(offer.updated_at)}</time></td>
          </tr>;
        })}</tbody>
      </table>
    </div>}
    {offers.length ? <div className="grid gap-3">{offers.map((offer) => <article key={offer.id} className="rounded-xl border border-[#E7E1D6] p-4">
      <div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold">{offer.display_name}</h3><p className="font-bold">{money.format(offer.amount)}</p></div>
      <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#5B6460]"><span className="font-semibold text-[#075D54]">{marketOfferLabels[offer.state]}</span><time dateTime={offer.updated_at}>{marketDate(offer.updated_at)}</time></p>
      <p className="mt-3 whitespace-pre-wrap break-words text-sm text-[#3B4540]">{offer.scope}</p>
      {is_customer && request.state === "open" && offer.state === "active" && <details className="mt-3">
        <summary className="cursor-pointer text-sm font-semibold text-[#075D54]">Bu teklifi kabul et</summary>
        <p className="my-2 text-sm text-[#3B4540]">{offer.display_name} adlı ustanın {money.format(offer.amount)} tutarındaki teklifini seçiyorsun.</p>
        <MarketForm action="award" fields={{ id: request.id, offer: offer.id, version: offer.updated_at }} label="Kabulü onayla" inline />
      </details>}
      {is_customer && <details className="mt-3">
        <summary className="cursor-pointer text-sm font-semibold text-[#3B4540]">Teklifi bildir</summary>
        <div className="mt-3"><MarketForm action="report" fields={{ id: request.id, provider: offer.provider_id }} label="Bildirimi gönder" success="Bildirimin incelemeye alındı.">
          <label className="grid gap-1 text-sm">Bildirim nedeni<textarea name="body" className={input} rows={2} minLength={5} maxLength={1200} required /></label>
        </MarketForm></div>
      </details>}
    </article>)}</div> : <p className="text-sm text-[#5B6460]">{is_customer ? "Henüz teklif gelmedi. Bir usta teklif verdiğinde bildirim alacaksın." : "Henüz teklif göndermedin."}</p>}
    {!is_customer && detail.provider_id && request.state === "open" && (!provider_suspended || ownOffer?.state === "active") && <div className="mt-5 border-t border-[#E7E1D6] pt-4">
      {!provider_suspended &&
      <MarketForm action="offer" fields={{ id: request.id }} label={ownOffer?.state === "active" ? "Teklifi güncelle" : "Teklif gönder"}>
        <label className="grid gap-1 text-sm font-medium">Toplam fiyat (₺)<input type="number" min="0.01" max="9999999999.99" step="0.01" name="amount" className={input} defaultValue={ownOffer?.amount} required /></label>
        <label className="grid gap-1 text-sm font-medium">İş kapsamı ve koşullar<textarea name="body" className={input} rows={4} minLength={5} maxLength={1600} defaultValue={ownOffer?.scope} required /></label>
      </MarketForm>}
      {ownOffer?.state === "active" && <details className="mt-3"><summary className="cursor-pointer text-sm font-semibold text-[#3B4540]">Teklifi geri çek</summary>
        <p className="my-2 text-sm text-[#5B6460]">Müşteri bu teklifi kabul edemez. Talep açık kaldığı sürece yeniden teklif gönderebilirsin.</p>
        <MarketForm action="withdraw" fields={{ id: request.id }} label="Geri çekmeyi onayla" inline subtle />
      </details>}
    </div>}
  </section>;
}

function WorkSection({ detail }: { detail: MarketDetail }) {
  const { request: req, is_customer, provider_id, winner_name } = detail;
  const winner = req.winner_id != null && req.winner_id === provider_id;
  const controls: { action: MarketAction; label: string; explanation?: string; subtle?: boolean }[] = [];
  if ((is_customer && ["open", "awarded"].includes(req.state)) || (winner && req.state === "awarded")) controls.push({ action: "cancel", label: "Talebi iptal et", explanation: "Talep kapanır. Mevcut teklifler üzerinden işlem yapılamaz ve varsa randevu geçersiz olur.", subtle: true });
  if (!is_customer && provider_id && req.target_id === provider_id && req.is_direct && req.state === "open") controls.push({ action: "decline", label: "Çağrıyı reddet", explanation: "Doğrudan çağrı kapanır ve müşteriye bildirim gider.", subtle: true });
  if (winner && req.state === "awarded" && (!req.appointment_at || req.appointment_confirmed)) controls.push({ action: "start", label: "İşe başla" });
  if (winner && req.state === "in_progress") controls.push({ action: "finish", label: "Tamamlandığını bildir" });
  if (is_customer && req.state === "awaiting_completion") controls.push({ action: "complete", label: "İşin tamamlandığını onayla", explanation: "Onaydan sonra talep tamamlanır ve çalıştığın ustayı değerlendirebilirsin." }, { action: "reopen", label: "Ek çalışma iste", explanation: "Talep tekrar devam eden işlere alınır ve ustaya bildirim gider.", subtle: true });
  const maySchedule = (is_customer || winner) && req.state === "awarded" && !!req.winner_id;
  const mayShare = is_customer && ["awarded", "in_progress"].includes(req.state) && !!req.winner_id;
  const mayRevokeAddress = is_customer && req.address_shared && ["awaiting_completion", "completed"].includes(req.state);
  const participant = is_customer || winner;
  const awaitingOwnConfirmation = req.appointment_proposer !== (is_customer ? "customer" : "provider");
  const now = new Date();
  const appointmentExpired = req.appointment_at != null && Date.parse(req.appointment_at) <= now.getTime();
  return <section className={panel}>
    <h2 className="flex items-center gap-2 text-xl font-bold"><ClipboardCheck aria-hidden="true" size={20} className="text-[#075D54]" /> İş ve randevu</h2>
    <p className="mt-2 text-sm text-[#3B4540]">{marketStateLabels[req.state]}{winner_name && ` · ${winner_name}`}</p>
    {is_customer && req.state === "open" && <p className="mt-2 text-sm text-[#5B6460]">Bir teklifi seçtikten sonra ustayla randevu belirleyebilir ve adresini paylaşabilirsin.</p>}
    {req.appointment_at && participant && req.state !== "cancelled" && <div className="mt-3 rounded-xl bg-[#E4EFEC] p-3 text-sm text-[#064A43]">
      <p className="flex items-center gap-2 font-semibold"><CalendarDays aria-hidden="true" size={16} /><time dateTime={req.appointment_at}>{marketDate(req.appointment_at)}</time></p>
      <p className="mt-1">{req.appointment_confirmed ? "Randevu onaylandı" : appointmentExpired ? "Önerilen saat geçti. Yeni bir saat öner." : awaitingOwnConfirmation ? "Onayın bekleniyor" : "Karşı tarafın onayı bekleniyor"}</p>
    </div>}
    {req.appointment_confirmed && req.state !== "cancelled" && participant &&
      <a href={`/talepler/${req.id}/randevu`} className={`mt-2 ${plainButton}`}>Takvime ekle</a>}
    {maySchedule && <div className="mt-4 grid gap-3">
      {req.appointment_at && !req.appointment_confirmed && !appointmentExpired && awaitingOwnConfirmation &&
        <MarketForm action="confirm_appointment" fields={{ id: req.id, version: req.appointment_at }} label="Randevuyu onayla" inline />}
      <details open={!req.appointment_at} className="rounded-xl border border-[#E7E1D6] p-3">
        <summary className="cursor-pointer text-sm font-semibold">{req.appointment_at ? "Yeni saat öner" : "Randevu öner"}</summary>
        <div className="mt-3"><MarketForm action="appointment" fields={{ id: req.id }} label="Randevu önerisini gönder" subtle>
          <label className="grid gap-1 text-sm font-medium">Gün ve saat (Türkiye saati)<input type="datetime-local" name="at" className={input} {...appointmentBounds(now)} required /></label>
          {req.appointment_confirmed && <p className="text-sm text-[#5B6460]">Yeni saat önerdiğinde mevcut randevunun onayı kalkar.</p>}
        </MarketForm></div>
      </details>
    </div>}
    {mayShare && <details className="mt-5 border-t border-[#E7E1D6] pt-4">
      <summary className="cursor-pointer text-sm font-semibold">Adres paylaşımı <span className="ml-1 font-normal text-[#5B6460]">· {req.address_shared ? "Ustayla paylaşılıyor" : "Özel"}</span></summary>
      <div className="mt-3"><MarketForm action="address" fields={{ id: req.id }} label="Adres paylaşımını kaydet" subtle>
        <label className="grid gap-1 text-sm">Açık adres<textarea name="body" className={input} maxLength={500} defaultValue={req.address ?? ""} /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="share" defaultChecked={req.address_shared} /> Seçtiğim ustayla paylaş</label>
      </MarketForm></div>
    </details>}
    {mayRevokeAddress && <details className="mt-5 border-t border-[#E7E1D6] pt-4">
      <summary className="cursor-pointer text-sm font-semibold">Adres paylaşımını kaldır</summary>
      <p className="my-2 text-sm text-[#5B6460]">Açık adres talep kaydından silinir ve usta panelinde görünmez.</p>
      <MarketForm action="address" fields={{ id: req.id, body: "" }} label="Adresi sil ve paylaşımı durdur" inline subtle />
    </details>}
    {winner && req.address && <p className="mt-4 break-words rounded-xl bg-[#F3EEE4] p-3 text-sm">Müşterinin paylaştığı adres · {req.address}</p>}
    {req.job_id && <Link className={`mt-4 ${plainButton}`} href={`/jobs/${req.job_id}`}>Usta panelinde işi aç</Link>}
    {controls.length > 0 && <div className="mt-5 grid gap-2">{controls.map(({ action, label, explanation, subtle }) => explanation ?
      <details key={action} className="rounded-xl border border-[#E7E1D6] p-3">
        <summary className="cursor-pointer text-sm font-semibold">{label}</summary>
        <p className="my-2 text-sm text-[#5B6460]">{explanation}</p>
        <MarketForm action={action} fields={{ id: req.id }} label={label} inline subtle={subtle} />
      </details> : <MarketForm key={action} action={action} fields={{ id: req.id }} label={label} inline subtle={subtle} />)}</div>}
  </section>;
}

function MessageSection({ detail, messages, page }: { detail: MarketDetail; messages: MarketMessage[]; page: number }) {
  const { request: req, is_customer, provider_id, provider_suspended, target_name, winner_name, offers } = detail;
  const open = req.state === "open";
  const working = ["awarded", "in_progress", "awaiting_completion"].includes(req.state);
  const recipients = new Map<string, string>();
  if (open && req.target_id && target_name) recipients.set(req.target_id, target_name);
  if (open) offers.filter((offer) => offer.state === "active").forEach((offer) => recipients.set(offer.provider_id, offer.display_name));
  if (working && req.winner_id && winner_name) recipients.set(req.winner_id, winner_name);
  if (!is_customer) for (const key of recipients.keys()) if (key !== provider_id || provider_suspended) recipients.delete(key);
  const threads = new Map<string, { name: string; messages: MarketMessage[] }>();
  for (const [id, name] of recipients) threads.set(id, { name, messages: [] });
  for (const message of messages.slice(0, 50).reverse()) {
    const thread = threads.get(message.provider_id);
    if (thread) thread.messages.push(message);
    else threads.set(message.provider_id, { name: message.display_name, messages: [message] });
  }
  return <section className={panel}>
    <h2 className="mb-3 flex items-center gap-2 text-xl font-bold"><MessageCircle aria-hidden="true" size={20} className="text-[#075D54]" /> Mesajlar</h2>
    {threads.size === 0 && <p className="text-sm text-[#5B6460]">Henüz mesaj yok.{open && (is_customer ? " Teklif geldiğinde ustayla buradan yazışabilirsin." : " Teklif gönderdikten sonra müşteriyle buradan yazışabilirsin.")}</p>}
    {[...threads].map(([id, thread]) => <details className="my-2 rounded-xl border border-[#E7E1D6] p-3" key={id} open={threads.size === 1}>
      <summary className="cursor-pointer break-words text-sm font-semibold">{is_customer ? thread.name : "Müşteri"}{!recipients.has(id) && <span className="ml-2 font-normal text-[#5B6460]">· Arşiv</span>}</summary>
      {thread.messages.length > 0 ? <ol className="my-3 grid gap-2">{thread.messages.map((message) => {
        const ownMessage = message.sender === (is_customer ? "customer" : "provider");
        return <li key={message.id} className={`min-w-0 max-w-[90%] rounded-xl p-3 text-sm ${ownMessage ? "justify-self-end bg-[#E4EFEC]" : "bg-[#F3EEE4]"}`}>
          <p className="text-xs text-[#3B4540]"><strong>{ownMessage ? "Sen" : is_customer ? thread.name : "Müşteri"}</strong> · <time dateTime={message.created_at}>{marketDate(message.created_at)}</time></p>
          <p className="mt-1 whitespace-pre-wrap break-words">{message.body}</p>
        </li>;
      })}</ol> : <p className="my-3 text-sm text-[#5B6460]">{page === 1 ? "Bu sayfada bu görüşmeye ait mesaj yok." : "Bu görüşmenin mesajları başka bir sayfada."}</p>}
      {recipients.has(id) && page === 1 && <MarketForm action="message" fields={{ id: req.id, provider: id }} label="Mesaj gönder" success="Mesaj gönderildi.">
        <label className="grid gap-1 text-sm">Mesaj<textarea name="body" className={input} rows={3} required maxLength={1600} /></label>
      </MarketForm>}
    </details>)}
    {page > 1 && <Link href={`/talepler/${req.id}#mesajlar`} className="mt-3 inline-block text-sm font-semibold text-[#075D54] hover:underline">Son mesajlara dön</Link>}
    <MarketPagination page={page} more={messages.length > 50} href={(next) => `/talepler/${req.id}?mesaj=${next}#mesajlar`} />
  </section>;
}

export default async function MarketRequestDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ mesaj?: string }> }) {
  const { id } = await params;
  if (!validMarketId(id)) notFound();
  const page = marketPage((await searchParams).mesaj);
  await requireMarketViewer(`/talepler/${id}${page > 1 ? `?mesaj=${page}` : ""}`);
  const [detail, directory] = await Promise.all([marketRead("detail", 1, id), marketDirectory()]);
  if (!detail) notFound();
  const messages = await marketRead("thread", page, id);
  const req = detail.request;
  return <>
    {page === 1 && !["completed", "cancelled"].includes(req.state) && <RefreshMarketDetail />}
    <Link href={detail.is_customer ? "/talepler" : "/usta-talepleri"} className="mb-4 inline-flex min-h-9 items-center gap-2 text-sm font-semibold text-[#075D54] hover:underline"><ArrowLeft aria-hidden="true" size={16} /> {detail.is_customer ? "Taleplerim" : "Usta talepleri"}</Link>
    <MarketHeading title={req.title} description={`${req.district}, ${req.city} · ${marketStateLabels[req.state]}`}>
      {detail.is_customer && req.state === "open" && !req.is_direct && !detail.offers.length && <Link href={`/talepler/${id}/duzenle`} className={plainButton}>İlanı düzenle</Link>}
    </MarketHeading>
    <RequestTimeline state={req.state} />
    <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
      <div className="grid content-start gap-4">
        <section className={panel}>
          <h2 className="text-xl font-bold">İşin kapsamı</h2>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium text-[#5B6460]">
            <span>{directory?.categories.find((c) => c.slug === req.category)?.name}</span>
            {req.is_direct && <span>Doğrudan çağrı{detail.target_name && ` · ${detail.target_name}`}</span>}
            {req.preferred_date && <span>Tercih · {marketDate(req.preferred_date)}</span>}
            {req.budget != null && <span>Bütçe · {money.format(req.budget)}</span>}
          </div>
          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[#3B4540]">{req.description}</p>
        </section>
        <OfferSection detail={detail} />
        <div id="mesajlar" className="scroll-mt-4"><MessageSection detail={detail} messages={messages} page={page} /></div>
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
