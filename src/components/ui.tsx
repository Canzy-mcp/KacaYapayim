import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

const buttonStyles = {
  primary: "bg-[#0071E3] text-white hover:bg-[#0077ED] active:bg-[#006edb]",
  secondary: "bg-[#e8e8ed] text-[#1D1D1F] hover:bg-[#dedee3]",
  ghost: "text-[#0066CC] hover:bg-[#0071E3]/[.08]",
  danger: "bg-[#B42318] text-white hover:bg-[#912018]",
};

type ButtonVariant = keyof typeof buttonStyles;
const buttonBase = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-[15px] font-medium tracking-[-0.01em] transition-[background-color,transform] duration-200 active:scale-[.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071E3] disabled:cursor-not-allowed disabled:opacity-50 md:min-h-11";

export function Button({ variant = "primary", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button className={`${buttonBase} ${buttonStyles[variant]} ${className}`} {...props} />;
}

export function ButtonLink({ href, variant = "primary", className = "", children }: { href: string; variant?: ButtonVariant; className?: string; children: ReactNode }) {
  return <Link href={href} className={`${buttonBase} ${buttonStyles[variant]} ${className}`}>{children}</Link>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[22px] bg-white shadow-[0_1px_2px_rgba(0,0,0,.04),0_6px_24px_rgba(0,0,0,.04)] ring-1 ring-black/[.04] ${className}`}>{children}</div>;
}

export function SectionCard({ title, action, children, className = "" }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <Card className={className}><div className="flex items-center justify-between gap-3 border-b border-black/[.06] px-5 py-4 sm:px-6"><h2 className="text-[19px] font-semibold tracking-[-0.022em]">{title}</h2>{action}</div>{children}</Card>;
}

export function MetricCard({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: "blue" | "green" | "neutral" | "amber" }) {
  const dots = { blue: "bg-[#0071E3]", green: "bg-[#34C759]", neutral: "bg-[#6E6E73]", amber: "bg-[#FF9F0A]" };
  return <Card className="min-w-0 px-4 py-5 sm:px-5 sm:py-6"><div className="flex items-center gap-2 text-[13px] font-medium text-[#6E6E73]"><span className={`size-1.5 rounded-full ${dots[tone]}`} />{label}</div><p className="mt-4 break-words text-[clamp(1.5rem,2.2vw,2rem)] font-semibold leading-tight tracking-[-0.035em] tabular-nums">{value}</p><p className="mt-2 text-[13px] text-[#6E6E73]">{detail}</p></Card>;
}

export function Avatar({ size = "normal", initials = "MY" }: { size?: "normal" | "small"; initials?: string }) {
  return <span aria-label="Kullanıcı avatarı" className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#a1a1a6] to-[#6e6e73] font-semibold text-white ${size === "small" ? "size-9 text-[12px]" : "size-10 text-[13px]"}`}>{initials}</span>;
}

export function Input({ label, id, error, className = "", ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; id: string; error?: string }) {
  return <label htmlFor={id} className="block text-[14px] font-medium"><span className="mb-2 block">{label}</span><input id={id} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined} className={`h-12 w-full rounded-[12px] border border-[#D2D2D7] bg-white px-4 text-[17px] tracking-[-0.022em] outline-none transition-shadow placeholder:text-[#6e6e73] focus:border-[#0071E3] focus:ring-4 focus:ring-[#0071E3]/20 ${className}`} {...props} />{error && <span id={`${id}-error`} className="mt-2 block text-sm text-[#b42318]">{error}</span>}</label>;
}

export function Select({ label, id, children, className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; id: string; children: ReactNode }) {
  return <label htmlFor={id} className="block text-[14px] font-medium"><span className="mb-2 block">{label}</span><select id={id} className={`h-12 w-full rounded-[12px] border border-[#D2D2D7] bg-white px-4 text-[17px] tracking-[-0.022em] outline-none transition-shadow focus:border-[#0071E3] focus:ring-4 focus:ring-[#0071E3]/20 ${className}`} {...props}>{children}</select></label>;
}
