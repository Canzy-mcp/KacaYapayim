import { useEffect, useState } from "react";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { Button, Loading, Notice, Screen } from "@/src/components/ui";
import { hasPendingMarketSignup, takeMarketSignup } from "@/src/lib/market-signup";
import { db } from "@/src/lib/supabase";
import { useAppSession } from "@/src/lib/session";

export default function Callback() {
  const { code, next, token_hash, type } = useLocalSearchParams<{ code?: string; next?: string; token_hash?: string; type?: string }>();
  const { refresh } = useAppSession();
  const [error, setError] = useState(false);
  const [marketSignup, setMarketSignup] = useState(false);

  useEffect(() => {
    let active = true;
    const recovery = next === "reset" || type === "recovery";

    async function finish() {
      try {
        const result = typeof code === "string" && code ? await db().auth.exchangeCodeForSession(code) :
          typeof token_hash === "string" && token_hash && typeof type === "string" && type
            ? await db().auth.verifyOtp({ token_hash, type: type as "recovery" | "signup" }) : null;
        if (!result || result.error) throw new Error("Unable to verify the callback");
        await refresh();
        if (!active) return;
        const destination = recovery ? undefined : await takeMarketSignup(result.data.session?.user.id);
        if (!active) return;
        if (destination) router.dismissTo(destination as Href);
        else router.replace(next === "reset" ? "/reset-password" : "/");
      } catch {
        const pending = !recovery && await hasPendingMarketSignup();
        if (active) { setMarketSignup(pending); setError(true); }
      }
    }

    void finish();
    return () => { active = false; };
  }, [code, token_hash, type, next, refresh]);

  if (!error) return <Loading />;
  if (marketSignup) return <Screen title="Giriş yaparak devam et" subtitle="Hesabını e-postandaki bağlantıyla doğruladıysan giriş yap.">
    <Button title="Giriş yap" onPress={() => router.replace("/(auth)/login")} />
  </Screen>;
  return <Screen title="Bağlantı açılamadı"><Notice error>Bağlantı geçersiz veya süresi dolmuş.</Notice></Screen>;
}
