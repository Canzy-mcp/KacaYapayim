import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Mfa } from "@/components/settings/mfa";
export const metadata={title:"İki aşamalı doğrulama",robots:{index:false,follow:false}};
export const dynamic="force-dynamic";
export default async function Page(){
  const client=await createClient();const {data}=await client.auth.getUser();if(!data.user)redirect("/login");
  const level=await client.auth.mfa.getAuthenticatorAssuranceLevel();if(level.error)throw new Error("Doğrulama durumu kontrol edilemedi.");
  if(level.data.nextLevel!=="aal2"||level.data.currentLevel==="aal2")redirect("/settings");
  return <main className="mx-auto max-w-lg px-5 py-12"><h1 className="text-3xl font-semibold">Girişini doğrula</h1><Mfa challenge/></main>;
}
