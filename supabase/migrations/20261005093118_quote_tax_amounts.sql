-- Pricing and profit use the pre-tax amount. Tax is added only to the customer total.
alter table public.quotes add column tax_rate numeric(5,2) check(tax_rate between 0 and 100);
create function private.save_quote_with_tax_rate(p_quote_id uuid,p_job_id uuid,p_status text,p_title text,p_description text,p_items jsonb,p_exclusions jsonb,p_duration text,p_payment_terms text,p_valid_until date,p_notes text,p_sale_price numeric,p_acknowledge_risk boolean,p_tax_mode text,p_tax_rate numeric)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if p_tax_rate is not null and (p_tax_rate<0 or p_tax_rate>100 or p_tax_rate<>round(p_tax_rate,2)) then raise exception 'Invalid tax rate';end if;
 v_id:=private.save_quote_details(p_quote_id,p_job_id,p_status,p_title,p_description,p_items,p_exclusions,p_duration,p_payment_terms,p_valid_until,p_notes,p_sale_price,p_acknowledge_risk,p_tax_mode);
 update public.quotes set tax_rate=case when p_tax_mode='unspecified' then null else p_tax_rate end where id=v_id;
 return v_id;
end $$;
revoke all on function private.save_quote_with_tax_rate(uuid,uuid,text,text,text,jsonb,jsonb,text,text,date,text,numeric,boolean,text,numeric) from public,anon;
grant execute on function private.save_quote_with_tax_rate(uuid,uuid,text,text,text,jsonb,jsonb,text,text,date,text,numeric,boolean,text,numeric) to authenticated;
create function public.save_quote_with_tax_rate(p_quote_id uuid,p_job_id uuid,p_status text,p_title text,p_description text,p_items jsonb,p_exclusions jsonb,p_duration text,p_payment_terms text,p_valid_until date,p_notes text,p_sale_price numeric,p_acknowledge_risk boolean,p_tax_mode text,p_tax_rate numeric)
returns uuid language sql security invoker set search_path='' as $$select private.save_quote_with_tax_rate(p_quote_id,p_job_id,p_status,p_title,p_description,p_items,p_exclusions,p_duration,p_payment_terms,p_valid_until,p_notes,p_sale_price,p_acknowledge_risk,p_tax_mode,p_tax_rate);$$;
revoke all on function public.save_quote_with_tax_rate(uuid,uuid,text,text,text,jsonb,jsonb,text,text,date,text,numeric,boolean,text,numeric) from public,anon;
grant execute on function public.save_quote_with_tax_rate(uuid,uuid,text,text,text,jsonb,jsonb,text,text,date,text,numeric,boolean,text,numeric) to authenticated;
create or replace function private.copy_quote_tax_mode() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.parent_quote_id is not null and old.parent_quote_id is null then select q.tax_mode,q.tax_rate into new.tax_mode,new.tax_rate from public.quotes q where q.id=new.parent_quote_id and q.business_id=new.business_id;end if;return new;
end $$;
do $$ declare d text;begin
 select pg_get_functiondef('private.copy_my_quote(uuid,boolean)'::regprocedure) into d;
 if strpos(d,'set tax_mode=v_q.tax_mode,')=0 then raise exception 'Copy contract changed';end if;
 execute replace(d,'set tax_mode=v_q.tax_mode,','set tax_rate=v_q.tax_rate,tax_mode=v_q.tax_mode,');
 select pg_get_functiondef('private.create_service_packages(uuid,jsonb,boolean)'::regprocedure) into d;
 execute replace(d,'set package_group_id=v_group','set tax_rate=q.tax_rate,package_group_id=v_group');
 select pg_get_functiondef('private.get_public_quote_details(uuid)'::regprocedure) into d;
 d:=replace(d,'''salePrice'',o.sale_price,','''salePrice'',o.sale_price,''taxRate'',o.tax_rate,''taxMode'',o.tax_mode,');
 execute replace(d,'''taxMode'',q.tax_mode,','''taxMode'',q.tax_mode,''taxRate'',q.tax_rate,');
end $$;
