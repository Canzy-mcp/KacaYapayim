import Link from "next/link";
import { ArrowRight, FilePlus2, Plus, UserRoundPlus, WalletCards } from "lucide-react";
import { ButtonLink, Card, SectionCard } from "@/components/ui";

const quoteSteps = ["Müşteri", "İş Detayları", "İşçilik", "Maliyet", "Fiyat"] as const;

const quickActions = [
  { label: "Yeni Teklif", href: "/new-quote", icon: FilePlus2 },
  { label: "Yeni Müşteri", href: "/customers/new", icon: UserRoundPlus },
  { label: "Maliyet Ekle", href: "/costs", icon: WalletCards },
] as const;

export function QuickActions() {
  return <SectionCard title="Hızlı İşlemler"><div className="divide-y divide-line">{quickActions.map(({ label, href, icon: Icon }) => <Link key={label} href={href} className="flex min-h-[64px] items-center gap-3 px-5 text-[14px] font-medium transition-colors hover:bg-surface-2 sm:px-6"><span className="flex size-8 items-center justify-center rounded-lg bg-surface-2 text-ink-2"><Icon size={17} strokeWidth={1.8} /></span><span className="flex-1">{label}</span><ArrowRight size={16} className="text-subtle" /></Link>)}</div></SectionCard>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: { label: string; href: string } }) {
  return <Card className="flex min-h-[310px] flex-col items-center justify-center px-6 py-10 text-center"><div className="mb-5 flex size-12 items-center justify-center rounded-[15px] bg-surface-2 text-muted"><FilePlus2 size={21} strokeWidth={1.7} /></div><h2 className="text-[20px] font-semibold tracking-heading">{title}</h2><p className="mt-2 max-w-sm text-[14px] leading-6 text-muted">{description}</p>{action && <ButtonLink href={action.href} className="mt-6 min-h-12"><Plus size={17} />{action.label}</ButtonLink>}</Card>;
}

export function StepIndicator({ activeStep = 0 }: { activeStep?: number }) {
  return <div aria-label="Teklif oluşturma adımları" className="w-full"><ol className="flex items-start gap-1 sm:gap-2">{quoteSteps.map((step, index) => <li key={step} aria-current={index === activeStep ? "step" : undefined} className="flex min-w-0 flex-1 flex-col items-center gap-2"><div className="flex w-full items-center gap-1 sm:gap-2"><span className={`h-[3px] min-w-0 flex-1 rounded-full ${index <= activeStep ? "bg-primary" : "bg-line"}`} /></div><span className={`hidden text-center text-[12px] font-medium sm:block ${index === activeStep ? "text-primary" : "text-muted"}`}>{index + 1}. {step}</span></li>)}</ol><p className="mt-3 text-[13px] font-medium text-primary sm:hidden">{activeStep + 1} / {quoteSteps.length} · {quoteSteps[activeStep]}</p></div>;
}

export function Modal({ open, title, children, onClose }: { open: boolean; title: string; children: React.ReactNode; onClose: () => void }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"><div className="flex items-center justify-between gap-4"><h2 className="text-[20px] font-semibold">{title}</h2><button type="button" onClick={onClose} aria-label="Kapat" className="flex size-10 items-center justify-center rounded-full bg-surface-2 text-[22px]">×</button></div><div className="mt-4">{children}</div></div></div>;
}
