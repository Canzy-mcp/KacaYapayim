import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { consumeRateLimit } from "@/lib/security/rate-limit";

export async function verifyAccountPassword(userId: string, email: string, password: unknown) {
  if (typeof password !== "string" || !password || password.length > 1024) return false;
  if (!await consumeRateLimit("account-reauth", 5, 900, userId)) return false;
  const { url, key } = getSupabaseConfig();
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  const valid = !error && data.user?.id === userId;
  if (data.session) await client.auth.signOut({ scope: "local" });
  return valid;
}
