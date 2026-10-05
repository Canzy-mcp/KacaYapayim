import { DraftProvider } from "@/components/draft-provider";
import { AppShell } from "@/components/layout";
import { requireCompletedViewer } from "@/lib/viewer";
import type { Metadata } from "next";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireCompletedViewer();
  if (!viewer.profile || !viewer.business) throw new Error("Bilgiler yüklenemedi.");
  return <AppShell user={{ profile: viewer.profile, business: viewer.business }}><DraftProvider scope={`${viewer.id}:${viewer.business.id}`}>{children}</DraftProvider></AppShell>;
}
