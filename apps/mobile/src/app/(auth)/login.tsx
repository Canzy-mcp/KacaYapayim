import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Text } from "react-native";
import { Button, Field, Notice, Screen } from "@/src/components/ui";
import { db } from "@/src/lib/supabase";
import { errorText } from "@/src/lib/format";
import { useAppSession } from "@/src/lib/session";

export default function Login() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const { refresh } = useAppSession();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function login() {
    setError(""); setBusy(true);
    try {
      const { error: authError } = await db().auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (authError) throw new Error("E-posta veya şifre hatalı.");
      await refresh();
      const destination = next && /^\/(job|quote)\/[0-9a-f-]{36}$/i.test(next) ? next : "/";
      router.replace(destination as never);
    } catch (cause) { setError(errorText(cause)); } finally { setBusy(false); }
  }
  return <Screen title="Hoş geldin." subtitle="İşlerini kaldığın yerden yönet.">
    <Field label="E-posta" value={email} onChangeText={setEmail} keyboardType="email-address"
      autoCapitalize="none" textContentType="emailAddress" />
    <Field label="Şifre" value={password} onChangeText={setPassword} secureTextEntry textContentType="password" />
    {Boolean(error) && <Notice error>{error}</Notice>}
    <Button title={busy ? "Giriş yapılıyor..." : "Giriş Yap"} disabled={busy} onPress={login} />
    <Button title="Şifremi Unuttum" quiet onPress={() => router.push("/(auth)/forgot")} />
    <Text style={{ textAlign: "center", marginTop: 26, color: "#6E6E73" }}>Henüz hesabın yok mu?</Text>
    <Button title="Ücretsiz Başla" quiet onPress={() => router.push("/(auth)/register")} />
  </Screen>;
}
