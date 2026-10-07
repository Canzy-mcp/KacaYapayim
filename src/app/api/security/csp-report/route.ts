import { readJsonBody } from "@/lib/security/body";
import { consumeRateLimit } from "@/lib/security/rate-limit";
export async function POST(request:Request){
 if(!await consumeRateLimit("csp-report",30,60))return new Response(null,{status:429});
 const type=request.headers.get("content-type")?.split(";")[0];
 if(!["application/json","application/csp-report","application/reports+json"].includes(type||""))return new Response(null,{status:415});
 const {value,tooLarge}=await readJsonBody(request,8192);
 if(tooLarge)return new Response(null,{status:413});
 if(value){const report=value["csp-report"] as Record<string,unknown>|undefined;const directive=report?.["effective-directive"];
  // Never log document-uri, referrer or source-file: public quote URLs contain access tokens.
  if(typeof directive==="string"&&/^[a-z-]{1,40}$/.test(directive))console.info("csp_violation",{directive});}
 return new Response(null,{status:204,headers:{"Cache-Control":"no-store"}});
}
