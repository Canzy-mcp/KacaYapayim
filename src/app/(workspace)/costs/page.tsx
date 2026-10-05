import { getBusinessCosts } from "@/lib/costs/service";
import { CostsView } from "@/components/costs/costs-view";
import { ProfessionSettingsForm } from "@/components/costs/profession-settings-form";
import { getPublishedTemplate } from "@/lib/professions/service";
import { requireCompletedViewer } from "@/lib/viewer";
export const metadata = { title: "Maliyetlerim" };
export default async function CostsPage() {
  const viewer = await requireCompletedViewer();
  const [data, template] = await Promise.all([getBusinessCosts(), viewer.business?.profession_id ? getPublishedTemplate(viewer.business.profession_id) : Promise.resolve(null)]);
  return <><a href="/api/export/costs" className="mb-5 inline-flex min-h-11 items-center rounded-xl border bg-white px-4 text-sm">CSV Dışa Aktar</a><CostsView {...data} />{!data.isPainter && template && <ProfessionSettingsForm definitions={template.settings} initial={data.settings} />}</>;
}
