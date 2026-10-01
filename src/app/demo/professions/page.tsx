"use client";

import Link from "next/link";
import { useState } from "react";
import { ProfessionJobForm } from "@/components/jobs/profession-job-form";
import { builtInTemplates } from "@/lib/professions/templates";
import type { BusinessCostItem } from "@/types/database";

const samples: Record<string, Record<string, number | boolean>> = {
  painter: { wall_area: 200, ceiling_area: 80, primer_required: true, master_count: 2, helper_count: 1 },
  electrician: { socket_count: 10, cable_2_5_length: 100, days: 2 },
  plumber: { pipe_length: 10, valve_count: 2 },
  hvac: { pipe_length: 5, wall_holes: 1 },
};

export default function DemoProfessionsPage() {
  const [selected, setSelected] = useState(0);
  const template = builtInTemplates[selected];
  const costs: BusinessCostItem[] = template.costs.map((cost) => ({ id: cost.key, business_id: "demo", template_id: cost.key,
    key: cost.key, name: cost.name, category: cost.category, unit: cost.unit, unit_cost: cost.defaultValue,
    metadata: {}, is_active: true, sort_order: cost.sortOrder, created_at: "", updated_at: "" }));
  return <div><Link href="/demo" className="text-sm font-medium text-[#6E6E73]">← Demo ana sayfa</Link><div className="mx-auto mb-7 mt-6 max-w-[1050px]"><div className="flex flex-wrap gap-2">{builtInTemplates.map((item, index) => <button key={item.slug} type="button" onClick={() => setSelected(index)} aria-pressed={selected === index} className={`rounded-full px-4 py-2 text-sm font-medium ${selected === index ? "bg-[#0071E3] text-white" : "bg-white text-[#515159]"}`}>{item.name}</button>)}</div><p className="mt-4 text-xs text-[#6E6E73]">Örnek verilerle çalışan form. Kaydetmek için Supabase projesi ve hesap gerekir.</p></div><ProfessionJobForm key={template.slug} template={template} costs={costs} settings={{}} customers={[]} initialFields={samples[template.slug]} demo /></div>;
}
