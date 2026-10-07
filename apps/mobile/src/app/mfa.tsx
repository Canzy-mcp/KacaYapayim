import { useEffect,useState } from "react";
import { router } from "expo-router";
import { Button,Field,Notice,Screen } from "@/src/components/ui";
import { db } from "@/src/lib/supabase";
import { useAppSession } from "@/src/lib/session";
export default function Mfa(){
 const [factor,setFactor]=useState("");const [factors,setFactors]=useState<{id:string;friendly_name?:string}[]>([]);const [code,setCode]=useState("");const [error,setError]=useState("");const [busy,setBusy]=useState(false);const {refresh}=useAppSession();
 useEffect(()=>{void db().auth.mfa.listFactors().then(r=>{if(r.error)setError("Doğrulama yöntemleri yüklenemedi.");else {setFactors(r.data.totp);setFactor(r.data.totp[0]?.id||"");}});},[]);
 return <Screen title="Girişini doğrula" subtitle="Authenticator uygulamandaki güncel kodu gir.">{factors.length>1&&factors.map(f=><Button key={f.id} title={(factor===f.id?"✓ ":"")+(f.friendly_name||"Authenticator")} quiet disabled={busy} onPress={()=>{setFactor(f.id);setCode("");}}/>)}<Field label="6 haneli kod" value={code} onChangeText={v=>setCode(v.replace(/\D/g,"").slice(0,6))} keyboardType="number-pad"/>{!!error&&<Notice error>{error}</Notice>}<Button title={busy?"Doğrulanıyor…":"Doğrula"} disabled={busy||code.length!==6||!factor} onPress={async()=>{setBusy(true);setError("");try{const c=await db().auth.mfa.challenge({factorId:factor});if(c.error)throw c.error;const v=await db().auth.mfa.verify({factorId:factor,challengeId:c.data.id,code});if(v.error)throw v.error;await refresh();router.replace("/(tabs)");}catch{setError("Kod doğrulanamadı. Güncel kodla tekrar dene.");}finally{setBusy(false);}}}/><Button title="Çıkış yap" quiet onPress={async()=>{await db().auth.signOut();router.replace("/");}}/></Screen>;
}
