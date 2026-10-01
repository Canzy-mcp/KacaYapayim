import { useState } from "react";
import { router } from "expo-router";
import { Button, Choice, Field, Notice, Screen } from "@/src/components/ui";
import { useAppSession } from "@/src/lib/session";
import { db } from "@/src/lib/supabase";

export default function Feedback() {
  const { business, session } = useAppSession();
  const [type, setType] = useState<"bug" | "idea" | "general">("general");
  const [message, setMessage] = useState(""); const [error, setError] = useState(""); const [sent, setSent] = useState(false);
  async function send() {
    if (!business || !session || !message.trim() || message.length > 2000) {
      setError("Mesajını 1–2000 karakter arasında yaz."); return;
    }
    const { error: sendError } = await db().from("feedback").insert({ business_id: business.id,
      user_id: session.user.id, type, message: message.trim(), page: "mobile/settings" });
    if (sendError) setError("Geri bildirim gönderilemedi."); else { setSent(true); setError(""); }
  }
  return <Screen title="Geri bildirim" subtitle="Bir hata veya öneri paylaş.">
    {(["general", "bug", "idea"] as const).map(value => <Choice key={value}
      title={value === "general" ? "Genel" : value === "bug" ? "Hata" : "Öneri"}
      selected={type === value} onPress={() => setType(value)} />)}
    <Field label="Mesajın" value={message} onChangeText={setMessage} multiline />
    {Boolean(error) && <Notice error>{error}</Notice>}{sent && <Notice>Geri bildirimin alındı. Teşekkürler.</Notice>}
    {!sent && <Button title="Gönder" onPress={() => { void send(); }} />}
    <Button title="Geri" quiet onPress={() => router.back()} />
  </Screen>;
}
