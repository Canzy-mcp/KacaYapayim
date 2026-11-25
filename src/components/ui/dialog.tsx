"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function Dialog({ title, children, onClose, busy = false, className = "max-w-lg" }: {
  title: string; children: ReactNode; onClose: () => void; busy?: boolean; className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    if (!mounted) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current!;
    dialog.showModal();
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { dialog.close(); document.body.style.overflow = oldOverflow; previous?.focus(); };
  }, [mounted]);
  if (!mounted) return null;
  return createPortal(<dialog ref={ref} aria-labelledby={id} onSubmit={event => event.stopPropagation()} onCancel={e => { e.preventDefault(); if (!busy) close.current(); }}
    onKeyDown={event => {
      if (event.key !== "Tab") return;
      const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]')).filter(element => element.getClientRects().length > 0);
      const first = controls[0], last = controls.at(-1);
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }}
    onClick={e => { const bounds = e.currentTarget.getBoundingClientRect(); if (e.target === e.currentTarget && !busy && (e.clientX < bounds.left || e.clientX > bounds.right || e.clientY < bounds.top || e.clientY > bounds.bottom)) close.current(); }}
    className={`m-auto max-h-[90dvh] w-[calc(100%_-_24px)] overflow-y-auto rounded-2xl border border-line bg-surface p-6 shadow-float backdrop:bg-ink/40 ${className}`}>
    <div className="mb-5 flex items-center justify-between gap-4"><h2 id={id} className="text-lg font-semibold tracking-heading">{title}</h2>
      <button type="button" autoFocus disabled={busy} aria-label="Kapat" onClick={onClose} className="min-h-10 min-w-10 rounded-lg text-muted hover:bg-neutral-soft hover:text-ink">✕</button></div>
    {children}
  </dialog>, document.body);
}
