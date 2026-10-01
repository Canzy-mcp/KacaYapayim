import { useCallback, useState } from "react";
import { Linking, Text } from "react-native";
import Constants from "expo-constants";
import { router, useFocusEffect } from "expo-router";
import type { Subscription } from "@kacayapayim/core/types";
import { validateMargins } from "@kacayapayim/core/pricing";
import { Button, Card, Field, Notice, Row, Screen, SectionTitle, palette } from "@/src/components/ui";
import { useAppSession } from "@/src/lib/session";
import { db } from "@/src/lib/supabase";
import { numberFromInput } from "@/src/lib/format";

export default function Settings() {
  const { session, business, profile, refresh } = useAppSession();
  const [name, setName] = useState(business?.name || ""); const [phone, setPhone] = useState(business?.phone || "");
  const [city, setCity] = useState(business?.city || "");
  const [target, setTarget] = useState(String(business?.default_profit_margin ?? 30));
  const [minimum, setMinimum] = useState(String(business?.minimum_profit_margin ?? 20));
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [error, setError] = useState(""); const [message, setMessage] = useState("");
  useFocusEffect(useCallback(() => {
    if (!business) return;
    setName(business.name); setPhone(business.phone || ""); setCity(business.city || "");
    setTarget(String(business.default_profit_margin)); setMinimum(String(business.minimum_profit_margin));
    void db().from("subscriptions").select("*").eq("business_id", business.id).maybeSingle()
      .then(({ data }) => setSubscription(data));
  }, [business]));
  async function save() {
    if (!business || !name.trim()) return;
    const t = numberFromInput(target), m = numberFromInput(minimum);
    if (!validateMargins(t, m)) { setError("Kâr marjlarını kontrol et."); return; }
    const { error: saveError } = await db().from("businesses").update({ name: name.trim(), phone: phone.trim() || null,
      city: city.trim() || null, default_profit_margin: t, minimum_profit_margin: m })
      .eq("id", business.id).eq("owner_id", session!.user.id);
    if (saveError) setError("Ayarlar kaydedilemedi.");
    else { setError(""); setMessage("Ayarların kaydedildi."); await refresh(); }
  }
  const plan = subscription && ["active", "trialing", "past_due"].includes(subscription.status) &&
    subscription.current_period_end && new Date(subscription.current_period_end) > new Date()
    ? subscription.plan_id : "free";
  const webUrl = process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/$/, "");
  const openWeb = (path: string) => { if (webUrl) void Linking.openURL(`${webUrl}${path}`); };
  return <Screen title="Ayarlar" subtitle={profile?.email || business?.name || ""}>
    <Card><Row title="Profil" subtitle={[profile?.first_name, profile?.last_name].filter(Boolean).join(" ")}
      onPress={() => router.push("/profile")} /></Card>
    <Card><Row title="Maliyetlerim" subtitle="Malzeme, işçilik ve diğer birim fiyatlar" onPress={() => router.push("/costs")} />
      <Row title="Yardım ve rehber" onPress={() => openWeb("/rehber")} /></Card>
    <SectionTitle>İşletme</SectionTitle>
    <Card><Field label="İşletme adı" value={name} onChangeText={setName} />
      <Field label="Telefon" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Field label="Şehir" value={city} onChangeText={setCity} />
      <Field label="Hedef kâr marjı (%)" value={target} onChangeText={setTarget} keyboardType="decimal-pad" />
      <Field label="Minimum kâr marjı (%)" value={minimum} onChangeText={setMinimum} keyboardType="decimal-pad" />
      <Text style={{ color: palette.muted }}>Meslek: {business?.profession || "—"}</Text>
      {Boolean(error) && <Notice error>{error}</Notice>}{Boolean(message) && <Notice>{message}</Notice>}
      <Button title="Ayarları Kaydet" onPress={() => { void save(); }} /></Card>
    <SectionTitle>Abonelik</SectionTitle>
    <Card><Row title="Paket" right={plan === "free" ? "Ücretsiz" : plan === "usta" ? "Usta" : "Pro"} />
      <Text style={{ color: palette.muted, lineHeight: 21, marginTop: 12 }}>
        Mobil mağaza ödemeleri henüz etkin değil. Mevcut aboneliğin web ve mobilde aynı işletmeye bağlıdır.
      </Text></Card>
    <SectionTitle>Yardım ve güvenlik</SectionTitle>
    <Card><Row title="İletişim" onPress={() => openWeb("/iletisim")} />
      <Row title="Gizlilik" onPress={() => openWeb("/gizlilik")} />
      <Row title="Kullanım koşulları" onPress={() => openWeb("/kullanim-kosullari")} />
      <Row title="Şifremi sıfırla" onPress={() => router.push("/(auth)/forgot")} /></Card>
    <Notice>Bildirim izni istenmiyor. Teklif ve iş durumlarını uygulamayı açtığında güncel olarak görürsün.</Notice>
    <Button title="Geri Bildirim Gönder" quiet onPress={() => router.push("/feedback")} />
    <Button title="Hesabımı Sil" quiet onPress={() => router.push("/account/delete")} />
    <Button title="Çıkış Yap" quiet onPress={async () => { await db().auth.signOut(); router.replace("/"); }} />
    <Text style={{ color: palette.muted, textAlign: "center", fontSize: 12, marginTop: 20 }}>
      KaçaYapayım v{Constants.expoConfig?.version || "1.0.0"}
    </Text>
  </Screen>;
}
