import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Field, Notice, Screen } from "@/src/components/ui";
import { useAppSession } from "@/src/lib/session";
import { db } from "@/src/lib/supabase";

export default function NewCustomer() {
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { business } = useAppSession(); const [name, setName] = useState("");
  const [phone, setPhone] = useState(""); const [email, setEmail] = useState("");
  const [company, setCompany] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function save() {
    if (!business || !name.trim() || name.length > 120 || phone.length > 40 || email.length > 254) {
      setError("Müşteri bilgilerini kontrol et."); return;
    }
    setBusy(true); setError("");
    const { data, error: saveError } = await db().from("customers").insert({ business_id: business.id,
      name: name.trim(), phone: phone.trim() || null, email: email.trim().toLowerCase() || null,
      company_name: company.trim() || null }).select("id").single();
    setBusy(false);
    if (saveError || !data) { setError(saveError?.message.includes("BILLING_CUSTOMER_LIMIT")
      ? "Paketindeki aktif müşteri sınırına ulaştın." : "Müşteri kaydedilemedi. Tekrar dene."); return; }
    if (returnTo === "job") router.replace("/job/new");
    else router.replace({ pathname: "/customer/[id]", params: { id: data.id } });
  }
  return <Screen title="Müşteri ekle" subtitle="Teklif bilgilerini sonra da tamamlayabilirsin.">
    <Field label="Ad soyad" value={name} onChangeText={setName} />
    <Field label="Şirket (isteğe bağlı)" value={company} onChangeText={setCompany} />
    <Field label="Telefon (isteğe bağlı)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
    <Field label="E-posta (isteğe bağlı)" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
    {Boolean(error) && <Notice error>{error}</Notice>}<Button title={busy ? "Kaydediliyor..." : "Müşteriyi Kaydet"} onPress={save} disabled={busy} />
    <Button title="Geri" quiet onPress={() => router.back()} />
  </Screen>;
}
