import { useCallback, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { randomUUID } from "expo-crypto";
import { validMarketId, type MarketCategory, type MarketDetail, type MarketProvider } from "@kacayapayim/core/marketplace";
import { Button, Card, Empty, Field, Notice, SectionTitle } from "@/src/components/ui";
import { RequireMarketUser, ServiceCategories, ServiceLoadState, ServiceScreen, ServiceText, useMarketLoad, useMarketWrite } from "@/src/components/marketplace";
import { directory, marketDayError, readMarket, validMarketAmount } from "@/src/lib/marketplace";

function RequestFields({ categories, provider, existing }: {
  categories: MarketCategory[]; provider?: MarketProvider; existing?: MarketDetail["request"];
}) {
  const choices = provider ? categories.filter((item) => provider.categories.includes(item.slug)) : categories;
  const [id] = useState(() => existing?.id ?? randomUUID());
  const [category, setCategory] = useState(existing?.category ?? (choices.length === 1 ? choices[0].slug : ""));
  const [showCategories, setShowCategories] = useState(false);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [body, setBody] = useState(existing?.description ?? "");
  const [city, setCity] = useState(existing?.city ?? provider?.city ?? "");
  const [district, setDistrict] = useState(existing?.district ?? (provider?.districts.length === 1 ? provider.districts[0] : ""));
  const [date, setDate] = useState(existing?.preferred_date ?? "");
  const [dateEditedAt, setDateEditedAt] = useState(() => Date.now());
  const [amount, setAmount] = useState(existing?.budget == null ? "" : String(existing.budget));
  const [address, setAddress] = useState(existing?.address ?? "");
  const { busy, notice, run } = useMarketWrite(() => {});
  const dateError = marketDayError(date.trim(), dateEditedAt);
  const invalidAmount = !!amount.trim() && !validMarketAmount(amount.trim());
  const unavailableCategory = !choices.some((item) => item.slug === category);
  return <Card>
    <Button title={choices.find((item) => item.slug === category)?.name ?? "Hizmet kategorisi seç"} quiet onPress={() => setShowCategories(!showCategories)} />
    {showCategories && <ServiceCategories categories={choices} selected={[category]} toggle={(key) => { setCategory(key); setShowCategories(false); }} />}
    <Field label="İşin başlığı" value={title} onChangeText={(value) => setTitle(value.slice(0, 120))} placeholder="Örn. Mutfak musluğu değişimi" />
    <Field label="İşin açıklaması" value={body} onChangeText={(value) => setBody(value.slice(0, 3000))} multiline
      placeholder="Yapılacak işi ve bilmesi gereken ayrıntıları yaz." />
    {provider ? <ServiceText>Hizmet ili {provider.city}</ServiceText> : <Field label="İl" value={city} onChangeText={(value) => setCity(value.slice(0, 80))} />}
    {provider && provider.districts.length > 0 ? <>
      <SectionTitle>İlçe</SectionTitle><ServiceCategories categories={provider.districts.map((name) => ({ name, slug: name }))} selected={[district]} toggle={setDistrict} />
    </> : <Field label="İlçe" value={district} onChangeText={(value) => setDistrict(value.slice(0, 80))} />}
    <Field label="Tercih edilen gün (isteğe bağlı)" placeholder="YYYY-AA-GG" value={date} onChangeText={(value) => {
      setDate(value.slice(0, 10));
      setDateEditedAt(Date.now());
    }} />
    {date.trim().length === 10 && dateError && <Notice error>{dateError}</Notice>}
    <Field label="Bütçe (₺, isteğe bağlı)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
    {invalidAmount && <Notice error>0’dan büyük bir tutar gir. En fazla iki ondalık basamak kullan.</Notice>}
    <Field label="Açık adres (isteğe bağlı ve özel)" value={address} onChangeText={(value) => setAddress(value.slice(0, 500))} multiline />
    <ServiceText>Açık adresi teklif kabulünden sonra seçtiğin ustayla paylaşabilirsin.</ServiceText>
    {notice && <Notice error={notice.error}>{notice.text}</Notice>}
    <Button title={busy ? "Kaydediliyor…" : existing ? "Değişiklikleri kaydet" : provider ? "Ustaya çağrı gönder" : "İlanı yayımla"}
      disabled={busy || unavailableCategory || Boolean(dateError) || invalidAmount || title.trim().length < 5 || body.trim().length < 15 || city.trim().length < 2 || district.trim().length < 2}
      onPress={() => void run(existing ? "edit" : "create", {
        id, category, title, body, city, district, date: date.trim(), amount: amount.trim().replace(",", "."), address, ...(provider ? { provider: provider.id } : {}),
      }, (request) => { if (validMarketId(request)) router.replace({ pathname: "/hizmet/talep/[id]", params: { id: request } }); })} />
  </Card>;
}

function RequestFormScreen({ usta, duzenle }: { usta?: string; duzenle?: string }) {
  const result = useMarketLoad(useCallback(async () => {
    if ((usta && !validMarketId(usta)) || (duzenle && !validMarketId(duzenle)) || (usta && duzenle)) return null;
    const [list, detail] = await Promise.all([directory(usta ? { id: usta } : {}), duzenle ? readMarket("detail", 1, duzenle) : null]);
    const provider = usta ? list.providers[0] : undefined;
    if (usta && !provider || duzenle && (!detail?.is_customer || detail.request.is_direct || detail.request.state !== "open" || detail.offers.length)) return null;
    return { categories: list.categories, provider, existing: detail?.request };
  }, [usta, duzenle]));
  const { data } = result;
  return <ServiceScreen title={duzenle ? "İlanı düzenle" : usta ? "Ustaya çağrı gönder" : "İş ilanı ver"}
    subtitle={data?.provider ? `Çağrın ${data.provider.display_name} adlı ustaya iletilecek.` : "Ustaların doğru teklif verebilmesi için işi ve konumu belirt."}>
    <ServiceLoadState {...result} />
    {data === null && <Empty title="Bu talep açılamıyor" detail="Usta profilini veya ilanının güncel durumunu kontrol et." />}
    {data && <RequestFields key={usta ?? duzenle ?? "new"} {...data} />}
  </ServiceScreen>;
}

export default function NewRequest() {
  const { usta, duzenle } = useLocalSearchParams<{ usta?: string; duzenle?: string }>();
  const next = validMarketId(usta) && !duzenle ? `/hizmet/yeni?usta=${usta}` :
    validMarketId(duzenle) && !usta ? `/hizmet/yeni?duzenle=${duzenle}` : "/hizmet/yeni";
  return <RequireMarketUser next={next}><RequestFormScreen usta={usta} duzenle={duzenle} /></RequireMarketUser>;
}
