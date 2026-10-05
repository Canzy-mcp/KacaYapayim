create table public.service_package_groups(id uuid primary key default gen_random_uuid(),business_id uuid not null references public.businesses(id) on delete cascade,selected_quote_id uuid references public.quotes(id) on delete set null);
alter table public.service_package_groups enable row level security;
grant select on public.service_package_groups to authenticated;
grant all on public.service_package_groups to service_role;
create policy owner_package_groups on public.service_package_groups for select to authenticated using(exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=auth.uid()));
alter table public.quotes add column package_group_id uuid references public.service_package_groups(id) on delete set null;
create index quotes_package_group on public.quotes(package_group_id) where package_group_id is not null;
do $$ declare d text;begin
 select pg_get_functiondef('private.create_service_packages(uuid,jsonb,boolean)'::regprocedure) into d;
 if strpos(d,'declare q public.quotes%rowtype;')=0 or strpos(d,'return result;')=0 then raise exception 'Package contract changed';end if;
 d:=replace(d,'declare q public.quotes%rowtype;','declare v_group uuid; q public.quotes%rowtype;');
 d:=replace(d,'return result;','insert into public.service_package_groups(business_id) values(q.business_id) returning id into v_group; update public.quotes set package_group_id=v_group where id in(select (value->>''id'')::uuid from jsonb_array_elements(result)); return result;');execute d;
end $$;

create function private.publish_service_packages(p_quote_id uuid,p_acknowledge_risk boolean) returns uuid language plpgsql security definer set search_path='' as $$
declare g uuid; c uuid; t uuid; n integer;
begin
 select q.package_group_id,q.customer_id into g,c from public.quotes q join public.businesses b on b.id=q.business_id where q.id=p_quote_id and b.owner_id=auth.uid();
 if g is null or c is null then raise exception 'Package/customer unavailable';end if;
 perform 1 from public.service_package_groups where id=g and selected_quote_id is null for update;
 if not found then raise exception 'Package already selected';end if;
 select count(*) into n from public.quotes q where q.package_group_id=g and q.customer_id=c and q.status='draft' and q.sale_price>0 and q.valid_until>=(now() at time zone 'Europe/Istanbul')::date and length(btrim(q.title))>0 and exists(select 1 from public.quote_items i where i.quote_id=q.id);
 if n<>3 then raise exception 'Three valid drafts required';end if;
 if not coalesce(p_acknowledge_risk,false) and exists(select 1 from public.quotes where package_group_id=g and profit_margin_snapshot<minimum_margin_snapshot) then raise exception 'Price risk acknowledgement required';end if;
 update public.quotes set status='ready' where package_group_id=g;
 update public.jobs set status='quoted' where id in(select job_id from public.quotes where package_group_id=g) and status='calculated';
 select public_token into t from public.quotes where id=p_quote_id;return t;
end $$;
revoke all on function private.publish_service_packages(uuid,boolean) from public,anon;
grant execute on function private.publish_service_packages(uuid,boolean) to authenticated;
create function public.publish_service_packages(p_quote_id uuid,p_acknowledge_risk boolean) returns uuid language sql security invoker set search_path='' as $$select private.publish_service_packages(p_quote_id,p_acknowledge_risk);$$;
revoke all on function public.publish_service_packages(uuid,boolean) from public,anon;
grant execute on function public.publish_service_packages(uuid,boolean) to authenticated;

create function private.respond_to_package_quote(p_token uuid,p_action text,p_reason text,p_note text) returns text language plpgsql security definer set search_path='' as $$
declare q public.quotes%rowtype; chosen uuid; result text;
begin
 select * into q from public.quotes where public_token=p_token;
 if not found then raise exception 'Quote unavailable';end if;
 if q.package_group_id is not null then
  select selected_quote_id into chosen from public.service_package_groups where id=q.package_group_id for update;
  if chosen is not null and chosen<>q.id then raise exception 'Another package selected';end if;
 end if;
 result:=public.respond_to_quote(p_token,p_action,p_reason,p_note);
 if result='accepted' and q.package_group_id is not null then
  update public.service_package_groups set selected_quote_id=q.id where id=q.package_group_id;
  update public.quotes set status='cancelled' where package_group_id=q.package_group_id and id<>q.id and status in('draft','ready','sent','viewed');
  update public.jobs set status='cancelled' where id in(select job_id from public.quotes where package_group_id=q.package_group_id and status='cancelled') and status in('draft','calculated','quoted');
 end if;
 return result;
end $$;
revoke all on function private.respond_to_package_quote(uuid,text,text,text) from public,anon,authenticated;
grant execute on function private.respond_to_package_quote(uuid,text,text,text) to service_role;
create function public.respond_to_package_quote(p_token uuid,p_action text,p_reason text default null,p_note text default null) returns text language sql security invoker set search_path='' as $$select private.respond_to_package_quote(p_token,p_action,p_reason,p_note);$$;
revoke all on function public.respond_to_package_quote(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.respond_to_package_quote(uuid,text,text,text) to service_role;

create or replace function private.get_public_quote_details(p_token uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare r jsonb; q public.quotes%rowtype; options jsonb;
begin
 r:=public.get_public_quote(p_token);if r is null then return null;end if;
 select * into q from public.quotes where public_token=p_token and status<>'draft';
 select coalesce(jsonb_agg(jsonb_build_object('token',o.public_token,'title',o.title,'description',(select i.description from public.quote_items i where i.quote_id=o.id order by i.sort_order limit 1),'salePrice',o.sale_price,'status',o.status) order by o.sale_price,o.id),'[]'::jsonb) into options
 from public.quotes o where q.package_group_id is not null and o.package_group_id=q.package_group_id and o.business_id=q.business_id and o.customer_id=q.customer_id and o.status<>'draft';
 return r||jsonb_build_object('taxMode',q.tax_mode,'packageOptions',options);
end $$;
