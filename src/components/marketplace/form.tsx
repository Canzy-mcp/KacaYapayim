"use client";

import { startTransition, useActionState } from "react";
import Link from "next/link";
import { marketAction } from "@/app/actions/marketplace";
import type { MarketAction } from "@kacayapayim/core/marketplace";

const primary = "inline-flex min-h-11 items-center justify-center rounded-full bg-[#075D54] px-5 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#064A43] disabled:opacity-60";
const secondary = "inline-flex min-h-11 items-center justify-center rounded-full border border-[#d2d2d7] bg-white px-5 py-2 text-sm font-semibold text-[#1d1d1f] hover:bg-[#f5f5f7] disabled:opacity-60";

export function MarketForm({ action, fields = {}, children, label, inline = false, subtle = false, success = "Kaydedildi." }: {
  action: MarketAction; fields?: Record<string, string | null | undefined>; children?: React.ReactNode;
  label: string; inline?: boolean; subtle?: boolean; success?: string;
}) {
  const [state, submit, pending] = useActionState(marketAction.bind(null, action), {});
  return <form action={submit} aria-busy={pending} onSubmit={(event) => {
    event.preventDefault();
    if (!pending) {
      const data = new FormData(event.currentTarget);
      startTransition(() => submit(data));
    }
  }} className={inline ? "inline-flex flex-wrap items-center gap-2" : "grid gap-3"}>
    {Object.entries(fields).filter(([, value]) => value != null).map(([name, value]) => <input key={name} type="hidden" name={name} value={value ?? ""} />)}
    <div key={state.saved ?? 0} className="contents">{children}</div>
    <div><button type="submit" className={subtle ? secondary : primary} disabled={pending}>{pending ? "Kaydediliyor…" : label}</button></div>
    {state.error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{state.error}{state.needsEntry && <Link href="/billing" className="ml-2 font-semibold underline">Üyeliği başlat — 199 ₺ tek seferlik</Link>}</p>}
    {!!state.saved && !state.error && <p role="status" className="text-sm text-[#2F7D4F]">{success}</p>}
  </form>;
}
