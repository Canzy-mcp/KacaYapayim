import { useCallback, useState } from "react";
import { router } from "expo-router";
import type { MarketCategory, MarketProviderSettings } from "@kacayapayim/core/marketplace";
import { Button, Card, Choice, Field, Notice, SectionTitle } from "@/src/components/ui";
import { RequireMarketUser, ServiceCategories, ServiceScreen, ServiceText, useMarketLoad, useMarketWrite } from "@/src/components/marketplace";
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
  return <Card>
    {profile?.suspended && <Notice>Profil moderasyon nedeniyle askıda.</Notice>}
    <Field label="Görünen ad" value={title} onChangeText={setTitle} />
    <Field label="Tanıtım" value={body} onChangeText={setBody} multiline />
    <Field label="Hizmet ili" value={city} onChangeText={setCity} />
    <Field label="Hizmet ilçeleri" value={districts} onChangeText={setDistricts} />
    <ServiceText>İlçeleri virgülle ayır. Boş bırakırsan ilin tamamını kapsarsın.</ServiceText>
    <SectionTitle>Verdiğin hizmetler</SectionTitle><ServiceCategories categories={categories} selected={selected}
      toggle={(key) => setSelected((items) => items.includes(key) ? items.filter((item) => item !== key) : [...items, key])} />
    <Choice title="Profilim yayımlansın" selected={published} onPress={() => setPublished(!published)} />
    <Button title="Usta profilini kaydet" disabled={busy || !selected.length || city.trim().length < 2 || title.trim().length < 2}
      onPress={() => void run("profile", { title, body, city, districts: districts.split(",").map((item) => item.trim()).filter(Boolean), categories: selected, published })} />
    {notice && <Notice error={notice.error}>{notice.text}</Notice>}
  </Card>;
}

function ProfileScreen() {
  const { data, error, refresh } = useMarketLoad(useCallback(async () => {
    const [settings, list] = await Promise.all([readMarket("provider"), directory()]);
    return { settings, categories: list.categories };
  }, []));
  return <ServiceScreen title="Usta profilim">
    {error && <Notice error>{error}</Notice>}
    {data && (data.settings.business ? <ProfileFields {...data} refresh={refresh} /> :
      <Button title="İşletme kurulumunu tamamla" onPress={() => router.push("/onboarding")} />)}
  </ServiceScreen>;
}

export default function ProviderProfile() { return <RequireMarketUser><ProfileScreen /></RequireMarketUser>; }
