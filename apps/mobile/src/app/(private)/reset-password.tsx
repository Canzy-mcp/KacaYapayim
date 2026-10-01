import { useState } from "react";
import { router } from "expo-router";
import { Button, Field, Notice, Screen } from "@/src/components/ui";
import { db } from "@/src/lib/supabase";

export default function ResetPassword() {
  const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  async function save() {
    if (password.length < 8 || password !== confirm) { setError("Şifreleri kontrol et."); return; }
    const { error: updateError } = await db().auth.updateUser({ password });
    if (updateError) { setError("Şifre güncellenemedi. Yeni bağlantı iste."); return; }
    await db().auth.signOut(); router.replace("/(auth)/login");
  }
  return <Screen title="Yeni şifren." subtitle="Hesabını güvenle açmak için yeni şifreni belirle.">
    <Field label="Yeni şifre" value={password} onChangeText={setPassword} secureTextEntry />
    <Field label="Şifre tekrar" value={confirm} onChangeText={setConfirm} secureTextEntry />
    {Boolean(error) && <Notice error>{error}</Notice>}<Button title="Şifreyi Güncelle" onPress={save} />
  </Screen>;
}
