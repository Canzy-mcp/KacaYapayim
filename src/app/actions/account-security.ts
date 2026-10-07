"use server";
import { createClient } from "@/lib/supabase/server";
import { verifyAccountPassword } from "@/lib/account/reauthenticate";
import { deleteOwnAccount } from "@/lib/account/deletion";

export async function accountSecurityAction(form: FormData) {
  const client = await createClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user?.email) return { ok: false, error: "Oturum sona erdi." };
  const assurance = await client.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance.error || assurance.data.nextLevel === "aal2" && assurance.data.currentLevel !== "aal2")
    return { ok: false, error: "Önce iki aşamalı giriş doğrulamasını tamamla." };
  if (!await verifyAccountPassword(data.user.id, data.user.email, form.get("password")))
    return { ok: false, error: "Parolan doğrulanamadı. Çok fazla deneme yaptıysan 15 dakika bekle." };
  if (form.get("action") === "other-sessions") {
    const { error } = await client.auth.signOut({ scope: "others" });
    return error ? { ok: false, error: "Diğer oturumlar kapatılamadı." } : { ok: true };
  }
  if (form.get("action") !== "delete" || form.get("confirmation") !== "HESABIMI SIL")
    return { ok: false, error: "Silme onayını aynen yaz." };
  const result = await deleteOwnAccount(data.user.id);
  if (result.ok) await client.auth.signOut({ scope: "local" });
  return result;
}
