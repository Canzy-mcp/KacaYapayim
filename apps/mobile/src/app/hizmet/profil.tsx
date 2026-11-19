import { useCallback, useState } from "react";
import { router } from "expo-router";
import type { MarketCategory, MarketProviderSettings } from "@kacayapayim/core/marketplace";
import { Button, Card, Choice, Field, Notice, SectionTitle } from "@/src/components/ui";
import { RequireMarketUser, ServiceCategories, ServiceLoadState, ServiceScreen, ServiceText, useMarketLoad, useMarketWrite } from "@/src/components/marketplace";
import { directory, readMarket } from "@/src/lib/marketplace";

function ProfileFields({ settings, categories, refresh }: { settings: MarketProviderSettings; categories: MarketCategory[]; refresh: () => void }) {
  const profile = settings.profile;
  const [title, setTitle] = useState(profile?.display_name ?? settings.business?.name ?? "");
  const [body, setBody] = useState(profile?.bio ?? "");
  const [city, setCity] = useState(profile?.city ?? settings.business?.city ?? "");
  const [districts, setDistricts] = useState(profile?.districts.join(", ") ?? "");
  const [selected, setSelected] = useState(profile?.categories ?? []);
  const [published, setPublished] = useState(profile?.published ?? false);
  const { run, busy, notice } = useMarketWrite(refresh);
  const districtNames = [...new Set(districts.split(",").map((item) => item.trim()).filter(Boolean))];
  const invalidDistricts = districtNames.length > 20 || districtNames.some((item) => item.length < 2 || item.length > 80);
  return <Card>
    {profile?.suspended && <Notice>Profil moderasyon nedeniyle askıda.</Notice>}
    <Field label="Görünen ad" value={title} onChangeText={(value) => setTitle(value.slice(0, 120))} />
    <Field label="Tanıtım" value={body} onChangeText={(value) => setBody(value.slice(0, 1600))} multiline />
    <Field label="Hizmet ili" value={city} onChangeText={(value) => setCity(value.slice(0, 80))} />
    <Field label="Hizmet ilçeleri" value={districts} onChangeText={setDistricts} />
    <ServiceText>İlçeleri virgülle ayır. Boş bırakırsan ilin tamamını kapsarsın.</ServiceText>
    {invalidDistricts && <Notice error>En fazla 20 ilçe ekle. İlçe adları 2–80 karakter arasında olmalı.</Notice>}
    <SectionTitle>Verdiğin hizmetler</SectionTitle><ServiceCategories categories={categories} selected={selected} multiple
      toggle={(key) => setSelected((items) => items.includes(key) ? items.filter((item) => item !== key) : [...items, key])} />
    <Choice title="Profilim yayımlansın" selected={published} onPress={() => setPublished(!published)} />
    <Button title={busy ? "Kaydediliyor…" : "Usta profilini kaydet"} disabled={busy || invalidDistricts || !selected.length || city.trim().length < 2 || title.trim().length < 2}
      onPress={() => void run("profile", { title, body, city, districts: districtNames, categories: selected, published })} />
    {notice && <Notice error={notice.error}>{notice.text}</Notice>}
  </Card>;
}

function ProfileScreen() {
  const result = useMarketLoad(useCallback(async () => {
    const [settings, list] = await Promise.all([readMarket("provider"), directory()]);
    return { settings, categories: list.categories };
  }, []));
  const { data, refresh } = result;
  return <ServiceScreen title="Usta profilim" subtitle="Müşterilerin rehberde göreceği bilgileri ve hizmet bölgeni düzenle.">
    <ServiceLoadState {...result} />
    {data && (data.settings.business ? <ProfileFields {...data} refresh={refresh} /> :
      <Button title="İşletme kurulumunu tamamla" onPress={() => router.push({ pathname: "/onboarding", params: { usta: "1" } })} />)}
  </ServiceScreen>;
}

export default function ProviderProfile() { return <RequireMarketUser next="/hizmet/profil"><ProfileScreen /></RequireMarketUser>; }
