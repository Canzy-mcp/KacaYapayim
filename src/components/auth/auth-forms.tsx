"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { Button, Input } from "@/components/ui";
import { emailError, passwordError, type FieldErrors } from "@/lib/validation";
import { forgotPasswordAction, loginAction, registerAction, resetPasswordAction } from "@/app/actions/auth";

type Result = { ok: boolean; error?: string; fieldErrors?: FieldErrors; next?: string; message?: string };
type Action = (form: FormData) => Promise<Result>;

function useSubmit(action: Action) {
  const router = useRouter();
  const locked = useRef(false);
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>, validate: (data: FormData) => FieldErrors) {
    event.preventDefault();
    if (locked.current) return;
    const form = new FormData(event.currentTarget);
    const errors = validate(form);
    setFieldErrors(errors);
    setMessage("");
    if (Object.keys(errors).length) return;
    locked.current = true;
    setPending(true);
    try {
      const result = await action(form);
      setFieldErrors(result.fieldErrors || {});
      setSuccess(result.ok);
      setMessage(result.error || result.message || "");
      if (result.ok && result.next) { router.replace(result.next); router.refresh(); }
    } catch {
      setMessage("Bir sorun oluştu. Tekrar dene.");
    } finally { locked.current = false; setPending(false); }
  }
  return { submit, pending, fieldErrors, message, success };
}

function Field({ id, label, error, ...props }: React.ComponentProps<typeof Input> & { error?: string }) {
  return <div><Input id={id} label={label} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} {...props} />{error && <p id={`${id}-error`} className="mt-1.5 text-[13px] text-[#c4362e]">{error}</p>}</div>;
}

function Feedback({ message, success }: { message: string; success: boolean }) {
  return message ? <p role="status" className={`rounded-[12px] px-4 py-3 text-[14px] leading-5 ${success ? "bg-[#eaf8ee] text-[#247544]" : "bg-[#fff0ef] text-[#b93831]"}`}>{message}</p> : null;
}

function SubmitButton({ pending, label, busy }: { pending: boolean; label: string; busy: string }) {
  return <Button type="submit" disabled={pending} className="min-h-12 w-full">{pending ? busy : label}</Button>;
}

function AuthForm({ onSubmit, children, message, success, pending, label, busy }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void; children: ReactNode; message: string; success: boolean; pending: boolean; label: string; busy: string }) {
  return <form onSubmit={onSubmit} noValidate className="space-y-5">{children}<Feedback message={message} success={success} /><SubmitButton pending={pending} label={label} busy={busy} /></form>;
}

export function LoginForm({ notice }: { notice?: string }) {
  const state = useSubmit(loginAction);
  return <AuthForm onSubmit={(event) => state.submit(event, (data) => {
    const errors: FieldErrors = {};
    if (emailError(String(data.get("email") || ""))) errors.email = emailError(String(data.get("email") || ""));
    if (!data.get("password")) errors.password = "Şifreni gir.";
    return errors;
  })} {...state} label="Giriş Yap" busy="Giriş yapılıyor...">{notice && <p role="status" className="rounded-[12px] bg-[#edf5ff] px-4 py-3 text-[13px] text-[#1265b8]">{notice}</p>}<Field id="email" name="email" label="E-posta" type="email" autoComplete="email" inputMode="email" error={state.fieldErrors.email} /><Field id="password" name="password" label="Şifre" type="password" autoComplete="current-password" error={state.fieldErrors.password} /><div className="flex items-center justify-between gap-3 text-[13px]"><label className="flex min-h-11 items-center gap-2 text-[#55555d]"><input type="checkbox" name="remember" defaultChecked className="size-4 accent-[#0071E3]" />Beni hatırla</label><Link href="/forgot-password" className="font-medium text-[#0071E3] hover:underline">Şifremi unuttum</Link></div></AuthForm>;
}

export function RegisterForm() {
  const state = useSubmit(registerAction);
  return <AuthForm onSubmit={(event) => state.submit(event, (data) => {
    const errors: FieldErrors = {};
    if (!String(data.get("firstName") || "").trim()) errors.firstName = "Adını gir.";
    if (!String(data.get("lastName") || "").trim()) errors.lastName = "Soyadını gir.";
    if (emailError(String(data.get("email") || ""))) errors.email = emailError(String(data.get("email") || ""));
    if (passwordError(String(data.get("password") || ""))) errors.password = passwordError(String(data.get("password") || ""));
    if (data.get("password") !== data.get("confirm")) errors.confirm = "Şifreler eşleşmiyor.";
    return errors;
  })} {...state} label="Ücretsiz Hesap Oluştur" busy="Hesap oluşturuluyor..."><div className="grid grid-cols-2 gap-3"><Field id="firstName" name="firstName" label="Ad" autoComplete="given-name" error={state.fieldErrors.firstName} /><Field id="lastName" name="lastName" label="Soyad" autoComplete="family-name" error={state.fieldErrors.lastName} /></div><Field id="email" name="email" label="E-posta" type="email" autoComplete="email" inputMode="email" error={state.fieldErrors.email} /><Field id="password" name="password" label="Şifre" type="password" autoComplete="new-password" error={state.fieldErrors.password} /><Field id="confirm" name="confirm" label="Şifre tekrar" type="password" autoComplete="new-password" error={state.fieldErrors.confirm} /><p className="text-[12px] text-[#77777e]">Şifren en az 8 karakter olmalı.</p></AuthForm>;
}

export function ForgotPasswordForm({ notice }: { notice?: string }) {
  const state = useSubmit(forgotPasswordAction);
  return <AuthForm onSubmit={(event) => state.submit(event, (data) => {
    const error = emailError(String(data.get("email") || ""));
    const errors: FieldErrors = {};
    if (error) errors.email = error;
    return errors;
  })} {...state} label="Sıfırlama Bağlantısı Gönder" busy="Gönderiliyor..."><Field id="email" name="email" label="E-posta" type="email" autoComplete="email" inputMode="email" error={state.fieldErrors.email} />{notice && <p className="text-[13px] text-[#b93831]">{notice}</p>}</AuthForm>;
}

export function ResetPasswordForm() {
  const state = useSubmit(resetPasswordAction);
  return <AuthForm onSubmit={(event) => state.submit(event, (data) => {
    const errors: FieldErrors = {};
    if (passwordError(String(data.get("password") || ""))) errors.password = passwordError(String(data.get("password") || ""));
    if (data.get("password") !== data.get("confirm")) errors.confirm = "Şifreler eşleşmiyor.";
    return errors;
  })} {...state} label="Şifreyi Güncelle" busy="Güncelleniyor..."><Field id="password" name="password" label="Yeni şifre" type="password" autoComplete="new-password" error={state.fieldErrors.password} /><Field id="confirm" name="confirm" label="Yeni şifre tekrar" type="password" autoComplete="new-password" error={state.fieldErrors.confirm} /></AuthForm>;
}
