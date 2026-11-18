import { useCallback, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { randomUUID } from "expo-crypto";
import { validMarketId, type MarketCategory, type MarketDetail, type MarketProvider } from "@kacayapayim/core/marketplace";
import { Button, Card, Empty, Field, Notice, SectionTitle } from "@/src/components/ui";
import { RequireMarketUser, ServiceCategories, ServiceScreen, ServiceText, useMarketLoad, useMarketWrite } from "@/src/components/marketplace";
import { directory, readMarket } from "@/src/lib/marketplace";

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
  const [amount, setAmount] = useState(existing?.budget == null ? "" : String(existing.budget));
  const [address, setAddress] = useState(existing?.address ?? "");
  const { busy, notice, run } = useMarketWrite(() => {});
  return <Card>
    <Button title={choices.find((item) => item.slug === category)?.name ?? "Hizmet kategorisi seç"} quiet onPress={() => setShowCategories(!showCategories)} />
    {showCategories && <ServiceCategories categories={choices} selected={[category]} toggle={(key) => { setCategory(key); setShowCategories(false); }} />}
    <Field label="İşin başlığı" value={title} onChangeText={setTitle} />
    <Field label="İşin açıklaması" value={body} onChangeText={setBody} multiline />
    {provider ? <ServiceText>Hizmet ili {provider.city}</ServiceText> : <Field label="İl" value={city} onChangeText={setCity} />}
    {provider && provider.districts.length > 0 ? <>
      <SectionTitle>İlçe</SectionTitle><ServiceCategories categories={provider.districts.map((name) => ({ name, slug: name }))} selected={[district]} toggle={setDistrict} />
    </> : <Field label="İlçe" value={district} onChangeText={setDistrict} />}
    <Field label="Tercih edilen gün (isteğe bağlı)" placeholder="YYYY-AA-GG" value={date} onChangeText={setDate} />
    <Field label="Bütçe (₺, isteğe bağlı)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
    <Field label="Açık adres (isteğe bağlı ve özel)" value={address} onChangeText={setAddress} multiline />
    <ServiceText>Açık adresi teklif kabulünden sonra seçtiğin ustayla paylaşabilirsin.</ServiceText>
    {notice && <Notice error={notice.error}>{notice.text}</Notice>}
    <Button title={existing ? "Değişiklikleri kaydet" : provider ? "Ustaya çağrı gönder" : "İlanı yayımla"}
      disabled={busy || !category || title.trim().length < 5 || body.trim().length < 15 || city.trim().length < 2 || district.trim().length < 2}
      onPress={() => void run(existing ? "edit" : "create", {
        id, category, title, body, city, district, date: date.trim(), amount: amount.trim().replace(",", "."), address, ...(provider ? { provider: provider.id } : {}),
      }, (request) => { if (validMarketId(request)) router.replace({ pathname: "/hizmet/talep/[id]", params: { id: request } }); })} />
  </Card>;
}

function RequestFormScreen() {
  const { usta, duzenle } = useLocalSearchParams<{ usta?: string; duzenle?: string }>();
  const { data, error } = useMarketLoad(useCallback(async () => {
    if (usta && !validMarketId(usta) || duzenle && !validMarketId(duzenle)) return null;
    const [list, detail] = await Promise.all([directory(usta ? { id: usta } : {}), duzenle ? readMarket("detail", 1, duzenle) : null]);
    const provider = usta ? list.providers[0] : undefined;
    if (usta && !provider || duzenle && (!detail?.is_customer || detail.request.is_direct || detail.request.state !== "open" || detail.offers.length)) return null;
    return { categories: list.categories, provider, existing: detail?.request };
  }, [usta, duzenle]));
  return <ServiceScreen title={duzenle ? "İlanı düzenle" : usta ? "Ustaya çağrı gönder" : "İş İlanı Ver"}>
    {error && <Notice error>{error}</Notice>}
    {data === null && <Empty title="Bu talep açılamıyor" detail="Usta profilini veya ilanının güncel durumunu kontrol et." />}
    {data && <RequestFields key={usta ?? duzenle ?? "new"} {...data} />}
  </ServiceScreen>;
}

export default function NewRequest() { return <RequireMarketUser><RequestFormScreen /></RequireMarketUser>; }
