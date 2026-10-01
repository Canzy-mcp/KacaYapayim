"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, type FormEvent } from "react";
import { saveSettings } from "@/app/actions/account";
import { Button, Card, Input } from "@/components/ui";
import { Toast } from "@/components/ui/toast";
import { marginErrors, parseMargin, type FieldErrors } from "@/lib/validation";
import type { Business, Profile } from "@/types/database";

function ErrorText({ error }: { error?: string }) { return error ? <p className="mt-1.5 text-[13px] text-[#c4362e]">{error}</p> : null; }

export function SettingsForm({ profile, business }: { profile: Profile; business: Business }) {
  const router = useRouter();
  const locked = useRef(false);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
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
  return <><form onSubmit={submit} noValidate className="max-w-4xl space-y-5"><Card className="p-5 sm:p-6"><div id="profile"><h2 className="text-[18px] font-semibold">Profil</h2><p className="mt-1 text-[13px] text-[#6E6E73]">Tekliflerinde kullanılacak adın.</p></div><div className="mt-6 grid gap-5 sm:grid-cols-2"><div><Input id="firstName" name="firstName" label="Ad" defaultValue={profile.first_name} autoComplete="given-name" /><ErrorText error={errors.firstName} /></div><div><Input id="lastName" name="lastName" label="Soyad" defaultValue={profile.last_name} autoComplete="family-name" /><ErrorText error={errors.lastName} /></div></div></Card><Card className="p-5 sm:p-6"><div id="business"><h2 className="text-[18px] font-semibold">İşletme</h2><p className="mt-1 text-[13px] text-[#6E6E73]">Müşterilerine gösterilecek bilgiler.</p></div><div className="mt-6 grid gap-5 sm:grid-cols-2"><div className="sm:col-span-2"><Input id="businessName" name="name" label="İşletme adı" defaultValue={business.name} autoComplete="organization" /><ErrorText error={errors.name} /></div><Input id="phone" name="phone" label="Telefon" type="tel" inputMode="tel" defaultValue={business.phone || ""} autoComplete="tel" /><Input id="city" name="city" label="Şehir" defaultValue={business.city || ""} autoComplete="address-level2" /><div className="sm:col-span-2"><Input id="profession" name="profession" label="Meslek" defaultValue={business.profession || ""} /><ErrorText error={errors.profession} /></div></div></Card><Card className="p-5 sm:p-6"><h2 className="text-[18px] font-semibold">Kâr Ayarları</h2><p className="mt-1 text-[13px] text-[#6E6E73]">İleride teklif fiyatları için kullanılacak marj hedeflerin.</p><div className="mt-6 grid gap-5 sm:grid-cols-2"><div><Input id="target" name="target" label="Hedef kâr marjı (%)" type="number" inputMode="decimal" min="0" max="90" step="0.01" defaultValue={business.default_profit_margin} /><ErrorText error={errors.target} /></div><div><Input id="minimum" name="minimum" label="Minimum kâr marjı (%)" type="number" inputMode="decimal" min="0" max="90" step="0.01" defaultValue={business.minimum_profit_margin} /><ErrorText error={errors.minimum} /></div></div><p className="mt-4 text-[13px] leading-5 text-[#77777e]">Kâr marjı, kârın satış fiyatına oranıdır.</p></Card><div className="flex justify-end"><Button type="submit" disabled={pending} className="min-h-12 w-full sm:w-auto">{pending ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}</Button></div></form>{toast && <Toast message={toast.message} kind={toast.kind} onClose={closeToast} />}</>;
}
