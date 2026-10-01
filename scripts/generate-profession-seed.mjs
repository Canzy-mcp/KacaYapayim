import { readFileSync, writeFileSync } from 'node:fs';
import { builtInTemplates } from '../src/lib/professions/templates.ts';
import { compileTemplate } from '../src/lib/professions/engine.ts';

const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
const migrationPath = 'supabase/migrations/202609300012_dynamic_professions.sql';
const marker = '-- Built-in version 1 templates and cost defaults.';
const lines = [marker];
for (const [index, template] of builtInTemplates.entries()) {
  compileTemplate(template);
  const seed = JSON.stringify(template);
  lines.push(`insert into public.professions(slug,name,description,icon,category,is_active,is_public,current_version,sort_order)
values(${quote(template.slug)},${quote(template.name)},${quote(template.description)},${quote(template.icon)},${quote(template.category)},true,true,1,${(index + 1) * 10})
on conflict(slug) do update set category=excluded.category,current_version=greatest(coalesce(public.professions.current_version,0),1);`);
  lines.push(`insert into public.profession_template_versions(profession_id,version,status,template,published_at)
select p.id,1,'published',${quote(seed)}::jsonb,now() from public.professions p where p.slug=${quote(template.slug)}
on conflict(profession_id,version) do nothing;`);
  for (const cost of template.costs) lines.push(`insert into public.profession_cost_templates(profession_id,key,name,category,unit,default_value,is_required,sort_order)
select p.id,${quote(cost.key)},${quote(cost.name)},${quote(cost.category)},${quote(cost.unit)},${cost.defaultValue},${Boolean(cost.required)},${cost.sortOrder}
from public.professions p where p.slug=${quote(template.slug)}
on conflict(profession_id,key) do nothing;`);
}
const existing = readFileSync(migrationPath, 'utf8');
const prefix = existing.includes(marker) ? existing.slice(0, existing.indexOf(marker)) : existing;
writeFileSync(migrationPath, prefix.trimEnd() + '\n\n' + lines.join('\n') + '\n');
