"use server";
import { createClient } from "@/lib/supabase/server";
import { requireCompletedViewer } from "@/lib/viewer";
import { revalidatePath } from "next/cache";
export async function savePreferences(input:{followup_reminders:boolean;decision_notifications:boolean;cost_reminders:boolean}){
 const viewer=await requireCompletedViewer();if(!input||Object.values(input).some(v=>typeof v!=='boolean'))return {ok:false};
 const client=await createClient();const {error}=await client.from('business_preferences').upsert({business_id:viewer.business!.id,followup_reminders:input.followup_reminders,decision_notifications:input.decision_notifications,cost_reminders:input.cost_reminders});
 revalidatePath('/dashboard');revalidatePath('/settings');return {ok:!error};
}
