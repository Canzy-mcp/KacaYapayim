import { useCallback, useState } from "react";
import { router } from "expo-router";
import { Button, Card, Empty, Field, Notice, Row, Screen, SectionTitle } from "@/src/components/ui";
import { ServiceCategories, ServiceText, useMarketLoad } from "@/src/components/marketplace";
import { directory } from "@/src/lib/marketplace";
import { useAppSession } from "@/src/lib/session";
import { db } from "@/src/lib/supabase";

export default function ServiceHome() {
  const { session, business, refresh } = useAppSession();
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [showCategories, setShowCategories] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const { data, error } = useMarketLoad(useCallback(() => directory({ ...filters, page: String(page) }), [filters, page]));
  return <Screen title="Hizmet merkezi" subtitle="Usta bul, doğrudan çağrı gönder veya ilan açıp teklif al.">
    <Card><Button title="İş İlanı Ver" onPress={() => router.push("/hizmet/yeni")} />
      {session ? <>
        <Row title="Taleplerim" onPress={() => router.push({ pathname: "/hizmet/talepler", params: { gorunum: "own" } })} />
        <Row title="Favori ustalar" onPress={() => router.push({ pathname: "/hizmet/talepler", params: { gorunum: "favorites" } })} />
        <Row title="Bildirimler" onPress={() => router.push({ pathname: "/hizmet/talepler", params: { gorunum: "notices" } })} />
        {business?.onboarding_completed ? <>
          <Row title="Usta talepleri" onPress={() => router.push({ pathname: "/hizmet/talepler", params: { gorunum: "feed" } })} />
          <Row title="Usta tekliflerim ve işlerim" onPress={() => router.push({ pathname: "/hizmet/talepler", params: { gorunum: "work" } })} />
          <Row title="Herkese açık usta profilim" onPress={() => router.push("/hizmet/profil")} />
          <Row title="Usta paneli" onPress={() => router.push("/(tabs)")} />
        </> : <Row title="Usta olarak başla" onPress={() => router.push("/onboarding")} />}
      </> : <Button title="Giriş yap" quiet onPress={() => router.push({ pathname: "/(auth)/login", params: { next: "/hizmet" } })} />}
    </Card>
    <SectionTitle>Usta Bul</SectionTitle>
    <Card><Field label="İl" value={city} onChangeText={setCity} placeholder="İstanbul" />
      <Field label="İlçe" value={district} onChangeText={setDistrict} placeholder="Kadıköy" />
      <Field label="Usta adı" value={name} onChangeText={setName} />
      <Button title={data?.categories.find((item) => item.slug === category)?.name ?? "Hizmet kategorisi seç"} quiet onPress={() => setShowCategories(!showCategories)} />
      {showCategories && data && <ServiceCategories categories={data.categories} selected={[category]} toggle={(key) => { setCategory(key === category ? "" : key); setShowCategories(false); }} />}
      <Button title="Ustaları ara" onPress={() => { setFilters({ city: city.trim().slice(0, 80), district: district.trim().slice(0, 80), q: name.trim().slice(0, 100), category }); setPage(1); }} />
    </Card>
    {error && <Notice error>{error}</Notice>}
    {data && (data.providers.length ? <Card>{data.providers.slice(0, 20).map((provider) =>
      <Row key={provider.id} title={provider.display_name} subtitle={[provider.city, provider.districts.join(", ")].filter(Boolean).join(" · ")}
        right={provider.rating == null ? undefined : `${provider.rating} / 5`}
        onPress={() => router.push({ pathname: "/hizmet/usta/[id]", params: { id: provider.id } })} />)}
      {page > 1 && <Button title="Önceki sayfa" quiet onPress={() => setPage(page - 1)} />}
      {data.providers.length > 20 && page < 101 && <Button title="Sonraki sayfa" quiet onPress={() => setPage(page + 1)} />}
    </Card> : <Empty title="Usta bulunamadı" detail="Bölgeni veya hizmet seçimini değiştir ya da bir iş ilanı aç." />)}
    {session && <Card>
      <ServiceText>{session.user.email}</ServiceText>
      <Button title="Hesap silme" quiet onPress={() => router.push("/account/delete")} />
      <Button title="Çıkış yap" quiet onPress={async () => { await db().auth.signOut(); await refresh(); router.replace("/"); }} />
    </Card>}
  </Screen>;
}
