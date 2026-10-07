import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { quoteAccess,signQuoteAccess } from "@/lib/quotes/public-access";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { readJsonBody } from "@/lib/security/body";
export async function POST(request:NextRequest,{params}:{params:Promise<{token:string}>}){
 if(process.env.APP_URL&&request.headers.get("origin")!==new URL(process.env.APP_URL).origin)return new Response(null,{status:403});
 const {token}=await params;
 if(!await consumeRateLimit("quote-access-ip",10,900)||!await consumeRateLimit("quote-access-token",20,900,token))return new Response(null,{status:429});
 const access=await quoteAccess(token);if(access.state==="unavailable")return new Response(null,{status:404});if(access.state==="allowed")return NextResponse.json({ok:true});
 const {value,tooLarge}=await readJsonBody(request,256);if(tooLarge)return new Response(null,{status:413});
 if(typeof value?.code!=="string"||!/^\d{6}$/.test(value.code))return new Response(null,{status:400});
 const r=await createServiceClient().rpc("verify_quote_access_code",{p_token:token,p_code:value.code});
 if(r.error||!r.data)return NextResponse.json({error:"Erişim kodu doğrulanamadı."},{status:403});
 const response=NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}});
 response.cookies.set(access.name,signQuoteAccess(access.scope,access.version),{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",maxAge:1800});return response;
}
