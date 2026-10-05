create or replace function private.create_service_packages(p_quote_id uuid,p_options jsonb,p_acknowledge_risk boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
declare q public.quotes%rowtype; option jsonb; job_id uuid; quote_id uuid; cost numeric; price numeric; result jsonb:='[]'; scope jsonb;
begin
 if auth.uid() is null then raise exception 'Not authenticated';end if;
 select t.* into q from public.quotes t join public.businesses b on b.id=t.business_id where t.id=p_quote_id and b.owner_id=auth.uid();
 if not found then raise exception 'Quote not found';end if;
 if jsonb_typeof(p_options)<>'array' or jsonb_array_length(p_options)<>3 then raise exception 'Three options required';end if;
 for option in select value from jsonb_array_elements(p_options) loop
  cost:=(option->>'cost')::numeric;price:=(option->>'price')::numeric;
  if length(btrim(option->>'name')) not between 1 and 60 or length(btrim(option->>'scope')) not between 1 and 2000 or cost<=0 or cost>1e12 or price<=0 or price>1e12 or cost<>round(cost,2) or price<>round(price,2) then raise exception 'Invalid option';end if;
  job_id:=private.save_manual_job(null,q.customer_id,left(q.title||' · '||(option->>'name'),160),option->>'scope',jsonb_build_array(jsonb_build_object('name','Paket toplam maliyeti','category','other','quantity',1,'unit_cost',cost)));
  perform public.save_job_pricing(job_id,q.target_margin_snapshot,q.minimum_margin_snapshot,price,p_acknowledge_risk);
  scope:=jsonb_build_array(jsonb_build_object('name',option->>'name','description',option->>'scope'));
  quote_id:=private.save_quote_details(null,job_id,'draft',left(q.title||' · '||(option->>'name'),160),q.description,scope,
   coalesce((select jsonb_agg(text order by sort_order) from public.quote_exclusions e where e.quote_id=q.id),'[]'),q.estimated_duration_text,q.payment_terms,(now() at time zone 'Europe/Istanbul')::date+7,q.notes,null,p_acknowledge_risk,q.tax_mode);
  result:=result||jsonb_build_array(jsonb_build_object('id',quote_id,'name',option->>'name'));
 end loop;
 return result;
end;$$;
