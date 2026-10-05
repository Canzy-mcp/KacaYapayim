import {readJsonBody} from "@/lib/security/body";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { deleteOwnAccount } from "@/lib/account/deletion";

export async function DELETE(request: NextRequest) {
  if (!await consumeRateLimit("mobile-account-delete", 3, 3600))
    return NextResponse.json({ error: "Çok fazla deneme yapıldı." }, { status: 429 });
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  if (Number(request.headers.get("content-length") || 0) > 1000)
    return NextResponse.json({ error: "İstek geçersiz." }, { status: 413 });
  try {
    const {value:body,tooLarge}=await readJsonBody(request,1024);
    if(tooLarge)return NextResponse.json({error:"İstek çok büyük."},{status:413});
    if(!body)return NextResponse.json({error:"İstek geçersiz."},{status:400});
    if (body?.confirmation !== "HESABIMI SIL") return NextResponse.json({ error: "Silme onayı eksik." }, { status: 400 });
    const { url, key } = getSupabaseConfig();
    const { data, error } = await createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
      .auth.getUser(token);
    if (error || !data.user) return NextResponse.json({ error: "Oturum geçersiz." }, { status: 401 });
    const result = await deleteOwnAccount(data.user.id);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Hesap silinemedi. Tekrar dene." }, { status: 500 });
  }
}
