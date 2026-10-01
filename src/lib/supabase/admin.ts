import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Sunucu veritabanı anahtarı eksik.");
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
