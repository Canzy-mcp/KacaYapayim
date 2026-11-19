import { useState } from "react";
import { router, useLocalSearchParams, type Href } from "expo-router";
import * as Linking from "expo-linking";
import { Button, Choice, Field, Notice, Screen } from "@/src/components/ui";
import { db } from "@/src/lib/supabase";
import { errorText } from "@/src/lib/format";
import { useAppSession } from "@/src/lib/session";
import { rememberMarketSignup } from "@/src/lib/market-signup";
import { marketReturnPath } from "@/src/lib/marketplace";

export default function Register() {
  const { refresh } = useAppSession();
  const { hesap, next } = useLocalSearchParams<{ hesap?: string; next?: string }>();
  const marketDestination = marketReturnPath(next);
  const [account, setAccount] = useState<"customer" | "provider">(hesap === "usta" ? "provider" : "customer");
  const [first, setFirst] = useState(""); const [last, setLast] = useState("");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState(""); const [message, setMessage] = useState("");
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function register() {
    setError(""); setMessage("");
    if (!first.trim() || !last.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || password !== confirm) {
      setError("Ad, soyad, geçerli e-posta ve eşleşen en az 8 karakterlik şifre gir."); return;
    }
    setBusy(true);
    try {
      const { data, error: authError } = await db().auth.signUp({ email: email.trim().toLowerCase(), password,
        options: { data: { first_name: first.trim(), last_name: last.trim(), account_preference: account },
          emailRedirectTo: Linking.createURL("auth/callback") } });
      if (authError) throw authError;
      if (data.session) {
        await refresh();
        if (marketDestination) router.dismissTo(marketDestination as Href);
        else if (account === "provider") router.replace({ pathname: "/onboarding", params: { usta: "1" } });
        else router.replace("/hizmet");
      } else {
        if (marketDestination && data.user) await rememberMarketSignup(data.user.id, marketDestination);
        setMessage(marketDestination ? "E-postandaki bağlantıyla hesabını doğrula. Gerekirse giriş yaparak kaldığın yerden devam edebilirsin."
          : "Hesabını doğrulamak için e-posta kutunu kontrol et.");
      }
    } catch (cause) { setError(errorText(cause)); } finally { setBusy(false); }
  }
  return <Screen title="Ücretsiz başla." subtitle="Web hesabın varsa aynı e-posta ile giriş yap.">
    <Choice title="Usta arıyorum" selected={account === "customer"} onPress={() => setAccount("customer")} />
    <Choice title="Ustayım" selected={account === "provider"} onPress={() => setAccount("provider")} />
    <Field label="Ad" value={first} onChangeText={setFirst} textContentType="givenName" />
    <Field label="Soyad" value={last} onChangeText={setLast} textContentType="familyName" />
    <Field label="E-posta" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
    <Field label="Şifre" value={password} onChangeText={setPassword} secureTextEntry />
    <Field label="Şifre tekrar" value={confirm} onChangeText={setConfirm} secureTextEntry />
    {Boolean(error) && <Notice error>{error}</Notice>}{Boolean(message) && <Notice>{message}</Notice>}
    <Button title={busy ? "Hesap açılıyor..." : "Ücretsiz Başla"} onPress={register} disabled={busy} />
    <Button title="Giriş Yap" quiet onPress={() => {
      if (marketDestination) router.dismissTo({ pathname: "/(auth)/login", params: { next: marketDestination } });
      else router.back();
    }} />
  </Screen>;
}
