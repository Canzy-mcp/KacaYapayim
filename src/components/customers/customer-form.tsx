"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { createCustomer, updateCustomer, type CustomerActionResult } from "@/app/actions/customers";
import { customerSources } from "@/lib/customers/catalog";
import { formatTurkishPhone, normalizeTurkishPhone } from "@/lib/customers/format";
import { Button, Card, Input, Select } from "@/components/ui";
import type { Customer } from "@/types/database";
import { UpgradeModal } from "@/components/billing/upgrade-modal";

function ErrorText({ message }: { message?: string }) { return message ? <p role="alert" className="mt-1 text-[12px] text-[#c7352d]">{message}</p> : null; }
const textareaStyle = "min-h-28 w-full resize-y rounded-[13px] border border-[#D2D2D7] bg-white px-4 py-3 text-[16px] outline-none placeholder:text-[#6e6e73] focus:border-[#0071E3] focus:ring-3 focus:ring-[#0071E3]/15";

export function CustomerForm({ customer, onCreated, onCancel }: { customer?: Customer; onCreated?: (customer: { id: string; name: string; company_name: string | null; phone: string | null }) => void; onCancel?: () => void }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [needsUpgrade, setNeedsUpgrade] = useState(false);
  const [duplicate, setDuplicate] = useState<CustomerActionResult["duplicate"]>(undefined);
  const returnHref = customer ? `/customers/${customer.id}` : "/customers";
  async function save(allowDuplicate: boolean) {
    if (!formRef.current || pending) return;
    setPending(true); setErrors({}); setMessage(""); setDuplicate(undefined); setNeedsUpgrade(false);
    const data = new FormData(formRef.current);
    if (allowDuplicate) data.set("allow_duplicate", "true");
    try {
      const result = customer ? await updateCustomer(customer.id, data) : await createCustomer(data);
      if (result.ok && result.id) {
        if (onCreated) { onCreated({ id: result.id, name: String(data.get('name') || '').trim(), company_name: String(data.get('company_name') || '').trim() || null, phone: normalizeTurkishPhone(String(data.get('phone') || '')) || null }); return; }
        router.push(`/customers/${result.id}?${customer ? "updated" : "created"}=1`);
        router.refresh();
        return;
      }
      setErrors(result.fieldErrors || {});
      setDuplicate(result.duplicate);
      setNeedsUpgrade(Boolean(result.needsUpgrade));
      if (result.error) setMessage(result.error);
    } catch { setMessage("Müşteri kaydedilemedi. Tekrar dene."); }
    finally { setPending(false); }
  }
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void save(false); }
  return <div className="mx-auto max-w-[860px]">{!onCancel && <Link href={returnHref} className="mb-6 inline-flex min-h-11 items-center gap-2 text-[14px] font-medium text-[#6E6E73] hover:text-[#1D1D1F]"><ArrowLeft size={17} />{customer ? "Müşteriye Dön" : "Müşteriler"}</Link>}<header className="mb-7"><h1 className="text-[34px] font-semibold leading-tight tracking-[-0.055em] sm:text-[42px]">{customer ? "Müşteriyi Düzenle" : "Yeni Müşteri"}</h1><p className="mt-2 text-[15px] leading-6 text-[#6E6E73]">{customer ? "İletişim ve adres bilgilerini güncelle." : "Başlamak için yalnızca ad soyad yeterli."}</p></header>
    <form ref={formRef} onSubmit={submit} noValidate className="space-y-5"><Card className="p-5 sm:p-6"><h2 className="text-[18px] font-semibold tracking-tight">Temel Bilgiler</h2><div className="mt-5 grid gap-5 sm:grid-cols-2"><div className="sm:col-span-2"><Input id="customer-name" name="name" label="Ad Soyad *" required maxLength={120} defaultValue={customer?.name || ""} autoComplete="name" aria-invalid={Boolean(errors.name)} /><ErrorText message={errors.name} /></div><div><Input id="customer-phone" name="phone" label="Telefon" type="tel" inputMode="tel" maxLength={40} placeholder="05XX XXX XX XX" defaultValue={formatTurkishPhone(customer?.phone || null).replace("—", "")} autoComplete="tel" aria-invalid={Boolean(errors.phone)} onBlur={(event) => { const normalized = normalizeTurkishPhone(event.currentTarget.value); if (normalized) event.currentTarget.value = formatTurkishPhone(normalized); }} /><ErrorText message={errors.phone} /></div><div><Input id="customer-email" name="email" label="E-posta" type="email" maxLength={254} defaultValue={customer?.email || ""} autoComplete="email" aria-invalid={Boolean(errors.email)} /><ErrorText message={errors.email} /></div><div className="sm:col-span-2"><Input id="customer-company" name="company_name" label="Firma Adı" maxLength={160} defaultValue={customer?.company_name || ""} autoComplete="organization" /><ErrorText message={errors.company_name} /></div></div></Card>
    <Card className="p-5 sm:p-6"><h2 className="text-[18px] font-semibold tracking-tight">Adres</h2><div className="mt-5 grid gap-5 sm:grid-cols-2"><div><Input id="customer-city" name="city" label="İl" maxLength={100} defaultValue={customer?.city || ""} autoComplete="address-level2" /><ErrorText message={errors.city} /></div><div><Input id="customer-district" name="district" label="İlçe" maxLength={100} defaultValue={customer?.district || ""} autoComplete="address-level3" /><ErrorText message={errors.district} /></div><div className="sm:col-span-2"><label htmlFor="customer-address" className="mb-2 block text-[14px] font-medium">Açık Adres</label><textarea id="customer-address" name="address" maxLength={500} defaultValue={customer?.address || ""} autoComplete="street-address" className={textareaStyle} /><ErrorText message={errors.address} /></div></div></Card>
    <Card className="p-5 sm:p-6"><h2 className="text-[18px] font-semibold tracking-tight">Diğer</h2><div className="mt-5 space-y-5"><div><Select id="customer-source" name="source" label="Müşteri Kaynağı" defaultValue={customer?.source || ""}><option value="">Seçilmedi</option>{customerSources.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}</Select><ErrorText message={errors.source} /></div><div><label htmlFor="customer-notes" className="mb-2 block text-[14px] font-medium">Notlar</label><textarea id="customer-notes" name="notes" maxLength={2000} defaultValue={customer?.notes || ""} placeholder="Bu müşteriyle ilgili hatırlamak istediklerin" className={textareaStyle} /><ErrorText message={errors.notes} /></div></div></Card>
    {duplicate && <Card className="border-[#f2d6a3] bg-[#fffaf0] p-5 sm:p-6"><h2 className="text-[16px] font-semibold">Bu telefon numarasıyla kayıtlı bir müşteri zaten var.</h2><p className="mt-1 text-[14px] text-[#6E6E73]">{duplicate.name}{duplicate.is_archived ? " · Arşivde" : ""}</p><div className="mt-4 flex flex-col gap-2 sm:flex-row"><Link href={`/customers/${duplicate.id}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[13px] border border-[#D2D2D7] bg-white px-4 text-[14px] font-semibold"><ExternalLink size={16} />Müşteriyi Aç</Link><Button type="button" disabled={pending} onClick={() => void save(true)} variant="secondary">Yine de Kaydet</Button></div></Card>}
    {message && <div role="alert" className="rounded-xl bg-[#fff0ef] px-4 py-3 text-[13px] text-[#b93831]">{message}{needsUpgrade && <Link href="/billing" className="ml-2 font-semibold underline">Paketleri Gör</Link>}</div>}
    <div className="flex flex-col gap-2 sm:flex-row-reverse sm:justify-start"><Button type="submit" disabled={pending} className="min-h-12 w-full sm:w-auto">{pending ? "Kaydediliyor..." : customer ? "Değişiklikleri Kaydet" : "Müşteriyi Kaydet"}</Button>{onCancel ? <Button type="button" variant="secondary" onClick={onCancel}>İptal</Button> : <Link href={returnHref} className="inline-flex min-h-12 items-center justify-center rounded-[13px] border border-[#D2D2D7] bg-white px-4 text-[14px] font-semibold text-[#1D1D1F]">İptal</Link>}</div></form>{needsUpgrade && <UpgradeModal title="Aktif müşteri sınırına ulaştın." description="Ücretsiz planda 20 aktif müşteri ekleyebilirsin. Eski bir müşteriyi arşivleyebilir veya Usta paketini inceleyebilirsin." onClose={() => setNeedsUpgrade(false)} />}
  </div>;
}
