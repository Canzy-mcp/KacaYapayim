"use server";
import { createClient } from "@/lib/supabase/server";
import { requireCompletedViewer } from "@/lib/viewer";
import { verifyAccountPassword } from "@/lib/account/reauthenticate";
import { exportGrant } from "@/lib/account/export-access";
import { cookies } from "next/headers";
export async function authorizeExport(form:FormData){
 const viewer=await requireCompletedViewer();const {data}=await (await createClient()).auth.getUser();
 if(!data.user?.email||!await verifyAccountPassword(viewer.id,data.user.email,form.get("password")))return {ok:false,error:"Parolan doğrulanamadı. Çok fazla deneme yaptıysan 15 dakika bekle."};
 try{(await cookies()).set("ky_export_grant",exportGrant(viewer.id),{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/api/export",maxAge:600});return {ok:true};}
 catch{return {ok:false,error:"Dışa aktarım sunucu ayarı eksik."};}
}
