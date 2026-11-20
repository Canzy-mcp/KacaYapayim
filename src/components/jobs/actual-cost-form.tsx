import { hasFeature } from "@/lib/billing/catalog";
import { getEffectivePlan } from "@/lib/billing/service";
import { requireCompletedViewer } from "@/lib/viewer";
import { ActualCostFields, type ActualCostFormProps } from "./actual-cost-fields";

export async function ActualCostForm(props: ActualCostFormProps) {
  const viewer = await requireCompletedViewer();
  const plan = await getEffectivePlan(viewer.business!.id);
  return <ActualCostFields {...props} canViewActualProfit={hasFeature(plan, "actual_profit")} />;
}
