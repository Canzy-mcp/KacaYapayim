import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

const buttonStyles = {
  primary: "bg-primary text-white shadow-primary hover:bg-primary-hover",
  secondary: "border border-line-strong bg-surface text-ink shadow-xs hover:bg-surface-2",
  ghost: "text-primary hover:bg-primary-soft",
  danger: "border border-danger-200 bg-surface text-danger-ink shadow-xs hover:bg-danger-soft",
};

type ButtonVariant = keyof typeof buttonStyles;
const buttonBase = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold transition-[background-color,box-shadow,transform] duration-300 ease-[var(--ease-spring)] active:scale-[.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50";

export function Button({ variant = "primary", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button className={`${buttonBase} ${buttonStyles[variant]} ${className}`} {...props} />;
}

export function ButtonLink({ href, variant = "primary", className = "", children }: { href: string; variant?: ButtonVariant; className?: string; children: ReactNode }) {
  return <Link href={href} className={`${buttonBase} ${buttonStyles[variant]} ${className}`}>{children}</Link>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-line bg-surface shadow-xs ${className}`}>{children}</div>;
}

export function SectionCard({ title, action, children, className = "" }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <Card className={className}><div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6"><h2 className="text-[17px] font-semibold tracking-heading">{title}</h2>{action}</div>{children}</Card>;
}

export function MetricCard({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: "blue" | "green" | "neutral" | "amber" }) {
  const dots = { blue: "bg-primary", green: "bg-success", neutral: "bg-subtle", amber: "bg-tape" };
  return <Card className="min-w-0 px-4 py-5 sm:px-5 sm:py-6"><div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-muted"><span className={`h-1 w-3 ${dots[tone]}`} />{label}</div><p className="mt-4 break-words font-display text-[clamp(1.625rem,2.4vw,2.25rem)] font-bold leading-tight tracking-heading tabular-nums">{value}</p><p className="mt-2 text-[13px] text-muted">{detail}</p></Card>;
}

export function Avatar({ size = "normal", initials = "MY" }: { size?: "normal" | "small"; initials?: string }) {
  return <span aria-label="Kullanıcı avatarı" className={`inline-flex shrink-0 items-center justify-center rounded-full bg-primary-soft font-semibold text-primary-ink ${size === "small" ? "size-9 text-[12px]" : "size-10 text-[13px]"}`}>{initials}</span>;
}

export function Input({ label, id, error, className = "", ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; id: string; error?: string }) {
  return <label htmlFor={id} className="block text-[14px] font-semibold text-ink-2"><span className="mb-1.5 block">{label}</span><input id={id} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined} className={`h-11 w-full rounded-lg border border-line-strong bg-surface px-3.5 text-[16px] font-normal text-ink shadow-xs outline-none transition-shadow placeholder:text-subtle focus:border-primary focus:ring-4 focus:ring-primary/15 ${className}`} {...props} />{error && <span id={`${id}-error`} className="mt-2 block text-[13px] font-medium text-danger-ink">{error}</span>}</label>;
}

export function Select({ label, id, children, className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; id: string; children: ReactNode }) {
  return <label htmlFor={id} className="block text-[14px] font-semibold text-ink-2"><span className="mb-1.5 block">{label}</span><select id={id} className={`h-11 w-full rounded-lg border border-line-strong bg-surface px-3.5 text-[16px] font-normal text-ink shadow-xs outline-none transition-shadow focus:border-primary focus:ring-4 focus:ring-primary/15 ${className}`} {...props}>{children}</select></label>;
}
