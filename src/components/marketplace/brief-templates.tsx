"use client";

import { briefTemplates } from "@/lib/marketplace/prefill";

// Client-side only: writes a scaffold into the description textarea. The user can edit everything.
export function BriefTemplates({ textareaId, titleName = "title" }: { textareaId: string; titleName?: string }) {
  function apply(id: string) {
    const template = briefTemplates.find((item) => item.id === id);
    const area = document.getElementById(textareaId) as HTMLTextAreaElement | null;
    if (!template || !area) return;
    const current = area.value.trim();
    const next = current ? `${current}\n\n${template.text}` : template.text;
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
    setter?.call(area, next.slice(0, 3000));
    area.dispatchEvent(new Event("input", { bubbles: true }));
    const title = area.form?.elements.namedItem(titleName) as HTMLInputElement | null;
    if (title && !title.value.trim()) {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(title, template.title);
      title.dispatchEvent(new Event("input", { bubbles: true }));
    }
    area.focus();
    area.setSelectionRange(0, 0);
  }
  return <fieldset className="grid gap-2 rounded-xl border border-[#d2d2d7] bg-[#f5f5f7] p-3">
    <legend className="px-1 text-sm font-medium">Hazır iş tarifi şablonu <span className="font-normal text-[#515154]">(isteğe bağlı)</span></legend>
    <p className="text-sm text-[#515154]">Birini seç, açıklama alanına yazılacak başlıkları doldur. İstediğini değiştirebilir veya silebilirsin.</p>
    <div className="flex flex-wrap gap-2">{briefTemplates.map((item) => <button key={item.id} type="button" onClick={() => apply(item.id)}
      className="inline-flex min-h-11 items-center rounded-full border border-[#d2d2d7] bg-white px-4 py-2 text-sm font-semibold text-[#1d1d1f] transition-colors duration-150 hover:bg-[#f5f5f7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#075D54]">{item.label}</button>)}</div>
  </fieldset>;
}
