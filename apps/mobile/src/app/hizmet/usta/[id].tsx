import { useCallback, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { validMarketId } from "@kacayapayim/core/marketplace";
import { Button, Card, Empty, Field, Notice, Row, SectionTitle } from "@/src/components/ui";
import { ServiceScreen, ServiceText, useMarketLoad, useMarketWrite } from "@/src/components/marketplace";
import { directory, localMarketDate, readMarket } from "@/src/lib/marketplace";
import { useAppSession } from "@/src/lib/session";

export default function ServiceProvider() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, requiresMfa } = useAppSession();
  const canInteract = !!session && !requiresMfa;
  const { data, error, refresh } = useMarketLoad(useCallback(async () => {
    if (!validMarketId(id)) return null;
    const [result, favorite] = await Promise.all([directory({ id }), canInteract ? readMarket("favorite", 1, id) : false]);
    return { result, favorite };
  }, [id, canInteract]));
  const { run, busy, notice } = useMarketWrite(refresh);
  const provider = data?.result.providers[0];
  return <ServiceScreen title={provider?.display_name ?? "Usta profili"}>
    {error && <Notice error>{error}</Notice>}
    {data !== undefined && !provider && <Empty title="Usta profili bulunamadı" detail="Usta rehberinden başka bir profil seç." />}
    {data && provider && <><Card>
      <ServiceText>{provider.city} · {provider.districts.length ? provider.districts.join(", ") : "Tüm ilçeler"}</ServiceText>
      <ServiceText>{data.result.categories.filter((category) => provider.categories.includes(category.slug)).map((category) => category.name).join(", ")}</ServiceText>
      {!!provider.bio && <ServiceText>{provider.bio}</ServiceText>}
      <Button title="Ustaya Çağrı Gönder" onPress={() => router.push({ pathname: "/hizmet/yeni", params: { usta: id } })} />
      {canInteract && <Button title={data.favorite ? "Favorilerden çıkar" : "Favoriye ekle"} quiet disabled={busy}
        onPress={() => void run(data.favorite ? "unfavorite" : "favorite", { provider: id })} />}
      {notice && <Notice error={notice.error}>{notice.text}</Notice>}
    </Card>
    <SectionTitle>Değerlendirmeler</SectionTitle>
    {data.result.reviews.length ? <Card>{data.result.reviews.map((review, index) => <Row key={`${review.created_at}-${index}`}
      title={`${review.rating} / 5 · ${localMarketDate(review.created_at)}`} subtitle={review.body} />)}</Card> :
      <Empty title="Değerlendirme yok" detail="Tamamlanan hizmetlerin değerlendirmeleri burada yayımlanır." />}
    {canInteract && <ReportBox provider={id} />}
    </>}
  </ServiceScreen>;
}

function ReportBox({ provider }: { provider: string }) {
  const [visible, setVisible] = useState(false);
  const [body, setBody] = useState("");
  const { run, busy, notice } = useMarketWrite(() => {});
  return <Card><Button quiet title="Profili bildir" onPress={() => setVisible(!visible)} />
    {visible && <><Field label="Bildirim nedeni" value={body} onChangeText={setBody} multiline />
      <Button title="Bildirimi gönder" disabled={busy || body.trim().length < 5} onPress={() => void run("report", { provider, body }, () => setBody(""))} />
      {notice && <Notice error={notice.error}>{notice.text}</Notice>}</>}
  </Card>;
}
