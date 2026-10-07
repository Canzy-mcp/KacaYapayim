"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { cleanText, emailError, passwordError, type FieldErrors } from "@/lib/validation";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { recordEvent } from "@/lib/analytics/events";

type AuthResult = { ok: boolean; error?: string; fieldErrors?: FieldErrors; next?: string; message?: string };
const setupError = "Supabase bağlantısı henüz yapılandırılmadı.";

async function siteOrigin() {
  if (process.env.APP_URL) return new URL(process.env.APP_URL).origin;
  if (process.env.NODE_ENV === "production") throw new Error("APP_URL yapılandırması eksik.");
  const h = await headers();
  const host = h.get("host") || "localhost:3005";
  const protocol = h.get("x-forwarded-proto") || "http";
  return `${protocol}://${host}`;
}

export async function loginAction(form: FormData): Promise<AuthResult> {
  if (!await consumeRateLimit("auth-login", 8, 300)) return { ok: false, error: "Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar dene." };
  const email = cleanText(form.get("email"), 254).toLowerCase();
  const password = String(form.get("password") || "");
  const fieldErrors: FieldErrors = {};
  if (emailError(email)) fieldErrors.email = emailError(email);
  if (!password) fieldErrors.password = "Şifreni gir.";
  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors };
  if (!isSupabaseConfigured()) return { ok: false, error: setupError };
  const remember = form.get("remember") === "on";
  const cookieStore = await cookies();
  if (remember) cookieStore.delete("ky_session_preference");
  else cookieStore.set("ky_session_preference", "session", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: "E-posta veya şifre hatalı." };
  const { data } = await supabase.from("businesses").select("onboarding_completed").maybeSingle();
  revalidatePath("/", "layout");
  return { ok: true, next: data?.onboarding_completed ? "/dashboard" : "/onboarding" };
}

export async function registerAction(form: FormData): Promise<AuthResult> {
  if (process.env.PUBLIC_SIGNUPS_ENABLED === "false") return { ok: false, error: "Yeni hesap açılışı şu anda kapalı." };
  if (!await consumeRateLimit("auth-register", 5, 3600)) return { ok: false, error: "Çok fazla deneme yapıldı. Daha sonra tekrar dene." };
  if (isSupabaseConfigured()) {
    const setting=await (await createClient()).from("signup_settings").select("enabled").eq("id",true).maybeSingle();
    if(setting.error||!setting.data?.enabled)return {ok:false,error:"Yeni hesap açılışı şu anda kapalı."};
  }
  const firstName = cleanText(form.get("firstName"), 100);
  const lastName = cleanText(form.get("lastName"), 100);
  const email = cleanText(form.get("email"), 254).toLowerCase();
  const password = String(form.get("password") || "");
  const confirm = String(form.get("confirm") || "");
  const fieldErrors: FieldErrors = {};
  if (!firstName) fieldErrors.firstName = "Adını gir.";
  if (!lastName) fieldErrors.lastName = "Soyadını gir.";
  if (emailError(email)) fieldErrors.email = emailError(email);
  if (passwordError(password)) fieldErrors.password = passwordError(password);
  if (password !== confirm) fieldErrors.confirm = "Şifreler eşleşmiyor.";
  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors };
  if (!isSupabaseConfigured()) return { ok: false, error: setupError };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { first_name: firstName, last_name: lastName }, emailRedirectTo: `${await siteOrigin()}/auth/callback?next=/onboarding` },
  });
  if (error) return { ok: false, error: "Hesap oluşturulamadı. Bilgilerini kontrol edip tekrar dene." };
  await recordEvent("signup_completed", "/register");
  if (data.session) return { ok: true, next: "/onboarding" };
  return { ok: true, message: "Hesabını doğrulamak için e-posta kutunu kontrol et." };
}

export async function forgotPasswordAction(form: FormData): Promise<AuthResult> {
  if (!await consumeRateLimit("auth-forgot", 5, 3600)) return { ok: false, error: "Çok fazla deneme yapıldı. Daha sonra tekrar dene." };
  const email = cleanText(form.get("email"), 254).toLowerCase();
  if (emailError(email)) return { ok: false, fieldErrors: { email: emailError(email) } };
  if (!isSupabaseConfigured()) return { ok: false, error: setupError };
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${await siteOrigin()}/auth/callback?next=/reset-password` });
  // The same response is used for existing and non-existing accounts.
  return { ok: true, message: "Şifre sıfırlama bağlantısını e-posta adresine gönderdik." };
}

export async function resetPasswordAction(form: FormData): Promise<AuthResult> {
  const password = String(form.get("password") || "");
  const confirm = String(form.get("confirm") || "");
  const fieldErrors: FieldErrors = {};
  if (passwordError(password)) fieldErrors.password = passwordError(password);
  if (password !== confirm) fieldErrors.confirm = "Şifreler eşleşmiyor.";
  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors };
  if (!isSupabaseConfigured()) return { ok: false, error: setupError };
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return { ok: false, error: "Bağlantının süresi dolmuş. Yeni bir sıfırlama bağlantısı iste." };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, error: "Şifre güncellenemedi. Yeni bağlantı isteyip tekrar dene." };
  await supabase.auth.signOut();
  return { ok: true, next: "/login?reset=success", message: "Şifren güncellendi." };
}

export async function logoutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  (await cookies()).delete("ky_session_preference");
  revalidatePath("/", "layout");
  return { ok: true };
}
