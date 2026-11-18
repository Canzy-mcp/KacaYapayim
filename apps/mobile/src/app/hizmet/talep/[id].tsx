import { useCallback, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { marketOfferLabels, marketStateLabels, validMarketId, type MarketDetail, type MarketMessage } from "@kacayapayim/core/marketplace";
import { Button, Card, Choice, Empty, Field, Notice, Row, SectionTitle } from "@/src/components/ui";
import { RequireMarketUser, ServiceScreen, ServiceText, useMarketLoad, useMarketWrite } from "@/src/components/marketplace";
import { localMarketDate, marketMoney, readMarket } from "@/src/lib/marketplace";

type Actions = ReturnType<typeof useMarketWrite>;

function Offers({ detail, actions }: { detail: MarketDetail; actions: Actions }) {
  const { request, offers, is_customer, provider_suspended } = detail;
  const ownOffer = offers[0];
  const [amount, setAmount] = useState(ownOffer ? String(ownOffer.amount) : "");
  const [body, setBody] = useState(ownOffer?.scope ?? "");
  const [selected, setSelected] = useState("");
  const { run, busy } = actions;
  return <Card>
    {offers.length ? offers.map((offer) => <Card key={offer.id}>
      <Row title={offer.display_name} subtitle={marketOfferLabels[offer.state]} right={marketMoney.format(offer.amount)} />
      <ServiceText>{offer.scope}</ServiceText>
      {is_customer && request.state === "open" && offer.state === "active" && (selected === offer.id ? <>
        <ServiceText>{offer.display_name} adlı ustanın {marketMoney.format(offer.amount)} tutarındaki teklifini kabul edeceksin.</ServiceText>
        <Button title="Kabulü onayla" disabled={busy} onPress={() => void run("award", { id: request.id, offer: offer.id, version: offer.updated_at })} />
        <Button title="Vazgeç" quiet onPress={() => setSelected("")} />
      </> : <Button title="Bu teklifi kabul et" onPress={() => setSelected(offer.id)} />)}
    </Card>) : <ServiceText>Henüz teklif yok.</ServiceText>}
    {!is_customer && !provider_suspended && request.state === "open" && <>
      <Field label="Toplam fiyat (₺)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
      <Field label="İş kapsamı ve koşullar" value={body} onChangeText={setBody} multiline />
      <Button title={ownOffer?.state === "active" ? "Teklifi güncelle" : "Teklif gönder"} disabled={busy || !amount || body.trim().length < 5}
        onPress={() => void run("offer", { id: request.id, amount: amount.trim().replace(",", "."), body })} />
      {ownOffer?.state === "active" && <Button title="Teklifi geri çek" quiet disabled={busy} onPress={() => void run("withdraw", { id: request.id })} />}
    </>}
  </Card>;
}

function Agenda({ detail, actions }: { detail: MarketDetail; actions: Actions }) {
  const { request: req, is_customer, provider_id, winner_name } = detail;
  const winner = req.winner_id != null && req.winner_id === provider_id;
  const canSchedule = (is_customer || winner) && req.state === "awarded" && !!req.winner_id;
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [address, setAddress] = useState(req.address ?? "");
  const [share, setShare] = useState(req.address_shared);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const { busy, run } = actions;
  return <Card>
    <ServiceText>{marketStateLabels[req.state]}{winner_name ? ` · ${winner_name}` : ""}</ServiceText>
    {req.appointment_at && <ServiceText>{localMarketDate(req.appointment_at)} · {req.appointment_confirmed ? "Onaylandı" : "Onay bekliyor"}</ServiceText>}
    {canSchedule && <>
      {req.appointment_at && !req.appointment_confirmed && req.appointment_proposer !== (is_customer ? "customer" : "provider") &&
        <Button title="Randevuyu onayla" disabled={busy} onPress={() => void run("confirm_appointment", { id: req.id, version: req.appointment_at! })} />}
      <Field label="Randevu günü" placeholder="YYYY-AA-GG" value={date} onChangeText={setDate} />
      <Field label="Randevu saati (Türkiye saati)" placeholder="SS:DD" value={time} onChangeText={setTime} />
      <Button title={req.appointment_at ? "Yeni saat öner" : "Randevu öner"} quiet disabled={busy || !date || !time}
        onPress={() => void run("appointment", { id: req.id, at: `${date.trim()}T${time.trim()}` }, () => { setDate(""); setTime(""); })} />
    </>}
    {is_customer && req.winner_id && ["awarded", "in_progress"].includes(req.state) && <>
      <Field label="Açık adres" value={address} onChangeText={setAddress} multiline />
      <Choice title="Adresi seçtiğim ustayla paylaş" selected={share} onPress={() => setShare(!share)} />
      <Button title="Adres paylaşımını kaydet" quiet disabled={busy} onPress={() => void run("address", { id: req.id, body: address, share })} />
    </>}
    {winner && req.address && <Notice>Paylaşılan adres · {req.address}</Notice>}
    {winner && req.state === "awarded" && (!req.appointment_at || req.appointment_confirmed) &&
      <Button title="İşe başla" disabled={busy} onPress={() => void run("start", { id: req.id })} />}
    {winner && req.state === "in_progress" && <Button title="Tamamlandığını bildir" disabled={busy} onPress={() => void run("finish", { id: req.id })} />}
    {is_customer && req.state === "awaiting_completion" && <>
      <Button title="İşi tamamlandı olarak onayla" disabled={busy} onPress={() => void run("complete", { id: req.id })} />
      <Button title="İş yeniden açılsın" quiet disabled={busy} onPress={() => void run("reopen", { id: req.id })} />
    </>}
    {((is_customer && ["open", "awarded"].includes(req.state)) || (winner && req.state === "awarded")) && (confirmCancel ? <>
      <Button title="Talebi iptal etmeyi onayla" danger disabled={busy} onPress={() => void run("cancel", { id: req.id }, () => setConfirmCancel(false))} />
      <Button title="Vazgeç" quiet onPress={() => setConfirmCancel(false)} />
    </> : <Button title="Talebi iptal et" quiet onPress={() => setConfirmCancel(true)} />)}
    {!is_customer && req.is_direct && req.target_id === provider_id && req.state === "open" &&
      <Button title="Çağrıyı reddet" quiet disabled={busy} onPress={() => void run("decline", { id: req.id })} />}
    {req.job_id && <Button title="Usta panelinde işi aç" quiet onPress={() => router.push({ pathname: "/job/[id]", params: { id: req.job_id! } })} />}
  </Card>;
}

function Messages({ detail, messages, actions, page, setPage }: {
  detail: MarketDetail; messages: MarketMessage[]; actions: Actions; page: number; setPage: (page: number) => void;
}) {
  const { request: req, is_customer, provider_id, provider_suspended, target_name, winner_name, offers } = detail;
  const [body, setBody] = useState("");
  const [selected, setSelected] = useState("");
  const threads = new Map<string, string>();
  if (req.state === "open") {
    if (req.target_id && target_name) threads.set(req.target_id, target_name);
    offers.filter((offer) => offer.state === "active").forEach((offer) => threads.set(offer.provider_id, offer.display_name));
  } else if (["awarded", "in_progress", "awaiting_completion"].includes(req.state) && req.winner_id && winner_name) {
    threads.set(req.winner_id, winner_name);
  }
  if (!is_customer) for (const key of threads.keys()) if (key !== provider_id || provider_suspended) threads.delete(key);
  const destination = threads.has(selected) ? selected : threads.size === 1 ? threads.keys().next().value : undefined;
  return <Card>
    {messages.length ? messages.slice(0, 50).reverse().map((msg) =>
      <Row key={msg.id} title={msg.sender === "customer" ? `Müşteri → ${msg.display_name}` : msg.display_name}
        subtitle={`${msg.body}\n${localMarketDate(msg.created_at)}`} />) : <ServiceText>Henüz mesaj yok.</ServiceText>}
    {page > 1 && <Button title="Daha yeni mesajlar" quiet onPress={() => setPage(page - 1)} />}
    {messages.length > 50 && page < 101 && <Button title="Daha eski mesajlar" quiet onPress={() => setPage(page + 1)} />}
    {threads.size > 1 && [...threads].map(([id, name]) => <Choice key={id} title={name} selected={selected === id} onPress={() => setSelected(id)} />)}
    {destination && <>
      <Field label="Mesaj" value={body} onChangeText={setBody} multiline />
      <Button title="Mesaj gönder" disabled={actions.busy || !body.trim()}
        onPress={() => void actions.run("message", { id: req.id, provider: destination, body }, () => { setBody(""); setPage(1); })} />
    </>}
  </Card>;
}

function Feedback({ detail, actions }: { detail: MarketDetail; actions: Actions }) {
  const { request: req, is_customer, has_review } = detail;
  const [rating, setRating] = useState("");
  const [body, setBody] = useState("");
  const [showReport, setShowReport] = useState(false);
  const [reason, setReason] = useState("");
  return <>
    {is_customer && req.state === "completed" && req.winner_id && <>
      <SectionTitle>Değerlendirme</SectionTitle><Card>{has_review ? <ServiceText>Bu iş için değerlendirme gönderdin.</ServiceText> : <>
        {["5", "4", "3", "2", "1"].map((value) => <Choice key={value} title={`${value} / 5`} selected={rating === value} onPress={() => setRating(value)} />)}
        <Field label="Deneyimin" value={body} onChangeText={setBody} multiline />
        <Button title="Değerlendirmeyi yayımla" disabled={actions.busy || !rating || body.trim().length < 5}
          onPress={() => void actions.run("review", { id: req.id, rating, body })} />
      </>}</Card>
    </>}
    <Card><Button title="Talebi bildir" quiet onPress={() => setShowReport(!showReport)} />
      {showReport && <><Field label="Bildirim nedeni" value={reason} onChangeText={setReason} multiline />
        <Button title="Bildirimi gönder" disabled={actions.busy || reason.trim().length < 5}
          onPress={() => void actions.run("report", { id: req.id, body: reason }, () => setReason(""))} /></>}
    </Card>
  </>;
}

function RequestDetailScreen({ id }: { id: string }) {
  const [page, setPage] = useState(1);
  const { data, error, refresh } = useMarketLoad(useCallback(async () => {
    if (!validMarketId(id)) return null;
    const detail = await readMarket("detail", 1, id);
    return detail ? { detail, messages: await readMarket("thread", page, id) } : null;
  }, [id, page]));
  const actions = useMarketWrite(refresh);
  const req = data?.detail.request;
  return <ServiceScreen title={req?.title ?? "Hizmet talebi"}>
    {error && <Notice error>{error}</Notice>}
    {actions.notice && <Notice error={actions.notice.error}>{actions.notice.text}</Notice>}
    {data === null && <Empty title="Talep bulunamadı" detail="Talep kaldırılmış veya hesabına açık olmayabilir." />}
    {data && req && <>
      <Card>
        <ServiceText>{req.district}, {req.city} · {marketStateLabels[req.state]}</ServiceText>
        {req.is_direct && <ServiceText>Doğrudan çağrı · {data.detail.target_name}</ServiceText>}
        <ServiceText>{req.description}</ServiceText>
        {req.budget != null && <ServiceText>Bütçe {marketMoney.format(req.budget)}</ServiceText>}
        {req.preferred_date && <ServiceText>Tercih edilen gün {req.preferred_date}</ServiceText>}
        {data.detail.is_customer && req.state === "open" && !req.is_direct && !data.detail.offers.length &&
          <Button title="İlanı düzenle" quiet onPress={() => router.push({ pathname: "/hizmet/yeni", params: { duzenle: id } })} />}
      </Card>
      <SectionTitle>{data.detail.is_customer ? "Gelen teklifler" : "Teklifin"}</SectionTitle><Offers detail={data.detail} actions={actions} />
      <SectionTitle>İş ve randevu</SectionTitle><Agenda detail={data.detail} actions={actions} />
      <SectionTitle>Mesajlar</SectionTitle><Messages detail={data.detail} messages={data.messages} actions={actions} page={page} setPage={setPage} />
      <Feedback detail={data.detail} actions={actions} />
      <Button title="Son durumu yenile" quiet onPress={refresh} />
    </>}
  </ServiceScreen>;
}

export default function MarketRequestDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <RequireMarketUser><RequestDetailScreen key={id} id={id} /></RequireMarketUser>;
}
