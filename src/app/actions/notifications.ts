"use server";
import { createClient } from "@/lib/supabase/server";
import { requireCompletedViewer } from "@/lib/viewer";
import { revalidatePath } from "next/cache";
import { isJobId } from "@/lib/jobs/service";
export async function markNotificationRead(form:FormData){
 const viewer=await requireCompletedViewer();const id=String(form.get("id")||"");if(!isJobId(id))throw new Error("Bildirim bulunamadı.");
 const {error}=await (await createClient()).from("notifications").update({read_at:new Date().toISOString()}).eq("id",id).eq("business_id",viewer.business!.id).is("read_at",null);
 if(error)throw new Error("Bildirim kaydedilemedi.");revalidatePath("/dashboard");
}
