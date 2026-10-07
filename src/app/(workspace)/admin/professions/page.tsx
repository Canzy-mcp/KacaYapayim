import { requireAdminMfa } from "@/lib/account/mfa";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui";
import { ProfessionBuilder } from "@/components/admin/profession-builder";
import { createServiceClient } from "@/lib/supabase/admin";
import { requireViewer } from "@/lib/viewer";
import type { ProfessionTemplate } from "@/lib/professions/schema";

export const metadata = { title: "Meslek Şablonları" };
export default async function AdminProfessionsPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const viewer = await requireViewer();
  const service = createServiceClient();
  const { data: admin } = await service.from("platform_admins").select("user_id").eq("user_id", viewer.id).maybeSingle();
  if (!admin) redirect("/dashboard");
  try { await requireAdminMfa(); } catch { return <Card className="p-6"><h1 className="text-xl font-semibold">Yönetici doğrulaması gerekli</h1><p className="mt-3 text-sm">Ayarlardan iki aşamalı doğrulamayı etkinleştir ve güncel kodla giriş yap.</p><Link className="mt-4 inline-flex min-h-11 items-center text-[#0071e3]" href="/settings">Güvenlik ayarlarına git</Link></Card>; }
  const { id } = await searchParams;
  const { data: professions } = await service.from("professions").select("id,name,slug,current_version,is_active")
    .order("sort_order").order("name");
  const selected = professions?.find((item) => item.id === id);
  let template: ProfessionTemplate | null = null;
  if (selected) {
    const version = (selected.current_version || 0) + 1;
    const { data: draft } = await service.from("profession_template_versions").select("template")
      .eq("profession_id", selected.id).eq("version", version).eq("status", "draft").maybeSingle();
    if (draft) template = draft.template as ProfessionTemplate;
    else if (selected.current_version) {
      const { data: published } = await service.from("profession_template_versions").select("template")
        .eq("profession_id", selected.id).eq("version", selected.current_version).eq("status", "published").maybeSingle();
      if (published) template = { ...published.template as ProfessionTemplate, version };
    }
  }
  return <div className="mx-auto max-w-[1100px]"><h1 className="text-[34px] font-semibold tracking-[-0.05em]">Meslek şablonları</h1><p className="mt-2 text-sm text-[#6E6E73]">İş formlarını, maliyetleri, hesapları ve teklif kapsamını buradan yönet.</p><div className="mt-7 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]"><Card className="h-fit p-3"><Link href="/admin/professions" className="block rounded-xl px-3 py-3 text-sm font-semibold text-[#0071E3] hover:bg-[#f4f9ff]">+ Yeni meslek</Link>{professions?.map((item) => <Link key={item.id} href={`/admin/professions?id=${item.id}`} className={`block rounded-xl px-3 py-3 text-sm hover:bg-[#f4f9ff] ${id === item.id ? "bg-[#eef6ff] font-semibold" : ""}`}>{item.name}<span className="mt-1 block text-xs text-[#6E6E73]">{item.is_active ? `Sürüm ${item.current_version}` : item.current_version ? "Arşivde" : "Taslak"}</span></Link>)}</Card><ProfessionBuilder key={selected?.id || "new"} professionId={selected?.id} initial={template} isActive={Boolean(selected?.is_active)} hasPublished={Boolean(selected?.current_version)} /></div></div>;
}
