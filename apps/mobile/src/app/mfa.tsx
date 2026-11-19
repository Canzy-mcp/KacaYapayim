import { useEffect, useState } from "react";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { Button, Field, Notice, Screen } from "@/src/components/ui";
import { marketReturnPath } from "@/src/lib/marketplace";
import { useAppSession } from "@/src/lib/session";
import { db } from "@/src/lib/supabase";

export default function Mfa() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const { refresh } = useAppSession();
  const [factor, setFactor] = useState("");
  const [factors, setFactors] = useState<{ id: string; friendly_name?: string }[]>([]);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void db().auth.mfa.listFactors().then((result) => {
      if (result.error) {
        setError("Doğrulama yöntemleri yüklenemedi.");
      } else {
        setFactors(result.data.totp);
        setFactor(result.data.totp[0]?.id || "");
      }
    });
  }, []);

  async function verify() {
    setBusy(true);
    setError("");
    try {
      const challenge = await db().auth.mfa.challenge({ factorId: factor });
      if (challenge.error) throw challenge.error;
      const result = await db().auth.mfa.verify({ factorId: factor, challengeId: challenge.data.id, code });
      if (result.error) throw result.error;
      await refresh();
      const destination = marketReturnPath(next);
      if (destination) router.dismissTo(destination as Href);
      else router.replace("/");
    } catch {
      setError("Kod doğrulanamadı. Güncel kodla tekrar dene.");
    } finally {
      setBusy(false);
    }
  }

  return <Screen title="Girişini doğrula" subtitle="Authenticator uygulamandaki güncel kodu gir.">
    {factors.length > 1 && factors.map((item) => <Button key={item.id}
      title={(factor === item.id ? "✓ " : "") + (item.friendly_name || "Authenticator")} quiet disabled={busy}
      onPress={() => { setFactor(item.id); setCode(""); }} />)}
    <Field label="6 haneli kod" value={code} onChangeText={(value) => setCode(value.replace(/\D/g, "").slice(0, 6))}
      keyboardType="number-pad" />
    {!!error && <Notice error>{error}</Notice>}
    <Button title={busy ? "Doğrulanıyor…" : "Doğrula"} disabled={busy || code.length !== 6 || !factor} onPress={verify} />
    <Button title="Çıkış yap" quiet onPress={async () => { await db().auth.signOut(); router.replace("/"); }} />
  </Screen>;
}
