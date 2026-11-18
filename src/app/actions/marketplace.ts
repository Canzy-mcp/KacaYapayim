"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { marketError, validMarketId, type MarketAction } from "@kacayapayim/core/marketplace";

export type MarketFormState = { error?: string; saved?: number };

export async function marketAction(action: MarketAction, previous: MarketFormState, form: FormData): Promise<MarketFormState> {
  if (!isSupabaseConfigured()) return { error: "Hizmet platformu şu anda kullanılamıyor." };
  const payload: Record<string, string | string[] | boolean> = Object.fromEntries(
    ["id", "provider", "category", "title", "body", "city", "district", "address", "date", "amount",
      "offer", "version", "at", "rating", "decision"].flatMap((key) => {
      const value = form.get(key);
      return typeof value === "string" ? [[key, value.trim()]] : [];
    })
  );
  if (typeof payload.amount === "string") payload.amount = payload.amount.replace(",", ".");
  if (action === "profile") {
    payload.categories = form.getAll("categories").filter((value): value is string => typeof value === "string");
    payload.districts = String(form.get("districts") || "").split(",").map((value) => value.trim()).filter(Boolean);
    payload.published = form.get("published") === "on";
  }
  if (action === "address") payload.share = form.get("share") === "on";
  const { data, error } = await (await createClient()).rpc("market_write", { p_action: action, p_payload: payload });
  if (error) return { error: marketError(error.message), saved: previous.saved };
  revalidatePath("/talepler", "layout");
  revalidatePath("/usta-bul", "layout");
  revalidatePath("/usta-talepleri");
  revalidatePath("/admin/talepler");
  if (action === "create" || action === "edit") {
    if (!validMarketId(data)) return { error: "Talep numarası alınamadı. Taleplerini kontrol et." };
    redirect(`/talepler/${data}`);
  }
  if (action === "award" || action === "complete" || action === "cancel" || action === "start") {
    revalidatePath("/jobs");
    revalidatePath("/work");
    revalidatePath("/dashboard");
  }
  return { saved: (previous.saved ?? 0) + 1 };
}
