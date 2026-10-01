import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Loading, Notice, Screen } from "@/src/components/ui";
import { db } from "@/src/lib/supabase";
import { useAppSession } from "@/src/lib/session";

export default function Callback() {
  const { code, next, token_hash, type } = useLocalSearchParams<{ code?: string; next?: string; token_hash?: string; type?: string }>();
  const { refresh } = useAppSession(); const [error, setError] = useState("");
  useEffect(() => {
    async function finish() {
      const result = code ? await db().auth.exchangeCodeForSession(code) :
        token_hash && type ? await db().auth.verifyOtp({ token_hash, type: type as "recovery" | "signup" }) : null;
      if (!result || result.error) { setError("Bağlantı geçersiz veya süresi dolmuş."); return; }
      await refresh(); router.replace(next === "reset" ? "/reset-password" : "/");
    }
    void finish();
  }, [code, token_hash, type, next, refresh]);
  return error ? <Screen title="Bağlantı açılamadı"><Notice error>{error}</Notice></Screen> : <Loading />;
}
