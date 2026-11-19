import { useState } from "react";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { Text } from "react-native";
import { Button, Field, Notice, Screen } from "@/src/components/ui";
import { db } from "@/src/lib/supabase";
import { errorText } from "@/src/lib/format";
import { useAppSession } from "@/src/lib/session";
import { takeMarketSignup } from "@/src/lib/market-signup";
import { marketReturnPath } from "@/src/lib/marketplace";

export default function Login() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const marketDestination = marketReturnPath(next);
  const { refresh } = useAppSession();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function login() {
    setError(""); setBusy(true);
    try {
      const { data, error: authError } = await db().auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (authError || !data.session) throw new Error("E-posta veya şifre hatalı.");
      await refresh();
      const destination = typeof next === "string" && /^\/(job|quote)\/[0-9a-f-]{36}$/i.test(next) ? next : "/";
      const pending = destination === "/" ? await takeMarketSignup(data.session.user.id) : undefined;
      const servicePath = marketDestination ?? pending;
      if (servicePath) {
        router.dismissTo(servicePath as Href);
        return;
      }
      router.replace(destination as Href);
    } catch (cause) { setError(errorText(cause)); } finally { setBusy(false); }
  }
  return <Screen title="Hoş geldin." subtitle="Taleplerini, tekliflerini ve işlerini yönet.">
    <Field label="E-posta" value={email} onChangeText={setEmail} keyboardType="email-address"
      autoCapitalize="none" textContentType="emailAddress" />
    <Field label="Şifre" value={password} onChangeText={setPassword} secureTextEntry textContentType="password" />
    {Boolean(error) && <Notice error>{error}</Notice>}
    <Button title={busy ? "Giriş yapılıyor..." : "Giriş Yap"} disabled={busy} onPress={login} />
    <Button title="Şifremi Unuttum" quiet onPress={() => router.push("/(auth)/forgot")} />
    <Text style={{ textAlign: "center", marginTop: 26, color: "#6E6E73" }}>Henüz hesabın yok mu?</Text>
    <Button title="Ücretsiz Başla" quiet onPress={() => {
      if (marketDestination) router.push({ pathname: "/(auth)/register", params: { hesap: "musteri", next: marketDestination } });
      else router.push("/(auth)/register");
    }} />
    <Button title="Usta arıyorum" quiet onPress={() => router.push("/hizmet")} />
  </Screen>;
}
