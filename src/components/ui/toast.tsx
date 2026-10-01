"use client";

import { useEffect } from "react";
import { CircleCheck, CircleAlert } from "lucide-react";

export function Toast({ message, kind, onClose }: { message: string; kind: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const timer = window.setTimeout(onClose, 4200); return () => window.clearTimeout(timer); }, [message, onClose]);
  return <div role="status" className="fixed bottom-24 left-1/2 z-50 flex w-[min(calc(100%-2rem),370px)] -translate-x-1/2 items-center gap-2.5 rounded-[14px] border border-[#e5e5e9] bg-white px-4 py-3 text-[13px] font-medium shadow-[0_8px_30px_rgba(29,29,31,.12)] lg:bottom-6">{kind === "success" ? <CircleCheck size={17} className="shrink-0 text-[#2ca24f]" /> : <CircleAlert size={17} className="shrink-0 text-[#d23c32]" />}{message}</div>;
}
