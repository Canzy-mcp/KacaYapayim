
import { BrandLogo } from "@/components/brand-logo";
import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({ title, description, children, footer }: { title: string; description: string; children: ReactNode; footer?: ReactNode }) {
  return <main className="flex min-h-screen flex-col bg-canvas px-5 pb-12 pt-8 text-ink sm:items-center sm:justify-center sm:px-6"><div className="w-full max-w-[440px]"><Link href="/login" className="inline-flex text-[23px] font-semibold tracking-display"><BrandLogo size={48}/></Link><div className="mt-10 sm:mt-8 sm:rounded-xl sm:border sm:border-line sm:bg-white sm:p-8 sm:shadow-xs"><h1 className="text-[34px] font-semibold leading-[1.1] tracking-display">{title}</h1><p className="mt-3 text-[15px] leading-6 text-muted">{description}</p><div className="mt-8">{children}</div></div>{footer && <div className="mt-7 text-center text-[14px] text-muted">{footer}</div>}</div></main>;
}
