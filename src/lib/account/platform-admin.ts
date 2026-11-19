import "server-only";
import { createServiceClient } from "@/lib/supabase/admin";

export async function isPlatformAdmin(userId: string) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return false;
  const { data } = await createServiceClient().from("platform_admins").select("user_id").eq("user_id", userId).maybeSingle();
  return data != null;
}
