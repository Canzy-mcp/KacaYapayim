"use client";

import { useEffect, useState } from "react";
import { CalendarCheck, MessageCircle, Tag } from "lucide-react";

// Illustrative notifications only; the hero caption marks them as representative.
const events = [
  { icon: Tag, tone: "bg-tape text-ink", title: "Yeni teklif · Usta A", value: "18.200 ₺" },
  { icon: CalendarCheck, tone: "bg-success text-white", title: "Keşif onaylandı", value: "Salı 10:00" },
  { icon: MessageCircle, tone: "bg-primary text-white", title: "Usta B yazdı", value: "Yarın uygun" },
] as const;

/** Dynamic-Island style live activity that springs open, holds, collapses and moves to the next event. */
export function LiveIsland() {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(true);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer = window.setTimeout(function step() {
      setOpen(false);
      timer = window.setTimeout(() => { setIndex(i => (i + 1) % events.length); setOpen(true); timer = window.setTimeout(step, 3400); }, 650);
    }, 3400);
    return () => window.clearTimeout(timer);
  }, []);
  const { icon: Icon, tone, title, value } = events[index];
  return <div aria-hidden="true" className={`ky-live${open ? " is-open" : ""}`}>
    <span className={`ky-live-icon ${tone}`}><Icon size={14} strokeWidth={2.4} /></span>
    <span className="ky-live-body"><span className="ky-live-text"><span>{title}</span><strong>{value}</strong></span></span>
  </div>;
}
