-- Read-only deployment preflight. No application records or credentials.
with objects as (
 select 'relation' kind,n.nspname||'.'||c.relname key,
 jsonb_build_object('kind',c.relkind,'rls',c.relrowsecurity,'forced',c.relforcerowsecurity) value
 from pg_class c join pg_namespace n on n.oid=c.relnamespace
 where n.nspname in ('public','private') and c.relkind in ('r','v','m')
 union all
 select 'column',n.nspname||'.'||c.relname||'.'||a.attname,
 jsonb_build_object('type',format_type(a.atttypid,a.atttypmod),'nullable',not a.attnotnull,'default',pg_get_expr(d.adbin,d.adrelid))
 from pg_attribute a join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace
 left join pg_attrdef d on d.adrelid=c.oid and d.adnum=a.attnum
 where n.nspname in ('public','private') and c.relkind='r' and a.attnum>0 and not a.attisdropped
 union all
 select 'constraint',n.nspname||'.'||c.relname||'.'||x.conname,to_jsonb(pg_get_constraintdef(x.oid))
 from pg_constraint x join pg_class c on c.oid=x.conrelid join pg_namespace n on n.oid=c.relnamespace
 where n.nspname in ('public','private') and x.contype<>'n'
 union all
 select 'index',schemaname||'.'||tablename||'.'||indexname,to_jsonb(indexdef)
 from pg_indexes where schemaname in ('public','private')
 union all
 select 'function',n.nspname||'.'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||')',
 jsonb_build_object('definition',pg_get_functiondef(p.oid),'owner',pg_get_userbyid(p.proowner),'acl',p.proacl::text)
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname in ('public','private') and p.prokind='f'
 and not exists(select 1 from pg_depend d where d.classid='pg_proc'::regclass and d.objid=p.oid and d.deptype='e')
 union all
 select 'policy',schemaname||'.'||tablename||'.'||policyname,
 jsonb_build_object('permissive',permissive,'roles',roles,'cmd',cmd,'qual',qual,'check',with_check)
 from pg_policies where schemaname in ('public','private') or (schemaname='storage' and tablename='objects' and policyname like 'business_assets%')
 union all
 select 'trigger',n.nspname||'.'||c.relname||'.'||t.tgname,to_jsonb(pg_get_triggerdef(t.oid))
 from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace
 where not t.tgisinternal and n.nspname in ('public','private')
 union all
 select 'enum',n.nspname||'.'||t.typname,to_jsonb(array_agg(e.enumlabel order by e.enumsortorder))
 from pg_type t join pg_namespace n on n.oid=t.typnamespace join pg_enum e on e.enumtypid=t.oid
 where n.nspname in ('public','private') group by n.nspname,t.typname
)
select kind,key,value from objects order by kind,key;
