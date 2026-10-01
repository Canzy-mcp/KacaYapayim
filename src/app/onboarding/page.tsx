import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/wizard";
import { requireViewer } from "@/lib/viewer";
import { createClient } from "@/lib/supabase/server";
export const metadata = { title: "İlk Kurulum" };
export default async function OnboardingPage() {
  const viewer = await requireViewer();
  if (viewer.business?.onboarding_completed) redirect("/dashboard");
  const supabase = await createClient();
  const { data } = await supabase.from("professions").select("name").eq("is_active", true).eq("is_public", true)
    .not("current_version", "is", null).order("sort_order");
  return <OnboardingWizard initialBusiness={viewer.business} professionOptions={(data || []).map((item) => item.name)} />;
}
