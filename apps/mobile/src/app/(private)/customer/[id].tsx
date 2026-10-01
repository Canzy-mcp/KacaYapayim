import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import type { Customer } from "@kacayapayim/core/types";
import { Button, Card, Field, Notice, Screen } from "@/src/components/ui";
import { useAppSession } from "@/src/lib/session";
import { db } from "@/src/lib/supabase";

export default function CustomerDetail() {
  const { id } = useLocalSearchParams<{ id: string }>(); const { business } = useAppSession();
  const [item, setItem] = useState<Customer | null>(null); const [name, setName] = useState("");
  const [phone, setPhone] = useState(""); const [company, setCompany] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (!business || !id) return;
    void db().from("customers").select("*").eq("id", id).eq("business_id", business.id).maybeSingle()
      .then(({ data }) => { setItem(data); setName(data?.name || ""); setPhone(data?.phone || ""); setCompany(data?.company_name || ""); });
  }, [business, id]);
  async function save() {
    if (!item || !business || !name.trim()) return;
    const { error: saveError } = await db().from("customers").update({ name: name.trim(), phone: phone.trim() || null,
      company_name: company.trim() || null }).eq("id", item.id).eq("business_id", business.id);
    if (saveError) setError("Değişiklikler kaydedilemedi."); else { setError(""); router.back(); }
  }
  function archive() {
    if (!item || !business) return;
    Alert.alert("Müşteriyi arşivle", "Müşteri listenden kaldırılacak. Teklif geçmişi korunur.", [
      { text: "Vazgeç", style: "cancel" }, { text: "Arşivle", style: "destructive", onPress: async () => {
        const { error: archiveError } = await db().from("customers").update({ is_archived: true })
          .eq("id", item.id).eq("business_id", business.id);
        if (archiveError) setError("Müşteri arşivlenemedi."); else router.back();
      } },
    ]);
  }
  return <Screen title={item?.name || "Müşteri"} subtitle="Müşteri bilgilerini güncelle.">
    {!item ? <Notice>Müşteri bulunamadı veya yüklenemedi.</Notice> : <Card>
      <Field label="Ad soyad" value={name} onChangeText={setName} />
      <Field label="Şirket" value={company} onChangeText={setCompany} />
      <Field label="Telefon" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      {Boolean(error) && <Notice error>{error}</Notice>}<Button title="Değişiklikleri Kaydet" onPress={save} />
      <Button title="Arşivle" quiet onPress={archive} />
    </Card>}
  </Screen>;
}
