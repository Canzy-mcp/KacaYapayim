"use server";
import { logFailure } from "@/lib/observability/log";

import { revalidatePath } from "next/cache";
import { requireViewer } from "@/lib/viewer";
import { createServiceClient } from "@/lib/supabase/admin";
import { compileTemplate } from "@/lib/professions/engine";
import { TemplateError, type ProfessionTemplate } from "@/lib/professions/schema";

async function requirePlatformAdmin() {
  const viewer = await requireViewer();
  const service = createServiceClient();
  const { data, error } = await service.from("platform_admins").select("user_id").eq("user_id", viewer.id).maybeSingle();
  if (error || !data) throw new Error("Yönetici erişimi gerekli.");
  return { viewer, service };
}

function validateTemplate(raw: ProfessionTemplate) {
  if (!raw || typeof raw !== "object" || JSON.stringify(raw).length > 100000 ||
    !Array.isArray(raw.sections) || !Array.isArray(raw.fields) || !Array.isArray(raw.settings) ||
    !Array.isArray(raw.costs) || !Array.isArray(raw.formulas) || !Array.isArray(raw.quoteItems) ||
    !Array.isArray(raw.quoteExclusions) || !Array.isArray(raw.validations ?? []) || !raw.name?.trim() || raw.name.length > 80 ||
    !raw.category?.trim() || raw.category.length > 80 || raw.description?.length > 500 || raw.icon?.length > 80)
    throw new TemplateError("INVALID_TEMPLATE", "Şablon bilgilerini kontrol et.");
  compileTemplate(raw);
}

export async function saveProfessionDraft(input: { professionId: string | null; template: ProfessionTemplate }) {
  try {
    const { service } = await requirePlatformAdmin();
    const template = input.template;
    validateTemplate(template);
    let professionId = input.professionId;
    let version = 1;
    if (professionId) {
      const { data: profession, error } = await service.from("professions").select("id,slug,current_version").eq("id", professionId).single();
      if (error || !profession || profession.slug !== template.slug) return { ok: false, error: "Meslek bulunamadı." } as const;
      version = (profession.current_version || 0) + 1;
    } else {
      const { data: created, error } = await service.from("professions").insert({ slug: template.slug, name: template.name,
        description: template.description, icon: template.icon, category: template.category, is_active: false, is_public: false }).select("id").single();
      if (error || !created) return { ok: false, error: "Meslek oluşturulamadı. Adı veya kısa kodu kullanımda olabilir." } as const;
      professionId = created.id;
    }
    const snapshot = { ...template, version };
    const { data: existing } = await service.from("profession_template_versions").select("id,status")
      .eq("profession_id", professionId!).eq("version", version).maybeSingle();
    if (existing?.status === "published") return { ok: false, error: "Yayınlanan sürüm değiştirilemez." } as const;
    const write = existing ? service.from("profession_template_versions").update({ template: snapshot as unknown as Record<string, unknown> }).eq("id", existing.id) :
      service.from("profession_template_versions").insert({ profession_id: professionId!, version, status: "draft", template: snapshot as unknown as Record<string, unknown> });
    const { error } = await write;
    if (error) { logFailure("Profession draft save failed"); return { ok: false, error: "Taslak kaydedilemedi." } as const; }
    revalidatePath("/admin/professions");
    return { ok: true, professionId, version } as const;
  } catch (error) {
    if (error instanceof TemplateError) return { ok: false, error: error.message } as const;
    logFailure("Profession draft failed");
    return { ok: false, error: "Taslak kaydedilemedi." } as const;
  }
}

export async function publishProfessionDraft(professionId: string) {
  try {
    const { viewer, service } = await requirePlatformAdmin();
    const { data: profession } = await service.from("professions").select("id,current_version").eq("id", professionId).single();
    if (!profession) return { ok: false, error: "Meslek bulunamadı." } as const;
    const version = (profession.current_version || 0) + 1;
    const { data: draft } = await service.from("profession_template_versions").select("template")
      .eq("profession_id", professionId).eq("version", version).eq("status", "draft").maybeSingle();
    if (!draft) return { ok: false, error: "Önce taslağı kaydet." } as const;
    const template = draft.template as ProfessionTemplate;
    validateTemplate(template);
    const { error } = await service.rpc("publish_profession_template", { p_admin_id: viewer.id,
      p_profession_id: professionId, p_version: version, p_template: template as unknown as Record<string, unknown> });
    if (error) { logFailure("Profession publish failed"); return { ok: false, error: "Şablon yayınlanamadı. Maliyet birimlerini ve alanları kontrol et." } as const; }
    revalidatePath("/admin/professions"); revalidatePath("/onboarding");
    return { ok: true, version } as const;
  } catch (error) {
    if (error instanceof TemplateError) return { ok: false, error: error.message } as const;
    logFailure("Profession publish failed");
    return { ok: false, error: "Şablon yayınlanamadı." } as const;
  }
}

export async function deleteProfessionDraft(professionId: string) {
  try {
    const { service } = await requirePlatformAdmin();
    const { data: profession } = await service.from("professions").select("current_version").eq("id", professionId).single();
    if (!profession) return { ok: false, error: "Meslek bulunamadı." } as const;
    const { error } = await service.from("profession_template_versions").delete().eq("profession_id", professionId)
      .eq("version", (profession.current_version || 0) + 1).eq("status", "draft");
    if (error) return { ok: false, error: "Taslak silinemedi." } as const;
    if (!profession.current_version) {
      const { error: deleteError } = await service.from("professions").delete().eq("id", professionId).is("current_version", null);
      if (deleteError) return { ok: false, error: "Taslak silindi ancak meslek kaydı kaldı." } as const;
    }
    revalidatePath("/admin/professions");
    return { ok: true } as const;
  } catch { return { ok: false, error: "Taslak silinemedi." } as const; }
}

export async function setProfessionArchived(professionId: string, archived: boolean) {
  try {
    const { service } = await requirePlatformAdmin();
    const { data: profession } = await service.from("professions").select("id,current_version").eq("id", professionId).single();
    if (!profession?.current_version) return { ok: false, error: "Yayınlanmış sürüm bulunamadı." } as const;
    const { error } = await service.from("professions").update({ is_active: !archived, is_public: !archived }).eq("id", professionId);
    if (error) return { ok: false, error: "Meslek durumu değiştirilemedi." } as const;
    revalidatePath("/admin/professions"); revalidatePath("/onboarding");
    return { ok: true } as const;
  } catch { return { ok: false, error: "Meslek durumu değiştirilemedi." } as const; }
}
