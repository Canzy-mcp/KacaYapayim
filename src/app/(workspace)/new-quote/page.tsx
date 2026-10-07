import { createClient } from "@/lib/supabase/server";
import { ManualJobForm } from "@/components/jobs/manual-job-form";
import { notFound } from "next/navigation";
import { ButtonLink, Card } from "@/components/ui";
import { PainterJobWizard } from "@/components/jobs/painter-job-wizard";
import { ProfessionJobForm } from "@/components/jobs/profession-job-form";
import { getPublishedTemplate } from "@/lib/professions/service";
import { getBusinessCosts } from "@/lib/costs/service";
import { getCustomerById, getCustomers, isCustomerId } from "@/lib/customers/service";
import { getJobBundle, isJobId } from "@/lib/jobs/service";
import { requireCompletedViewer } from "@/lib/viewer";
import type { PainterCalculation } from "@/lib/jobs/painter-calculation";
import type { ProfessionTemplate } from "@/lib/professions/schema";
export const metadata = { title: "Yeni Teklif" };
export default async function NewQuotePage({ searchParams }: { searchParams: Promise<{ customer_id?: string; job_id?: string; step?: string; from_calculator?: string; from_extra_work?: string }> }) {
  const viewer = await requireCompletedViewer();
  const params = await searchParams;
  if (params.job_id && !isJobId(params.job_id)) notFound();
  const [costData, customerList, bundle, template] = await Promise.all([
    getBusinessCosts(), getCustomers(), params.job_id ? getJobBundle(params.job_id) : Promise.resolve(null),
    viewer.business?.profession_id ? getPublishedTemplate(viewer.business.profession_id) : Promise.resolve(null),
  ]);
  if (params.job_id && !bundle) notFound();
  if(params.from_extra_work){
    if(!isJobId(params.from_extra_work)||params.job_id)notFound();
    const client=await createClient();const entry=await client.from("work_entries").select("id,title,note,job_id,metadata").eq("id",params.from_extra_work).eq("business_id",viewer.business!.id).eq("kind","extra_work").eq("status","approved").maybeSingle();
    if(entry.error)throw new Error("Ek iş yüklenemedi.");if(!entry.data?.job_id)notFound();
    if(typeof entry.data.metadata.related_job_id==='string'&&isJobId(entry.data.metadata.related_job_id)){const {redirect}=await import("next/navigation");redirect(`/jobs/${entry.data.metadata.related_job_id}`);}
    const source=await getJobBundle(entry.data.job_id);if(!source)notFound();const customer=source.customer;
    return <><p className="mb-5 rounded-xl bg-blue-50 p-4 text-sm">Onaylı ek iş için ayrı teklif hazırlanıyor. Önce bu işin maliyetini gir, ardından satış fiyatını belirle. Mevcut kabul edilmiş teklif değişmez; gelir kendiliğinden eklenmez.</p><ManualJobForm sourceExtraId={entry.data.id} initialTitle={entry.data.title} initialDescription={entry.data.note} costs={costData.costs} customers={customerList.customers.slice(0,20)} selectedCustomer={customer?{id:customer.id,name:customer.name,phone:customer.phone,company_name:customer.company_name}:null}/></>;
  }
  const selected = bundle?.customer || (params.customer_id && isCustomerId(params.customer_id) ? await getCustomerById(params.customer_id) : null);
  const selectedCustomer = selected ? { id: selected.id, name: selected.name, company_name: selected.company_name, phone: selected.phone } : null;
  const customers = customerList.customers.slice(0, 20).map(({ id, name, company_name, phone }) => ({ id, name, company_name, phone }));
  if (params.from_calculator === '1' && !bundle) return <ManualJobForm costs={costData.costs} customers={customers} selectedCustomer={selectedCustomer} fromCalculator />;
  if (bundle?.job.input_data.manual === true || (!template && viewer.business?.profession !== 'Boyacı')) return <ManualJobForm costs={costData.costs} customers={customers} selectedCustomer={selectedCustomer} job={bundle?.job} />;
  if (viewer.business?.profession !== "Boyacı" || (template && !bundle?.details && !!process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    if (!template) return <div className="mx-auto max-w-[720px]"><Card className="p-8 text-center"><h1 className="text-[24px] font-semibold">Meslek şablonu bulunamadı</h1><p className="mt-2 text-[14px] leading-6 text-[#6E6E73]">Bu meslek için yayınlanmış bir iş formu henüz yok.</p><ButtonLink href="/dashboard" className="mt-6">Ana Sayfaya Dön</ButtonLink></Card></div>;
    if (bundle && !bundle.job.template_snapshot) notFound();
    return <ProfessionJobForm template={bundle?.job.template_snapshot ? bundle.job.template_snapshot as unknown as ProfessionTemplate : template}
      costs={costData.costs} settings={bundle?.job.settings_snapshot as Record<string, number> || costData.settings} customers={customers}
      job={bundle?.job} selectedCustomerId={selectedCustomer?.id} selectedCustomer={selectedCustomer} />;
  }
  if (bundle && !bundle.details) notFound();
  const breakdown = bundle?.breakdown || [];
  const sum = (type: "material" | "labor" | "fixed" | "extra") => breakdown.filter((line) => line.source_type === type)
    .reduce((total, line) => total + Math.round(line.total_cost * 100), 0) / 100;
  const initialCalculation: PainterCalculation | null = bundle ? {
    breakdown: breakdown.map((line) => ({ cost_item_id: line.cost_item_id || "", name: line.name, category: line.category,
      unit: line.unit, quantity: line.quantity, unit_cost: line.unit_cost, total_cost: line.total_cost,
      source_type: line.source_type, metadata: line.metadata as Record<string, number> })),
    material_total: sum("material"), labor_total: sum("labor"), other_total: sum("fixed") + sum("extra"),
    grand_total: bundle.job.estimated_cost, warnings: [],
  } : null;
  return <PainterJobWizard customers={customers} selectedCustomer={selectedCustomer} costs={costData.costs}
    settings={costData.painterSettings!} job={bundle?.job} details={bundle?.details}
    initialCalculation={initialCalculation} initialStep={bundle && params.step === "pricing" ? 4 : bundle && params.step === "customer" ? 0 : undefined}
    defaultTargetMargin={viewer.business.default_profit_margin} defaultMinimumMargin={viewer.business.minimum_profit_margin} />;
}
