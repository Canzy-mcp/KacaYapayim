import { useCallback, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { validMarketId } from "@kacayapayim/core/marketplace";
import { Button, Card, Empty, Field, Notice, Row, SectionTitle } from "@/src/components/ui";
import { ServiceLoadState, ServiceScreen, ServiceText, useMarketLoad, useMarketWrite } from "@/src/components/marketplace";
import { directory, localMarketDate, readMarket } from "@/src/lib/marketplace";
import { useAppSession } from "@/src/lib/session";

export default function ServiceProvider() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, requiresMfa } = useAppSession();
  const accountId = requiresMfa ? undefined : session?.user.id;
  const result = useMarketLoad(useCallback(async () => {
    if (!validMarketId(id)) return null;
    return directory({ id });
  }, [id]));
  const favorite = useMarketLoad(useCallback(() => (
    accountId && validMarketId(id) ? readMarket("favorite", 1, id) : Promise.resolve(false)
  ), [accountId, id]));
  const { data } = result;
  const { run, busy, notice } = useMarketWrite(favorite.refresh);
  const provider = data?.providers[0];
  return <ServiceScreen title={provider?.display_name ?? "Usta profili"} subtitle={provider?.city}>
    <ServiceLoadState {...result} />
    {data !== undefined && !provider && <Empty title="Usta profili bulunamadı" detail="Usta rehberinden başka bir profil seç." />}
    {data && provider && <><Card>
      <ServiceText>{provider.districts.length ? provider.districts.join(", ") : "Tüm ilçeler"} · {provider.city}</ServiceText>
      <ServiceText>{data.categories.filter((category) => provider.categories.includes(category.slug)).map((category) => category.name).join(", ")}</ServiceText>
      {provider.rating != null && <ServiceText>{provider.rating} / 5 · {provider.review_count ?? 0} değerlendirme</ServiceText>}
      {!!provider.bio && <ServiceText>{provider.bio}</ServiceText>}
      <Button title="Ustaya çağrı gönder" onPress={() => router.push({ pathname: "/hizmet/yeni", params: { usta: id } })} />
      {accountId && <>
        {favorite.error && <ServiceLoadState {...favorite} />}
        {!favorite.error && <Button title={busy ? "Kaydediliyor…" : favorite.data ? "Favorilerden çıkar" : "Favoriye ekle"} quiet
          disabled={busy || favorite.loading} onPress={() => void run(favorite.data ? "unfavorite" : "favorite", { provider: id })} />}
        {notice && <Notice error={notice.error}>{notice.text}</Notice>}
      </>}
    </Card>
    <SectionTitle>Değerlendirmeler</SectionTitle>
    {data.reviews.length ? <Card>{data.reviews.map((review, index) => <Row key={`${review.created_at}-${index}`}
      title={`${review.rating} / 5 · ${localMarketDate(review.created_at)}`} subtitle={review.body} />)}</Card> :
      <Empty title="Değerlendirme yok" detail="Tamamlanan hizmetlerin değerlendirmeleri burada yayımlanır." />}
    {accountId && <ReportBox key={`${id}:${accountId}`} provider={id} />}
    </>}
  </ServiceScreen>;
}

function ReportBox({ provider }: { provider: string }) {
  const [visible, setVisible] = useState(false);
  const [body, setBody] = useState("");
  const { run, busy, notice } = useMarketWrite(() => {});
  return <Card><Button quiet title="Profili bildir" onPress={() => setVisible(!visible)} />
    {visible && <><Field label="Bildirim nedeni" value={body} onChangeText={(value) => setBody(value.slice(0, 1200))} multiline />
      <Button title="Bildirimi gönder" disabled={busy || body.trim().length < 5} onPress={() => void run("report", { provider, body }, () => setBody(""))} />
      {notice && <Notice error={notice.error}>{notice.text}</Notice>}</>}
  </Card>;
}
