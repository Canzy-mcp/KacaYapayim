"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startJob } from "@/app/actions/job-lifecycle";

export function JobLifecycleActions({ id }: { id: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async () => {
    setBusy(true); setError("");
    const result = await startJob(id);
    setBusy(false);
    if (!result.ok) { setError(result.error); return; }
    setConfirm(false); router.refresh();
  };
  return <div><button type="button" onClick={() => setConfirm(true)} className="min-h-12 rounded-[13px] bg-[#1D1D1F] px-6 text-sm font-semibold text-white">İşi Başlat</button>{error && <p role="alert" className="mt-2 text-sm text-[#ae4439]">{error}</p>}{confirm && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center"><div role="dialog" aria-modal="true" aria-labelledby="start-title" className="w-full max-w-md rounded-[22px] bg-white p-6"><h2 id="start-title" className="text-xl font-semibold">Bu işi başlatmak istiyor musun?</h2><p className="mt-2 text-sm text-[#6E6E73]">Başlangıç tarihi bugün olarak kaydedilecek.</p><div className="mt-6 grid gap-2"><button type="button" disabled={busy} onClick={submit} className="min-h-12 rounded-xl bg-[#1D1D1F] text-sm font-semibold text-white disabled:opacity-60">{busy ? "Başlatılıyor..." : "Evet, İşi Başlat"}</button><button type="button" disabled={busy} onClick={() => setConfirm(false)} className="min-h-11 text-sm">Vazgeç</button></div></div></div>}</div>;
}
