import "react-native-url-polyfill/auto";
import { AppState, Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@kacayapayim/core/types";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const isConfigured = Boolean(url && key);

// SecureStore can reject large values, so divide the session into small pieces.
// The manifest is written last; a partial write is never read as a valid session.
const chunkSize = 1500;
export const secureStorage = {
  async getItem(name: string) {
    if (Platform.OS === "web") return globalThis.localStorage?.getItem(name) ?? null;
    const count = Number(await SecureStore.getItemAsync(`${name}_count`));
    if (!Number.isInteger(count) || count < 1 || count > 40) return null;
    const chunks = await Promise.all(Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(`${name}_${i}`)));
    return chunks.every(chunk => chunk !== null) ? chunks.join("") : null;
  },
  async setItem(name: string, value: string) {
    if (Platform.OS === "web") { globalThis.localStorage?.setItem(name, value); return; }
    const oldCount = Number(await SecureStore.getItemAsync(`${name}_count`)) || 0;
    await SecureStore.deleteItemAsync(`${name}_count`);
    const chunks = value.match(new RegExp(`.{1,${chunkSize}}`, "gs")) || [];
    if (chunks.length > 40) throw new Error("Oturum güvenli alana sığmıyor.");
    await Promise.all(chunks.map((chunk, i) => SecureStore.setItemAsync(`${name}_${i}`, chunk)));
    await Promise.all(Array.from({ length: Math.max(0, oldCount - chunks.length) }, (_, i) =>
      SecureStore.deleteItemAsync(`${name}_${chunks.length + i}`)));
    await SecureStore.setItemAsync(`${name}_count`, String(chunks.length));
  },
  async removeItem(name: string) {
    if (Platform.OS === "web") { globalThis.localStorage?.removeItem(name); return; }
    const count = Math.min(40, Number(await SecureStore.getItemAsync(`${name}_count`)) || 0);
    await SecureStore.deleteItemAsync(`${name}_count`);
    await Promise.all(Array.from({ length: count }, (_, i) => SecureStore.deleteItemAsync(`${name}_${i}`)));
  },
};

export const supabase = isConfigured ? createClient<Database>(url!, key!, {
  auth: { storage: secureStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
}) : null;

if (supabase && Platform.OS !== "web") {
  AppState.addEventListener("change", state => {
    if (state === "active") supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

export function db() {
  if (!supabase) throw new Error("Supabase bağlantısı henüz ayarlanmadı.");
  return supabase;
}
