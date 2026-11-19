import { validMarketId } from "@kacayapayim/core/marketplace";
import { marketReturnPath } from "./marketplace";
import { secureStorage } from "./supabase";

const key = "market-signup-destination";
const lifetimeMs = 24 * 60 * 60 * 1000;

export async function rememberMarketSignup(userId: string, next: unknown) {
  const path = marketReturnPath(next);
  if (!path || !validMarketId(userId)) return;
  try {
    await secureStorage.setItem(key, JSON.stringify({ userId, path, expiresAt: Date.now() + lifetimeMs }));
  } catch {
    // Account creation remains usable when device storage is unavailable.
  }
}

async function pendingMarketSignup() {
  try {
    const stored = await secureStorage.getItem(key);
    if (!stored) return;
    const { userId, expiresAt, path: rawPath } = JSON.parse(stored);
    const path = marketReturnPath(rawPath);
    if (!path || !validMarketId(userId) || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      await secureStorage.removeItem(key);
      return;
    }
    return { userId, path };
  } catch {
    // Invalid or unavailable storage falls back to standard sign-in.
  }
}

export async function hasPendingMarketSignup() {
  return Boolean(await pendingMarketSignup());
}

export async function takeMarketSignup(userId: string | undefined) {
  if (!userId) return;
  const pending = await pendingMarketSignup();
  if (!pending || pending.userId !== userId) return;
  try {
    await secureStorage.removeItem(key);
  } catch {
    return;
  }
  return pending.path;
}
