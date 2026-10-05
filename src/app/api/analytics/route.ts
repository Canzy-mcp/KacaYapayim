import { consumeRateLimit } from "@/lib/security/rate-limit";
import { publicEvents, recordEvent, safeChannel, safeMarketingPath } from "@/lib/analytics/events";
import { readJsonBody } from "@/lib/security/body";
export async function POST(request:Request){
 if(process.env.ANALYTICS_ENABLED!=="true")return new Response(null,{status:204});
 if(process.env.APP_URL&&request.headers.get("origin")!==new URL(process.env.APP_URL).origin)return new Response(null,{status:403});
 if(!await consumeRateLimit("public-analytics",60,60))return new Response(null,{status:429});
 const {value:body,tooLarge}=await readJsonBody(request,1024);if(tooLarge)return new Response(null,{status:413});
 if(!body||typeof body.event!=="string"||!publicEvents.includes(body.event as typeof publicEvents[number])||typeof body.path!=="string")return new Response(null,{status:400});
 const path=safeMarketingPath(body.path);if(!path)return new Response(null,{status:400});
 await recordEvent(body.event as typeof publicEvents[number],path,safeChannel(typeof body.channel==="string"?body.channel:null),{medium:typeof body.medium==="string"?body.medium:"",campaign:typeof body.campaign==="string"?body.campaign:""});
 return new Response(null,{status:204,headers:{"Cache-Control":"no-store"}});
}
