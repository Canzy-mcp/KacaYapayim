import { notFound } from "next/navigation";
import { DemoShell } from "@/components/demo/demo-shell";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = { title: "Demo", robots: { index: false, follow: false } };
export default function DemoLayout({ children }: { children: React.ReactNode }) {
  if (isSupabaseConfigured()) notFound();
  return <DemoShell>{children}</DemoShell>;
}
