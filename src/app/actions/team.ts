"use server";
import {randomBytes,createHash} from 'node:crypto';
import {createClient} from '@/lib/supabase/server';
import {requireCompletedViewer,requireViewer} from '@/lib/viewer';
import {revalidatePath} from 'next/cache';
import {isJobId} from '@/lib/jobs/service';
export async function inviteJobViewer(jobId:string,email:string){
 const viewer=await requireCompletedViewer();email=email.trim().toLowerCase();
 if(!isJobId(jobId)||email.length>254||!/^\S+@\S+\.\S+$/.test(email))return {ok:false,error:'Geçerli bir e-posta gir.'};
 const client=await createClient();
 const {data:job}=await client.from('jobs').select('id').eq('id',jobId).eq('business_id',viewer.business!.id).maybeSingle();
 if(!job)return {ok:false,error:'İş bulunamadı.'};
 const token=randomBytes(32).toString('hex');
 const {error}=await client.from('job_viewers').upsert({business_id:viewer.business!.id,job_id:jobId,invited_email:email,user_id:null,token_hash:createHash('sha256').update(token).digest('hex'),expires_at:new Date(Date.now()+7*86400000).toISOString()},{onConflict:'job_id,invited_email'});
 if(error)return {ok:false,error:'Erişim bağlantısı oluşturulamadı.'};
 revalidatePath(`/jobs/${jobId}`);return {ok:true,path:`/team-invite/${token}`};
}
export async function revokeJobViewer(id:string){
 const viewer=await requireCompletedViewer();const client=await createClient();
 if(!isJobId(id))return {ok:false};
 const {error}=await client.from('job_viewers').delete().eq('id',id).eq('business_id',viewer.business!.id);return {ok:!error};
}
export async function acceptJobInvite(token:string){
 await requireViewer();if(!/^[a-f0-9]{64}$/.test(token))return {ok:false};
 const client=await createClient();const {data,error}=await client.rpc('accept_job_invite',{p_token:token});return {ok:!error&&data===true};
}

export async function addAssignedJobNote(jobId:string,title:string,note:string){
 await requireViewer(); if(!isJobId(jobId)||!title.trim()||title.length>160||note.length>2000)return {ok:false};
 const client=await createClient();const {error}=await client.rpc("add_assigned_job_note",{p_job_id:jobId,p_title:title,p_note:note}); revalidatePath("/team-work"); revalidatePath(`/jobs/${jobId}`); return {ok:!error};
}
export async function setJobNotePermission(id:string,allowed:boolean){
 const viewer=await requireCompletedViewer();if(!isJobId(id)||typeof allowed!=="boolean")return {ok:false};
 const client=await createClient();const {data,error}=await client.from("job_viewers").update({can_add_notes:allowed}).eq("id",id).eq("business_id",viewer.business!.id).select("id").maybeSingle();revalidatePath("/team-work");return {ok:!error&&!!data};
}
