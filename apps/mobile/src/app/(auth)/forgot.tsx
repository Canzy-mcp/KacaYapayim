import { useState } from "react";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import { Button, Field, Notice, Screen } from "@/src/components/ui";
import { db } from "@/src/lib/supabase";

export default function Forgot() {
  const [email, setEmail] = useState(""); const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  async function send() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setBusy(true);
    await db().auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: Linking.createURL("auth/callback?next=reset") });
    setSent(true); setBusy(false);
  }
  return <Screen title="Şifreni sıfırla." subtitle="Bağlantıyı e-posta adresine göndereceğiz.">
    <Field label="E-posta" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
    {sent && <Notice>E-posta adresin kayıtlıysa sıfırlama bağlantısını gönderdik.</Notice>}
    <Button title={busy ? "Gönderiliyor..." : "Bağlantı Gönder"} disabled={busy} onPress={send} />
    <Button title="Girişe Dön" quiet onPress={() => router.back()} />
  </Screen>;
}
