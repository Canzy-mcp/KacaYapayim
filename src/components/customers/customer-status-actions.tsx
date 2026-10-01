"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { archiveCustomer, restoreCustomer } from "@/app/actions/customers";
import { Button } from "@/components/ui";
import { Toast } from "@/components/ui/toast";

export function CustomerStatusActions({ id, archived, initialNotice }: { id: string; archived: boolean; initialNotice?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<{ message: string; kind: "success" | "error" } | null>(initialNotice ? { message: initialNotice, kind: "success" } : null);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (initialNotice) router.replace(`/customers/${id}`, { scroll: false });
  }, [initialNotice, id, router]);
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onPointer); document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onPointer); document.removeEventListener("keydown", onKey); };
  }, [open]);
  async function changeStatus() {
    setPending(true);
    try {
      const result = archived ? await restoreCustomer(id) : await archiveCustomer(id);
      if (result.ok) { setNotice({ message: archived ? "Müşteri yeniden aktifleştirildi." : "Müşteri arşivlendi.", kind: "success" }); setConfirm(false); router.refresh(); }
      else setNotice({ message: result.error || "İşlem tamamlanamadı.", kind: "error" });
    } catch { setNotice({ message: "İşlem tamamlanamadı. Tekrar dene.", kind: "error" }); }
    finally { setPending(false); }
  }
  return <><div ref={ref} className="relative"><button type="button" aria-label="Diğer işlemler" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)} className="flex size-11 items-center justify-center rounded-[13px] border border-[#D2D2D7] bg-white hover:bg-[#f7f7f9]"><MoreHorizontal size={20} /></button>{open && <div role="menu" className="absolute right-0 top-[calc(100%+8px)] z-30 min-w-44 rounded-[13px] border border-[#e5e5e9] bg-white p-1.5 shadow-[0_12px_35px_rgba(29,29,31,.12)]"><button role="menuitem" type="button" onClick={() => { setOpen(false); setConfirm(true); }} className="min-h-11 w-full rounded-lg px-3 text-left text-[13px] font-medium hover:bg-[#f5f5f7]">{archived ? "Aktifleştir" : "Müşteriyi Arşivle"}</button></div>}</div>
    {confirm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) setConfirm(false); }}><div role="alertdialog" aria-modal="true" aria-labelledby="archive-title" className="w-full max-w-[410px] rounded-[20px] bg-white p-6 shadow-2xl"><h2 id="archive-title" className="text-[19px] font-semibold tracking-tight">{archived ? "Müşteriyi aktifleştir" : "Müşteriyi arşivle"}</h2><p className="mt-2 text-[14px] leading-6 text-[#6E6E73]">{archived ? "Bu müşteri yeniden aktif listede görünecek." : "Bu müşteri aktif listeden kaldırılıp arşive taşınacak. İstediğin zaman geri alabilirsin."}</p><div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse"><Button disabled={pending} onClick={changeStatus}>{pending ? "İşleniyor..." : archived ? "Aktifleştir" : "Arşivle"}</Button><Button variant="secondary" disabled={pending} onClick={() => setConfirm(false)}>Vazgeç</Button></div></div></div>}
    {notice && <Toast message={notice.message} kind={notice.kind} onClose={() => setNotice(null)} />}
  </>;
}
