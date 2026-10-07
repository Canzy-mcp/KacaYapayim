import { DemoShell } from "@/components/demo/demo-shell";

export const metadata = { title: "Demo", robots: { index: false, follow: false } };
export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <DemoShell>{children}</DemoShell>;
}
