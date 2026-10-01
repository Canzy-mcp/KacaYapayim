import { useEffect, useState } from "react";
import { router } from "expo-router";
import { Text } from "react-native";
import type { Profession } from "@kacayapayim/core/types";
import { validateMargins } from "@kacayapayim/core/pricing";
import { Button, Choice, Field, Notice, Screen, SectionTitle } from "@/src/components/ui";
import { db } from "@/src/lib/supabase";
import { useAppSession } from "@/src/lib/session";
import { errorText, numberFromInput } from "@/src/lib/format";

export default function Onboarding() {
  const { session, business, refresh } = useAppSession();
  const [name, setName] = useState(business?.name || "");
  const [phone, setPhone] = useState(business?.phone || ""); const [city, setCity] = useState(business?.city || "");
  const [professionId, setProfessionId] = useState(business?.profession_id || "");
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [target, setTarget] = useState(String(business?.default_profit_margin ?? 30));
  const [minimum, setMinimum] = useState(String(business?.minimum_profit_margin ?? 20));
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => {
    void db().from("professions").select("*").eq("is_active", true).eq("is_public", true)
      .not("current_version", "is", null).order("sort_order")
      .then(({ data }) => setProfessions(data || []));
  }, []);
  async function save() {
    setError("");
    const profession = professions.find(item => item.id === professionId);
    const targetNumber = numberFromInput(target), minimumNumber = numberFromInput(minimum);
    if (!name.trim() || name.trim().length > 120 || !profession || !validateMargins(targetNumber, minimumNumber)) {
      setError("İşletme adı, meslek ve kâr marjlarını kontrol et."); return;
    }
    if (!session) { setError("Oturumun sona erdi."); return; }
    setBusy(true);
    try {
      const values = { name: name.trim(), phone: phone.trim() || null, city: city.trim() || null,
        profession: profession.name, profession_id: profession.id, default_profit_margin: targetNumber,
        minimum_profit_margin: minimumNumber, onboarding_step: 4 as const, onboarding_completed: true };
      const result = business ? await db().from("businesses").update(values).eq("id", business.id).eq("owner_id", session.user.id)
        : await db().from("businesses").insert({ ...values, owner_id: session.user.id });
      if (result.error) throw result.error;
      await refresh(); router.replace("/(tabs)");
    } catch (cause) { setError(errorText(cause)); } finally { setBusy(false); }
  }
  return <Screen title="İşini hazırlayalım." subtitle="Aynı işletme web ve mobilde seninle kalır.">
    <Field label="İşletme adı" value={name} onChangeText={setName} />
    <Field label="Telefon (isteğe bağlı)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
    <Field label="Şehir (isteğe bağlı)" value={city} onChangeText={setCity} />
    <SectionTitle>Mesleğin</SectionTitle>
    {professions.length ? professions.map(item => <Choice key={item.id} title={item.name}
      selected={professionId === item.id} onPress={() => setProfessionId(item.id)} />)
      : <Notice>Yayınlanmış meslek şablonu yüklenemedi. İnternet bağlantını kontrol et.</Notice>}
    <SectionTitle>Kâr hedefin</SectionTitle>
    <Text style={{ color: "#6E6E73", marginBottom: 16 }}>Satış fiyatı bu oranlarla hesaplanır.</Text>
    <Field label="Hedef kâr marjı (%)" value={target} onChangeText={setTarget} keyboardType="decimal-pad" />
    <Field label="Minimum kâr marjı (%)" value={minimum} onChangeText={setMinimum} keyboardType="decimal-pad" />
    {Boolean(error) && <Notice error>{error}</Notice>}
    <Button title={busy ? "Kaydediliyor..." : "İşletmeyi Hazırla"} onPress={save} disabled={busy || !professions.length} />
    <Button title="Çıkış Yap" quiet onPress={async () => { await db().auth.signOut(); router.replace("/"); }} />
  </Screen>;
}
