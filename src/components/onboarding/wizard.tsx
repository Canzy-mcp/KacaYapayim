"use client";

import { BrandLogo } from "@/components/brand-logo";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { ArrowLeft, Check, CircleCheck, LogOut } from "lucide-react";
import { Button, Card, Input } from "@/components/ui";
import { completeOnboarding, saveBusinessBasics, saveMargins, saveProfession, type SaveResult } from "@/app/actions/account";
import { logoutAction } from "@/app/actions/auth";
import { marginErrors, parseMargin, type FieldErrors } from "@/lib/validation";
import type { Business, OnboardingStep } from "@/types/database";

const headings = ["İşletmeni oluşturalım.", "Ne iş yapıyorsun?", "Kâr hedefini belirle.", "Hazırsın."];
const descriptions = ["Tekliflerinde görünecek temel bilgileri gir.", "KaçaYapayım'ı işine göre hazırlayalım.", "Teklif fiyatlarını hesaplarken bu değerleri kullanacağız.", "KaçaYapayım artık işletmene göre hazır."];

export function OnboardingWizard({ initialBusiness, professionOptions }: { initialBusiness: Business | null; professionOptions: string[] }) {
  const professions = [...professionOptions, "Diğer"];
  const router = useRouter();
  const locked = useRef(false);
  const [step, setStep] = useState<OnboardingStep>(initialBusiness?.onboarding_step || 1);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState("");
  const [name, setName] = useState(initialBusiness?.name || "");
  const [phone, setPhone] = useState(initialBusiness?.phone || "");
  const [city, setCity] = useState(initialBusiness?.city || "");
  const initialProfession = initialBusiness?.profession || "";
  const [profession, setProfession] = useState(initialProfession && !professions.includes(initialProfession) ? "Diğer" : initialProfession);
  const [otherProfession, setOtherProfession] = useState(initialProfession && !professions.includes(initialProfession) ? initialProfession : "");
  const [target, setTarget] = useState(String(initialBusiness?.default_profit_margin ?? 30));
  const [minimum, setMinimum] = useState(String(initialBusiness?.minimum_profit_margin ?? 20));

  async function run(action: () => Promise<SaveResult>, onSuccess: () => void) {
    if (locked.current) return;
    locked.current = true; setPending(true); setMessage(""); setErrors({});
    try {
      const result = await action();
      if (result.ok) { onSuccess(); router.refresh(); }
      else { setErrors(result.fieldErrors || {}); setMessage(result.error || ""); }
    } catch { setMessage("Bir sorun oluştu. Tekrar dene."); }
    finally { locked.current = false; setPending(false); }
  }

  function submitBasics() {
    if (!name.trim()) { setErrors({ name: "İşletme adını gir." }); return; }
    const form = new FormData();
    form.set("name", name); form.set("phone", phone); form.set("city", city);
    run(() => saveBusinessBasics(form), () => setStep(2));
  }

  function submitProfession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const selected = profession === "Diğer" ? otherProfession.trim() : profession;
    if (!selected) { setErrors({ profession: "Bir meslek seç veya mesleğini yaz." }); return; }
    const form = new FormData(); form.set("profession", selected);
    run(() => saveProfession(form), () => setStep(3));
  }

  function submitMargins(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = marginErrors(parseMargin(target), parseMargin(minimum));
    if (Object.keys(validation).length) { setErrors(validation); return; }
    const form = new FormData(); form.set("target", target); form.set("minimum", minimum);
    run(() => saveMargins(form), () => setStep(4));
  }

  return <main className="min-h-screen bg-[#F5F5F7] px-5 pb-16 pt-7 text-[#1D1D1F] sm:px-6 sm:pt-10"><div className="mx-auto max-w-[620px]"><header className="flex items-center justify-between"><Link href="/onboarding" className="text-[23px] font-semibold tracking-[-0.055em]"><BrandLogo size={40}/></Link><button type="button" onClick={async () => { await logoutAction(); router.replace("/login"); router.refresh(); }} className="flex min-h-11 items-center gap-1.5 text-[13px] font-medium text-[#6E6E73]"><LogOut size={15} />Çıkış</button></header><div className="mt-12 sm:mt-14"><div className="flex items-center justify-between text-[13px] font-medium text-[#6E6E73]"><span>İlk kurulum</span><span>{step === 4 ? "Tamamlandı" : `Adım ${step} / 3`}</span></div><div aria-label="Kurulum ilerlemesi" className="mt-3 flex gap-2">{[1, 2, 3].map((index) => <span key={index} className={`h-1 flex-1 rounded-full ${index <= step ? "bg-[#0071E3]" : "bg-[#dedee3]"}`} />)}</div><div className="mt-10"><h1 className="text-[34px] font-semibold leading-[1.1] tracking-[-0.055em] sm:text-[42px]">{headings[step - 1]}</h1><p className="mt-3 text-[15px] leading-6 text-[#6E6E73]">{descriptions[step - 1]}</p></div><Card className="mt-8 p-5 sm:p-8">{step === 1 && <form onSubmit={(event) => { event.preventDefault(); submitBasics(); }} className="space-y-5"><div><Input id="business-name" label="İşletme adı" name="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Yılmaz Boya" autoComplete="organization" required />{errors.name && <ErrorText>{errors.name}</ErrorText>}</div><Input id="phone" label="Telefon" name="phone" type="tel" inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="05XX XXX XX XX" autoComplete="tel" /><Input id="city" label="Şehir" name="city" value={city} onChange={(event) => setCity(event.target.value)} placeholder="İstanbul" autoComplete="address-level2" /><p className="text-[13px] text-[#77777e]">Telefon ve şehri daha sonra da ekleyebilirsin.</p>{message && <ErrorText>{message}</ErrorText>}<Button type="submit" disabled={pending} className="min-h-12 w-full">{pending ? "Kaydediliyor..." : "Devam Et"}</Button><button type="button" disabled={pending} onClick={submitBasics} className="min-h-11 w-full text-[14px] font-medium text-[#6E6E73]">Daha sonra</button></form>}{step === 2 && <form onSubmit={submitProfession}><div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">{professions.map((item) => <button type="button" key={item} onClick={() => { setProfession(item); setErrors({}); }} aria-pressed={profession === item} className={`flex min-h-[58px] items-center justify-between gap-2 rounded-[14px] border px-3 text-left text-[14px] font-medium transition-colors sm:px-4 ${profession === item ? "border-[#0071E3] bg-[#eef6ff] text-[#006aca]" : "border-[#e2e2e6] bg-white hover:bg-[#f8f8fa]"}`}>{item}{profession === item && <Check size={17} />}</button>)}</div>{profession === "Diğer" && <div className="mt-5"><Input id="other-profession" label="Mesleğin" value={otherProfession} onChange={(event) => setOtherProfession(event.target.value)} placeholder="Camcı" />{errors.profession && <ErrorText>{errors.profession}</ErrorText>}</div>}{profession !== "Diğer" && errors.profession && <ErrorText>{errors.profession}</ErrorText>}{message && <ErrorText>{message}</ErrorText>}<Button type="submit" disabled={pending} className="mt-7 min-h-12 w-full">{pending ? "Kaydediliyor..." : "Devam Et"}</Button><BackButton onClick={() => setStep(1)} /></form>}{step === 3 && <form onSubmit={submitMargins} className="space-y-6"><div><Input id="target-margin" label="Hedef kâr marjı (%)" type="number" inputMode="decimal" min="0" max="90" step="0.01" value={target} onChange={(event) => setTarget(event.target.value)} /><p className="mt-1.5 text-[13px] text-[#77777e]">Normalde ulaşmak istediğin kâr oranı.</p>{errors.target && <ErrorText>{errors.target}</ErrorText>}</div><div><Input id="minimum-margin" label="Minimum kabul edilebilir kâr marjı (%)" type="number" inputMode="decimal" min="0" max="90" step="0.01" value={minimum} onChange={(event) => setMinimum(event.target.value)} /><p className="mt-1.5 text-[13px] text-[#77777e]">Bu seviyenin altındaki tekliflerde seni uyaracağız.</p>{errors.minimum && <ErrorText>{errors.minimum}</ErrorText>}</div>{message && <ErrorText>{message}</ErrorText>}<Button type="submit" disabled={pending} className="min-h-12 w-full">{pending ? "Kaydediliyor..." : "Devam Et"}</Button><BackButton onClick={() => setStep(2)} /></form>}{step === 4 && <div className="text-center"><div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#eaf8ee] text-[#34a853]"><CircleCheck size={29} strokeWidth={1.7} /></div><h2 className="mt-5 text-[22px] font-semibold">İşletmen hazır.</h2><div className="mt-6 rounded-[16px] bg-[#f7f7f9] p-5 text-left"><p className="text-[18px] font-semibold">{name}</p><p className="mt-1 text-[14px] text-[#6E6E73]">{profession === "Diğer" ? otherProfession : profession}</p><div className="mt-4 grid grid-cols-2 gap-4 border-t border-[#e5e5e9] pt-4 text-[13px]"><div><p className="text-[#77777e]">Hedef marj</p><p className="mt-1 font-semibold">%{target}</p></div><div><p className="text-[#77777e]">Minimum</p><p className="mt-1 font-semibold">%{minimum}</p></div></div></div>{message && <ErrorText>{message}</ErrorText>}<Button type="button" disabled={pending} onClick={() => run(completeOnboarding, () => { router.replace("/dashboard"); router.refresh(); })} className="mt-6 min-h-12 w-full">{pending ? "Tamamlanıyor..." : "Dashboard'a Git"}</Button><BackButton onClick={() => setStep(3)} /></div>}</Card></div></div></main>;
}

function ErrorText({ children }: { children: React.ReactNode }) { return <p role="alert" className="mt-2 text-[13px] text-[#c4362e]">{children}</p>; }
function BackButton({ onClick }: { onClick: () => void }) { return <button type="button" onClick={onClick} className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-[14px] font-medium text-[#6E6E73]"><ArrowLeft size={16} />Geri</button>; }
