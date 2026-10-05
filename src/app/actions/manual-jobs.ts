"use server";
import { createClient } from "@/lib/supabase/server";
import { requireCompletedViewer } from "@/lib/viewer";
import { isJobId } from "@/lib/jobs/service";
import { revalidatePath } from "next/cache";
export type ManualLine = { name: string; category: "material" | "labor" | "other"; quantity: number; unit_cost: number };
export async function saveManualJob(input: { id: string | null; customerId: string | null; title: string; description: string; lines: ManualLine[] }) {
 await requireCompletedViewer();
 if(input.id&&!isJobId(input.id)||input.customerId&&!isJobId(input.customerId)||!input.title?.trim()||input.title.length>160||typeof input.description!=='string'||input.description.length>2000||!Array.isArray(input.lines)||input.lines.length<1||input.lines.length>60||input.lines.some(l=>!l||typeof l.name!=='string'||!l.name.trim()||l.name.length>160||!['material','labor','other'].includes(l.category)||!Number.isFinite(l.quantity)||l.quantity<=0||l.quantity>1e6||!Number.isFinite(l.unit_cost)||l.unit_cost<0||l.unit_cost>1e9)) return {ok:false,error:'İş bilgilerini ve maliyet kalemlerini kontrol et.'};
 const client=await createClient();const {data,error}=await client.rpc('save_manual_job',{p_job_id:input.id,p_customer_id:input.customerId,p_title:input.title.trim(),p_description:input.description.trim()||null,p_lines:input.lines});
 if(error||!data)return {ok:false,error:'İş kaydedilemedi. Toplam maliyet sıfırdan büyük olmalı.'};
 revalidatePath('/jobs');revalidatePath(`/jobs/${data}`);return {ok:true,id:data};
}
