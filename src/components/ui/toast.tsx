"use client";

import { useEffect } from "react";
import { Check, X } from "lucide-react";

/** Dynamic-Island style notification: an ink capsule that springs out from the top centre. */
export function Toast({ message, kind, onClose }: { message: string; kind: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const timer = window.setTimeout(onClose, 4200); return () => window.clearTimeout(timer); }, [message, onClose]);
  return <div role="status" className="ky-toast-island fixed inset-x-0 top-3 z-50 mx-auto flex w-fit max-w-[calc(100%-1.5rem)] items-center gap-3 rounded-full bg-island py-1.5 pl-1.5 pr-5 text-[14px] font-semibold text-white shadow-float">
    <span className={`grid size-8 shrink-0 place-items-center rounded-full ${kind === "success" ? "bg-success" : "bg-danger"}`}>{kind === "success" ? <Check size={16} strokeWidth={3} aria-hidden="true" /> : <X size={16} strokeWidth={3} aria-hidden="true" />}</span>
    <span className="min-w-0">{message}</span>
  </div>;
}
