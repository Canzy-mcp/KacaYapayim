import { useState } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { Button, Field, Notice, Screen } from "@/src/components/ui";
import { db } from "@/src/lib/supabase";

export default function DeleteAccount() {
  const [confirmation, setConfirmation] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  function confirm() {
    if (confirmation !== "HESABIMI SIL") { setError("Onay metnini aynen yaz."); return; }
    Alert.alert("Hesabı kalıcı olarak sil", "İşletmen, müşterilerin, işlerin ve tekliflerin silinir. Bu işlem geri alınamaz.", [
      { text: "Vazgeç", style: "cancel" }, { text: "Hesabımı Sil", style: "destructive", onPress: () => { void remove(); } },
    ]);
  }
  async function remove() {
    const origin = process.env.EXPO_PUBLIC_API_URL;
    if (!origin) { setError("Sunucu adresi ayarlanmamış."); return; }
    setBusy(true); setError("");
    try {
      const { data } = await db().auth.getSession();
      if (!data.session) throw new Error("Oturum sona erdi.");
      const response = await fetch(`${origin.replace(/\/$/, "")}/api/mobile/account`, {
        method: "DELETE", headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` },
        body: JSON.stringify({ confirmation, password }),
      });
      const result = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "Hesap silinemedi.");
      await db().auth.signOut(); router.replace("/");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Hesap silinemedi."); }
    finally { setBusy(false); }
  }
  return <Screen title="Hesabımı Sil" subtitle="Bu işlem kalıcıdır. İşlerini ve tekliflerini kaybedersin.">
    <Notice>Aktif ücretli aboneliğin varsa önce iptal edilmesi gerekir. Hesap silme işlemi bunu kontrol eder.</Notice>
    <Field label="Onaylamak için HESABIMI SIL yaz" value={confirmation} onChangeText={setConfirmation} autoCapitalize="characters" />
    <Field label="Güncel parolan" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />
    {Boolean(error) && <Notice error>{error}</Notice>}
    <Button title={busy ? "Siliniyor..." : "Hesabımı Kalıcı Olarak Sil"} danger disabled={busy || confirmation !== "HESABIMI SIL"} onPress={confirm} />
    <Button title="Vazgeç" quiet onPress={() => router.back()} />
  </Screen>;
}
