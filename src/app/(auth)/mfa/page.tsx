import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Mfa } from "@/components/settings/mfa";
import { accountHome, requestReturnPath } from "@/lib/account/home";
export const metadata={title:"İki aşamalı doğrulama",robots:{index:false,follow:false}};
export const dynamic="force-dynamic";
export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }){
  const next = requestReturnPath((await searchParams).next);
  const client=await createClient();const {data}=await client.auth.getUser();if(!data.user)redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  const level=await client.auth.mfa.getAuthenticatorAssuranceLevel();if(level.error)throw new Error("Doğrulama durumu kontrol edilemedi.");
  const destination = next ?? accountHome(null, data.user.user_metadata.account_preference);
  if(level.data.nextLevel!=="aal2"||level.data.currentLevel==="aal2")redirect(destination);
  return <main className="mx-auto max-w-lg px-5 py-12"><h1 className="text-3xl font-semibold">Girişini doğrula</h1><Mfa challenge destination={destination} /></main>;
}
