import { createClient } from "@/lib/supabase/server";
import { TeamAccess } from "./team-access";
import { listWorkEntries } from "@/app/actions/work";
import { WorkBoard } from "./work-board";
export async function WorkPanel({jobId,quoteId}:{jobId?:string;quoteId?:string}){
 const entries=await listWorkEntries(jobId,quoteId);
 const client=await createClient();
 const {data,error}=jobId?await client.from("job_viewers").select("id,invited_email,user_id,can_add_notes").eq("job_id",jobId):{data:[],error:null};
 if(error)throw new Error("Ekip erişimleri yüklenemedi.");
 return <><WorkBoard initialEntries={entries} jobId={jobId} quoteId={quoteId}/>{jobId&&<TeamAccess jobId={jobId} initial={data??[]}/>}</>;
}
