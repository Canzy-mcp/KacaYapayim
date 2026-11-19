"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { marketError, validMarketId, type MarketAction } from "@kacayapayim/core/marketplace";
import { parseMarketForm } from "@/lib/marketplace/form-payload";

export type MarketFormState = { error?: string; saved?: number };

export async function marketAction(action: MarketAction, previous: MarketFormState, form: FormData): Promise<MarketFormState> {
  if (!isSupabaseConfigured()) return { error: "Hizmet platformu şu anda kullanılamıyor." };
  const parsed = parseMarketForm(action, form);
  if (!parsed.payload) return { error: parsed.error, saved: previous.saved };
  const { data, error } = await (await createClient()).rpc("market_write", { p_action: action, p_payload: parsed.payload });
  if (error) return { error: marketError(error.message), saved: previous.saved };
  revalidatePath("/talepler", "layout");
  revalidatePath("/usta-bul", "layout");
  revalidatePath("/usta-talepleri");
  revalidatePath("/admin/talepler");
  if (action === "create" || action === "edit") {
    if (!validMarketId(data)) return { error: "Talep numarası alınamadı. Taleplerini kontrol et." };
    redirect(`/talepler/${data}`);
  }
  if (["award", "start", "finish", "complete", "reopen", "cancel", "decline"].includes(action)) {
    revalidatePath("/jobs");
    revalidatePath("/jobs/[id]", "layout");
    revalidatePath("/work");
    revalidatePath("/dashboard");
  }
  return { saved: (previous.saved ?? 0) + 1 };
}
