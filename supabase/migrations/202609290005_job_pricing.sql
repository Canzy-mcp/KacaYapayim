-- Job pricing is a snapshot. Business margin changes never rewrite old jobs.
alter table public.jobs
  add column target_profit_margin numeric(6,2),
  add column minimum_profit_margin numeric(6,2),
  add column recommended_sale_price_exact numeric(24,6),
  add column recommended_sale_price numeric(18,2),
  add column minimum_sale_price_exact numeric(24,6),
  add column minimum_sale_price numeric(18,2),
  add column selected_sale_price numeric(18,2),
  add column selected_price_mode text,
  add column estimated_profit numeric(18,2),
  add column estimated_profit_margin numeric(24,4),
  add column pricing_status text,
  add column priced_at timestamptz,
  add column pricing_cost_changed boolean not null default false,
  add constraint jobs_target_margin_valid check (target_profit_margin is null or target_profit_margin > 0 and target_profit_margin <= 90),
  add constraint jobs_minimum_margin_valid check (minimum_profit_margin is null or minimum_profit_margin >= 0 and minimum_profit_margin <= 89 and minimum_profit_margin <= target_profit_margin),
  add constraint jobs_selected_price_valid check (selected_sale_price is null or selected_sale_price >= 0),
  add constraint jobs_price_mode_valid check (selected_price_mode is null or selected_price_mode in ('recommended','custom')),
  add constraint jobs_pricing_status_valid check (pricing_status is null or pricing_status in ('target','acceptable','below_minimum','loss'));

-- The existing atomic cost RPC updates estimated_cost last. This trigger updates the
-- recommendation in the same transaction and preserves a manually selected price.
create function public.refresh_job_pricing_on_cost() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_target numeric;
  v_minimum numeric;
  v_sale numeric;
  v_margin numeric;
begin
  if new.estimated_cost is not distinct from old.estimated_cost then return new; end if;
  select greatest(b.default_profit_margin, 1), least(b.minimum_profit_margin, 89) into v_target, v_minimum
  from public.businesses b where b.id = new.business_id;
  new.target_profit_margin := coalesce(old.target_profit_margin, v_target);
  new.minimum_profit_margin := coalesce(old.minimum_profit_margin, v_minimum);
  if new.target_profit_margin is null or new.target_profit_margin <= 0 or new.target_profit_margin > 90 or
     new.minimum_profit_margin is null or new.minimum_profit_margin < 0 or
     new.minimum_profit_margin > 89 or new.minimum_profit_margin > new.target_profit_margin then
    raise exception 'Invalid business pricing margins';
  end if;
  if new.estimated_cost > 0 then
    new.recommended_sale_price_exact := round(new.estimated_cost / (1 - new.target_profit_margin / 100), 6);
    new.minimum_sale_price_exact := round(new.estimated_cost / (1 - new.minimum_profit_margin / 100), 6);
    new.recommended_sale_price := ceil(new.estimated_cost / (1 - new.target_profit_margin / 100) / 100) * 100;
    new.minimum_sale_price := ceil(new.estimated_cost / (1 - new.minimum_profit_margin / 100) / 100) * 100;
  else
    new.recommended_sale_price_exact := null;
    new.minimum_sale_price_exact := null;
    new.recommended_sale_price := null;
    new.minimum_sale_price := null;
  end if;
  if old.selected_sale_price is not null then
    if old.selected_price_mode = 'recommended' then
      new.selected_sale_price := new.recommended_sale_price;
    else
      new.selected_sale_price := old.selected_sale_price;
    end if;
    v_sale := new.selected_sale_price;
    if v_sale is not null then
      new.estimated_profit := round(v_sale - new.estimated_cost, 2);
      v_margin := case when v_sale = 0 then null else (v_sale - new.estimated_cost) / v_sale * 100 end;
      new.estimated_profit_margin := round(v_margin, 4);
      new.pricing_status := case when v_sale < new.estimated_cost then 'loss'
        when coalesce(v_margin, 0) < new.minimum_profit_margin then 'below_minimum'
        when coalesce(v_margin, 0) < new.target_profit_margin then 'acceptable' else 'target' end;
      new.pricing_cost_changed := true;
    end if;
  end if;
  return new;
end;
$$;
create trigger jobs_refresh_pricing before update of estimated_cost on public.jobs
for each row execute function public.refresh_job_pricing_on_cost();

-- Existing calculated jobs get a margin snapshot and recommendation once.
update public.jobs j set
  target_profit_margin = greatest(b.default_profit_margin, 1),
  minimum_profit_margin = least(b.minimum_profit_margin, 89),
  recommended_sale_price_exact = case when j.estimated_cost > 0 then round(j.estimated_cost / (1 - greatest(b.default_profit_margin, 1) / 100), 6) end,
  recommended_sale_price = case when j.estimated_cost > 0 then ceil(j.estimated_cost / (1 - greatest(b.default_profit_margin, 1) / 100) / 100) * 100 end,
  minimum_sale_price_exact = case when j.estimated_cost > 0 then round(j.estimated_cost / (1 - least(b.minimum_profit_margin, 89) / 100), 6) end,
  minimum_sale_price = case when j.estimated_cost > 0 then ceil(j.estimated_cost / (1 - least(b.minimum_profit_margin, 89) / 100) / 100) * 100 end
from public.businesses b where b.id = j.business_id;

create function public.save_job_pricing(
  p_job_id uuid, p_target_margin numeric, p_minimum_margin numeric,
  p_selected_sale_price numeric, p_acknowledge_risk boolean default false
) returns void language plpgsql security definer set search_path = '' as $$
declare
  v_job public.jobs%rowtype;
  v_exact numeric;
  v_min_exact numeric;
  v_recommended numeric;
  v_margin numeric;
  v_status text;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select j.* into v_job from public.jobs j join public.businesses b on b.id = j.business_id
  where j.id = p_job_id and b.owner_id = auth.uid() and j.status in ('draft','calculated') for update of j;
  if not found then raise exception 'Job not found or not editable'; end if;
  if v_job.estimated_cost <= 0 then raise exception 'Cost not calculated'; end if;
  if p_target_margin is null or p_target_margin <= 0 or p_target_margin > 90 or scale(p_target_margin) > 2 or
     p_minimum_margin is null or p_minimum_margin < 0 or p_minimum_margin > 89 or
     p_minimum_margin > p_target_margin or scale(p_minimum_margin) > 2 or
     p_selected_sale_price is null or p_selected_sale_price < 0 or
     p_selected_sale_price > 99999999999999.99 or scale(p_selected_sale_price) > 2 then
    raise exception 'Invalid pricing input';
  end if;
  v_exact := round(v_job.estimated_cost / (1 - p_target_margin / 100), 6);
  v_min_exact := round(v_job.estimated_cost / (1 - p_minimum_margin / 100), 6);
  v_recommended := ceil(v_job.estimated_cost / (1 - p_target_margin / 100) / 100) * 100;
  v_margin := case when p_selected_sale_price = 0 then null
    else (p_selected_sale_price - v_job.estimated_cost) / p_selected_sale_price * 100 end;
  v_status := case when p_selected_sale_price < v_job.estimated_cost then 'loss'
    when coalesce(v_margin, 0) < p_minimum_margin then 'below_minimum'
    when coalesce(v_margin, 0) < p_target_margin then 'acceptable' else 'target' end;
  if v_status in ('loss','below_minimum') and not p_acknowledge_risk then
    raise exception 'Pricing risk confirmation required';
  end if;
  update public.jobs set
    target_profit_margin = p_target_margin, minimum_profit_margin = p_minimum_margin,
    recommended_sale_price_exact = v_exact, recommended_sale_price = v_recommended,
    minimum_sale_price_exact = v_min_exact,
    minimum_sale_price = ceil(v_job.estimated_cost / (1 - p_minimum_margin / 100) / 100) * 100,
    selected_sale_price = p_selected_sale_price,
    selected_price_mode = case when p_selected_sale_price = v_recommended then 'recommended' else 'custom' end,
    estimated_profit = round(p_selected_sale_price - v_job.estimated_cost, 2),
    estimated_profit_margin = round(v_margin, 4), pricing_status = v_status,
    priced_at = now(), pricing_cost_changed = false
  where id = p_job_id;
end;
$$;
revoke all on function public.save_job_pricing(uuid,numeric,numeric,numeric,boolean) from public, anon;
grant execute on function public.save_job_pricing(uuid,numeric,numeric,numeric,boolean) to authenticated;
