import "server-only";
import { cookies } from "next/headers";
import { createHmac,timingSafeEqual } from "node:crypto";
export function exportGrant(userId:string){
 const secret=process.env.RATE_LIMIT_HMAC_KEY;if(!secret)throw new Error("Dışa aktarım şu an kullanılamıyor.");
 const expires=String(Date.now()+10*60*1000);return `${expires}.${createHmac("sha256",secret).update(`export:${userId}:${expires}`).digest("hex")}`;
}
export async function hasExportGrant(userId:string){
 const secret=process.env.RATE_LIMIT_HMAC_KEY;const value=(await cookies()).get("ky_export_grant")?.value;
 if(!secret||!value)return false;const [expires,signature]=value.split(".");const at=Number(expires);
 if(!Number.isSafeInteger(at)||at<=Date.now()||at>Date.now()+10*60*1000||!/^[a-f0-9]{64}$/.test(signature||""))return false;
 const expected=createHmac("sha256",secret).update(`export:${userId}:${expires}`).digest();return timingSafeEqual(Buffer.from(signature,"hex"),expected);
}
