import { createClient } from "@/lib/supabase/server";
import { compileTemplate } from "./engine";
import type { ProfessionTemplate } from "./schema";

export async function getPublishedTemplate(professionId: string): Promise<ProfessionTemplate | null> {
  const supabase = await createClient();
  const { data: profession, error: professionError } = await supabase.from("professions")
    .select("id,current_version,is_active,is_public").eq("id", professionId).maybeSingle();
  if (professionError) throw new Error("Meslek yüklenemedi.");
  if (!profession?.is_active || !profession.is_public || !profession.current_version) return null;
  const { data, error } = await supabase.from("profession_template_versions").select("template")
    .eq("profession_id", professionId).eq("version", profession.current_version).eq("status", "published").maybeSingle();
  if (error) throw new Error("Meslek şablonu yüklenemedi.");
  if (!data) return null;
  const template = data.template as ProfessionTemplate;
  compileTemplate(template);
  return template;
}
