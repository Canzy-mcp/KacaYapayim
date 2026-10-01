"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui";
import { Modal } from "@/components/content";

export function PlaceholderAction({ label }: { label: string }) {
  const [open, setOpen] = useState(false);
  return <><Button onClick={() => setOpen(true)} className="min-h-12 w-full sm:w-auto"><Plus size={18} />{label}</Button><Modal open={open} title={label} onClose={() => setOpen(false)}><p className="text-[14px] leading-6 text-[#6E6E73]">Bu işlem sonraki aşamada kullanıma açılacak. Şimdilik arayüzü inceleyebilirsin.</p><Button variant="secondary" className="mt-5 w-full" onClick={() => setOpen(false)}>Kapat</Button></Modal></>;
}
