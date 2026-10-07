"use client";

import { NotificationPreferences } from "./notification-preferences";
import { BrandingForm } from "@/components/settings/branding-form";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { saveSettings } from "@/app/actions/account";
import { Button, Card, Input } from "@/components/ui";
import { Toast } from "@/components/ui/toast";
import { marginErrors, parseMargin, type FieldErrors } from "@/lib/validation";
import type { Business, Profile } from "@/types/database";



export function SettingsForm({ profile, business }: { profile: Profile; business: Business }) {
  const router = useRouter();
  const summary = useRef<HTMLDivElement>(null);
  const locked = useRef(false);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  useEffect(() => { if (Object.keys(errors).length) summary.current?.focus(); }, [errors]);
  const [toast, setToast] = useState<{ message: string; kind: "success" | "error" } | null>(null);
  const closeToast = useCallback(() => setToast(null), []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current) return;
    const form = new FormData(event.currentTarget);
    const validation = marginErrors(parseMargin(form.get("target")), parseMargin(form.get("minimum")));
    for (const key of ["firstName", "lastName", "name", "profession"]) if (!String(form.get(key) || "").trim()) validation[key] = "Bu alanı doldur.";
    setErrors(validation);
    if (Object.keys(validation).length) return;
    locked.current = true; setPending(true);
    try {
      const result = await saveSettings(form);
      setErrors(result.fieldErrors || {});
      if (result.ok) { setToast({ message: "Profil ve işletme bilgilerin kaydedildi.", kind: "success" }); router.refresh(); }
      else setToast({ message: result.error || "Bilgileri kontrol et.", kind: "error" });
    } catch { setToast({ message: "Bir sorun oluştu. Tekrar dene.", kind: "error" }); }
    finally { locked.current = false; setPending(false); }
  }
  return <><form onSubmit={submit} noValidate className="max-w-4xl space-y-5">{Object.keys(errors).length > 0 && <div ref={summary} tabIndex={-1} role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4"><p className="font-semibold">Bilgileri kontrol et</p><ul>{Object.entries(errors).map(([key, message]) => <li key={key}><a className="inline-flex min-h-11 items-center underline" href={`#${key === "name" ? "businessName" : key}`}>{message}</a></li>)}</ul></div>}<Card className="p-5 sm:p-6"><div id="profile"><h2 className="text-[18px] font-semibold">Profil</h2><p className="mt-1 text-[13px] text-[#6E6E73]">Tekliflerinde kullanılacak adın.</p></div><div className="mt-6 grid gap-5 sm:grid-cols-2"><div><Input id="firstName" name="firstName" error={errors.firstName} label="Ad" defaultValue={profile.first_name} autoComplete="given-name" /></div><div><Input id="lastName" name="lastName" error={errors.lastName} label="Soyad" defaultValue={profile.last_name} autoComplete="family-name" /></div></div></Card><Card className="p-5 sm:p-6"><div id="business"><h2 className="text-[18px] font-semibold">İşletme</h2><p className="mt-1 text-[13px] text-[#6E6E73]">Müşterilerine gösterilecek bilgiler.</p></div><div className="mt-6 grid gap-5 sm:grid-cols-2"><div className="sm:col-span-2"><Input id="businessName" name="name" error={errors.name} label="İşletme adı" defaultValue={business.name} autoComplete="organization" /></div><Input id="phone" name="phone" label="Telefon" type="tel" inputMode="tel" defaultValue={business.phone || ""} autoComplete="tel" /><Input id="city" name="city" label="Şehir" defaultValue={business.city || ""} autoComplete="address-level2" /><div className="sm:col-span-2"><Input id="profession" name="profession" error={errors.profession} label="Meslek" defaultValue={business.profession || ""} /></div></div></Card><Card className="p-5 sm:p-6"><h2 className="text-[18px] font-semibold">Kâr Ayarları</h2><p className="mt-1 text-[13px] text-[#6E6E73]">İleride teklif fiyatları için kullanılacak marj hedeflerin.</p><div className="mt-6 grid gap-5 sm:grid-cols-2"><div><Input id="target" name="target" error={errors.target} label="Hedef kâr marjı (%)" type="number" inputMode="decimal" min="1" max="90" step="0.01" defaultValue={business.default_profit_margin} /></div><div><Input id="minimum" name="minimum" error={errors.minimum} label="Minimum kâr marjı (%)" type="number" inputMode="decimal" min="0" max="89" step="0.01" defaultValue={business.minimum_profit_margin} /></div></div><p className="mt-4 text-[13px] leading-5 text-[#77777e]">Kâr marjı, kârın satış fiyatına oranıdır. Hedef marj %1–90, minimum marj %0–89 arasında olmalı.</p></Card><div className="flex justify-end"><Button type="submit" disabled={pending} className="min-h-12 w-full sm:w-auto">{pending ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}</Button></div></form><BrandingForm initialLogo={business.logo_url} /><NotificationPreferences businessId={business.id} />{toast && <Toast message={toast.message} kind={toast.kind} onClose={closeToast} />}</>;
}
