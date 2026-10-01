"use client";

import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { saveProfessionSettings } from "@/app/actions/profession-settings";
import type { ProfessionSetting } from "@/lib/professions/schema";

export function ProfessionSettingsForm({ definitions, initial }: { definitions: ProfessionSetting[]; initial: Record<string, number> }) {
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(definitions.map((item) => [item.key, String(initial[item.key] ?? item.defaultValue)])));
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  async function save() {
    setPending(true); setMessage("");
    try {
      const parsed = Object.fromEntries(definitions.map((item) => [item.key, values[item.key]?.trim() ? Number(values[item.key].replace(",", ".")) : Number.NaN]));
      const result = await saveProfessionSettings(parsed);
      setMessage(result.ok ? "İş ayarları kaydedildi." : result.error);
    } catch { setMessage("Ayarlar kaydedilemedi."); }
    finally { setPending(false); }
  }
  if (!definitions.length) return null;
  return <section className="mx-auto mt-10 max-w-[1000px]"><h2 className="text-[20px] font-semibold tracking-[-0.03em]">İş Ayarları</h2><p className="mt-1 text-sm text-[#6E6E73]">Mesleğine özel hesaplama değerleri.</p><Card className="mt-4 p-5 sm:p-6"><div className="grid gap-5 sm:grid-cols-2">{definitions.map((item) => <label key={item.key} className="block text-sm font-semibold">{item.name}<div className="mt-2 flex items-center gap-3"><input type="text" inputMode="decimal" value={values[item.key]} onChange={(event) => setValues({ ...values, [item.key]: event.target.value })} className="h-12 w-28 rounded-xl border border-[#d2d2d7] bg-white px-4 text-base outline-none focus:border-[#0071E3]" /><span className="text-xs font-normal text-[#6E6E73]">{item.unit || ""}</span></div></label>)}</div>{message && <p role="status" className="mt-5 text-sm">{message}</p>}<Button onClick={save} disabled={pending} className="mt-6">{pending ? "Kaydediliyor..." : "İş Ayarlarını Kaydet"}</Button></Card></section>;
}
