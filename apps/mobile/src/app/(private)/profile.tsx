import { useState } from "react";
import { router } from "expo-router";
import { Button, Field, Notice, Screen } from "@/src/components/ui";
import { useAppSession } from "@/src/lib/session";
import { db } from "@/src/lib/supabase";

export default function Profile() {
  const { session, profile, refresh } = useAppSession();
  const [first, setFirst] = useState(profile?.first_name || "");
  const [last, setLast] = useState(profile?.last_name || "");
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function save() {
    if (!session || !first.trim() || !last.trim() || first.length > 100 || last.length > 100) {
      setError("Ad ve soyadını kontrol et."); return;
    }
    setBusy(true); setError("");
    const { error: saveError } = await db().from("profiles").update({ first_name: first.trim(), last_name: last.trim() })
      .eq("id", session.user.id);
    setBusy(false);
    if (saveError) setError("Profil kaydedilemedi."); else { await refresh(); router.back(); }
  }
  return <Screen title="Profil" subtitle="Adın teklif yönetimi hesabında görünür.">
    <Field label="Ad" value={first} onChangeText={setFirst} />
    <Field label="Soyad" value={last} onChangeText={setLast} />
    {Boolean(error) && <Notice error>{error}</Notice>}
    <Button title={busy ? "Kaydediliyor..." : "Kaydet"} disabled={busy} onPress={() => { void save(); }} />
    <Button title="Geri" quiet onPress={() => router.back()} />
  </Screen>;
}
