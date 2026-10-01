"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCompletedViewer } from "@/lib/viewer";
import { isQuoteId } from "@/lib/quotes/service";
import { recordEvent } from "@/lib/analytics/events";

export async function markQuoteSent(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireCompletedViewer();
  if (!isQuoteId(id)) return { ok: false, error: "Teklif bulunamadı." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_quote_sent", { p_quote_id: id });
  if (error) return { ok: false, error: "Paylaşım durumu kaydedilemedi." };
  revalidatePath(`/quotes/${id}`);
  revalidatePath("/quotes");
  revalidatePath("/dashboard");
  await recordEvent("quote_shared", "/quotes");
  return { ok: true };
}
