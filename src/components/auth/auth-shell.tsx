
import { BrandLogo } from "@/components/brand-logo";
import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({ title, description, children, footer }: { title: string; description: string; children: ReactNode; footer?: ReactNode }) {
  return <main className="flex min-h-screen flex-col bg-[#F5F5F7] px-5 pb-12 pt-8 text-[#1D1D1F] sm:items-center sm:justify-center sm:px-6"><div className="w-full max-w-[440px]"><Link href="/login" className="inline-flex text-[23px] font-semibold tracking-[-0.055em]"><BrandLogo size={48}/></Link><div className="mt-10 sm:mt-8 sm:rounded-[20px] sm:border sm:border-[#e5e5e9] sm:bg-white sm:p-8 sm:shadow-[0_2px_10px_rgba(29,29,31,.025)]"><h1 className="text-[34px] font-semibold leading-[1.1] tracking-[-0.055em]">{title}</h1><p className="mt-3 text-[15px] leading-6 text-[#6E6E73]">{description}</p><div className="mt-8">{children}</div></div>{footer && <div className="mt-7 text-center text-[14px] text-[#6E6E73]">{footer}</div>}</div></main>;
}
