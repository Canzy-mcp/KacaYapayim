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

export async function manageQuoteLink(id: string, action: "rotate" | "revoke") {
  await requireCompletedViewer();
  if (!isQuoteId(id) || !["rotate", "revoke"].includes(action)) return { ok: false, error: "Geçersiz teklif." };
  const client = await createClient();
  const { data, error } = await client.rpc("manage_quote_link", { p_quote_id: id, p_action: action });
  if (error || !data) return { ok: false, error: "Bağlantı değiştirilemedi. Eski revizyonları yeniden paylaşamazsın." };
  revalidatePath(`/quotes/${id}`);
  return { ok: true, token: data };
}
export async function setQuoteAccessCode(id:string,code:string|null){
 await requireCompletedViewer();
 if(!isQuoteId(id)||code!==null&&!/^\d{6}$/.test(code))return {ok:false,error:"6 haneli kod gir."};
 const r=await (await createClient()).rpc("set_quote_access_code",{p_quote_id:id,p_code:code});
 revalidatePath(`/quotes/${id}`);return r.error?{ok:false,error:"Erişim kodu kaydedilemedi."}:{ok:true};
}
