import "server-only";
import { createClient } from "@/lib/supabase/server";
export async function requireAdminMfa() {
  const level=await (await createClient()).auth.mfa.getAuthenticatorAssuranceLevel();
  if(level.error||level.data.currentLevel!=="aal2")throw new Error("Yönetici işlemi için iki aşamalı doğrulama gerekli. Ayarlardan etkinleştir.");
}
