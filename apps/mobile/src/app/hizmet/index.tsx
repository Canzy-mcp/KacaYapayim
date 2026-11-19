import { useCallback, useState } from "react";
import { router } from "expo-router";
import { StyleSheet, Text } from "react-native";
import { Button, Card, Empty, Field, Notice, Row, SectionTitle, palette } from "@/src/components/ui";
import { ServiceCategories, ServiceLoadState, ServiceScreen, ServiceText, useMarketLoad } from "@/src/components/marketplace";
import { directory } from "@/src/lib/marketplace";
import { useAppSession } from "@/src/lib/session";
import { db } from "@/src/lib/supabase";

export default function ServiceHome() {
  const { session, business, loading, requiresMfa, refresh } = useAppSession();
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [showCategories, setShowCategories] = useState(false);
  const [filters, setFilters] = useState({ city: "", district: "", q: "", category: "" });
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [accountError, setAccountError] = useState("");
  const results = useMarketLoad(useCallback(() => directory({ ...filters, page: String(page) }), [filters, page]));
  const { data } = results;
  const filtered = Object.values(filters).some(Boolean);
  const categoryName = data?.categories.find((item) => item.slug === category)?.name;

  function search() {
    setFilters({ city: city.trim().slice(0, 80), district: district.trim().slice(0, 80), q: name.trim().slice(0, 100), category });
    setShowCategories(false);
    setShowFilters(false);
    setPage(1);
  }

  async function signOut() {
    setSigningOut(true);
    setAccountError("");
    try {
      const { error } = await db().auth.signOut();
      if (error) throw error;
      await refresh();
      router.replace("/");
    } catch {
      setAccountError("Çıkış yapılamadı. Tekrar dene.");
    } finally {
      setSigningOut(false);
    }
  }

  return <ServiceScreen home title="Usta bul" subtitle="Yakınındaki ustaları incele veya işini anlatıp teklif al.">
    <Card style={styles.hero}>
      <Text accessibilityRole="header" style={styles.heroTitle}>İşin için teklif al</Text>
      <Text style={styles.heroDetail}>İhtiyacını ve konumunu paylaş. Gelen teklifleri karşılaştır.</Text>
      <Button title="İş ilanı ver" onPress={() => router.push("/hizmet/yeni")} />
      {session && !requiresMfa && <Button title="Taleplerim" quiet onPress={() => router.push("/hizmet/talepler")} />}
    </Card>

    <SectionTitle>Usta rehberi</SectionTitle>
    <Card>
      <Field label="Usta adı" value={name} onChangeText={setName} placeholder="Ada göre ara" />
      <Button title={showFilters ? "Konum ve hizmeti gizle" : "Konum ve hizmet seç"} quiet onPress={() => setShowFilters(!showFilters)} />
      {showFilters && <>
        <Field label="İl" value={city} onChangeText={setCity} placeholder="İstanbul" />
        <Field label="İlçe" value={district} onChangeText={setDistrict} placeholder="Kadıköy" />
        <Button title={categoryName ?? "Hizmet kategorisi seç"} quiet disabled={!data} onPress={() => setShowCategories(!showCategories)} />
        {showCategories && data && <ServiceCategories categories={data.categories} selected={[category]} toggle={(key) => {
          setCategory(key === category ? "" : key);
          setShowCategories(false);
        }} />}
      </>}
      <Button title="Ustaları ara" onPress={search} />
      {filtered && <Button title="Filtreleri temizle" quiet onPress={() => {
        setCity(""); setDistrict(""); setName(""); setCategory("");
        setFilters({ city: "", district: "", q: "", category: "" });
        setPage(1);
      }} />}
    </Card>

    {filtered && <ServiceText>{[filters.q, filters.city, filters.district, data?.categories.find((item) => item.slug === filters.category)?.name].filter(Boolean).join(" · ")}</ServiceText>}
    <ServiceLoadState {...results} />
    {data && (data.providers.length ? <Card>{data.providers.slice(0, 20).map((provider) =>
      <Row key={provider.id} title={provider.display_name}
        subtitle={[provider.city, data.categories.filter((item) => provider.categories.includes(item.slug)).map((item) => item.name).join(", ")].filter(Boolean).join(" · ")}
        right={provider.rating == null ? undefined : `${provider.rating} / 5`}
        onPress={() => router.push({ pathname: "/hizmet/usta/[id]", params: { id: provider.id } })} />)}
    </Card> : <Empty title="Usta bulunamadı" detail={filtered ? "Aramana uygun usta yok. Filtreleri değiştir veya bir iş ilanı ver." : "Rehberde şu anda usta yok. Bir iş ilanı vererek teklif isteyebilirsin."} />)}
    {page > 1 && <Button title="Önceki sayfa" quiet onPress={() => setPage(page - 1)} />}
    {data && data.providers.length > 20 && page < 101 && <Button title="Sonraki sayfa" quiet onPress={() => setPage(page + 1)} />}

    {!loading && <SectionTitle>Hesabım</SectionTitle>}
    {!loading && (session ? <Card>
      {requiresMfa ? <Button title="Girişini doğrula" onPress={() => router.push({ pathname: "/mfa", params: { next: "/hizmet" } })} /> : <>
        <Row title="Favori ustalar" onPress={() => router.push({ pathname: "/hizmet/talepler", params: { gorunum: "favorites" } })} />
        <Row title="Bildirimler" onPress={() => router.push({ pathname: "/hizmet/talepler", params: { gorunum: "notices" } })} />
        {business?.onboarding_completed ? <>
          <Row title="Usta talepleri" onPress={() => router.push({ pathname: "/hizmet/talepler", params: { gorunum: "feed" } })} />
          <Row title="Usta tekliflerim ve işlerim" onPress={() => router.push({ pathname: "/hizmet/talepler", params: { gorunum: "work" } })} />
          <Row title="Herkese açık usta profilim" onPress={() => router.push("/hizmet/profil")} />
          <Row title="Usta paneli" onPress={() => router.push("/(tabs)")} />
        </> : <Row title="Usta olarak başla" onPress={() => router.push({ pathname: "/onboarding", params: { usta: "1" } })} />}
      </>}
      <ServiceText>{session.user.email}</ServiceText>
      <Button title="Hesap silme" quiet onPress={() => router.push("/account/delete")} />
      <Button title={signingOut ? "Çıkış yapılıyor…" : "Çıkış yap"} quiet disabled={signingOut} onPress={signOut} />
      {accountError && <Notice error>{accountError}</Notice>}
    </Card> : <Card><Button title="Giriş yap" quiet onPress={() => router.push({ pathname: "/(auth)/login", params: { next: "/hizmet" } })} /></Card>)}
  </ServiceScreen>;
}

const styles = StyleSheet.create({
  hero: { backgroundColor: "#EAF3FF", borderColor: "#D7E8FC", padding: 22, paddingTop: 24 },
  heroTitle: { color: palette.text, fontSize: 25, fontWeight: "700", letterSpacing: -0.7 },
  heroDetail: { color: "#3A5572", fontSize: 15, lineHeight: 22, marginTop: 6, marginBottom: 4 },
});
