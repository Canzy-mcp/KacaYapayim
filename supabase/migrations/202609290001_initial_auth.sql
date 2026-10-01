create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  email text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_first_name_length check (char_length(first_name) <= 100),
  constraint profiles_last_name_length check (char_length(last_name) <= 100)
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles(id) on delete cascade,
  name text not null,
  profession text,
  phone text,
  city text,
  logo_url text,
  default_profit_margin numeric(5,2) not null default 30,
  minimum_profit_margin numeric(5,2) not null default 20,
  currency text not null default 'TRY',
  onboarding_step smallint not null default 1,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint businesses_name_valid check (char_length(btrim(name)) between 1 and 120),
  constraint businesses_profession_length check (profession is null or char_length(profession) <= 100),
  constraint businesses_phone_length check (phone is null or char_length(phone) <= 30),
  constraint businesses_city_length check (city is null or char_length(city) <= 100),
  constraint businesses_margin_range check (
    default_profit_margin between 0 and 90 and
    minimum_profit_margin between 0 and 90 and
    minimum_profit_margin <= default_profit_margin
  ),
  constraint businesses_currency_length check (char_length(currency) = 3),
  constraint businesses_onboarding_step_range check (onboarding_step between 1 and 4)
);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger businesses_updated_at before update on public.businesses
for each row execute function public.set_updated_at();

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name, last_name, email)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'first_name', ''), 100),
    left(coalesce(new.raw_user_meta_data ->> 'last_name', ''), 100),
    coalesce(new.email, '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;

revoke all on public.profiles from anon;
revoke all on public.businesses from anon;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.businesses to authenticated;

create policy "profiles_select_own" on public.profiles for select to authenticated
using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated
with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated
using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "profiles_delete_own" on public.profiles for delete to authenticated
using ((select auth.uid()) = id);

create policy "businesses_select_own" on public.businesses for select to authenticated
using ((select auth.uid()) = owner_id);
create policy "businesses_insert_own" on public.businesses for insert to authenticated
with check ((select auth.uid()) = owner_id);
create policy "businesses_update_own" on public.businesses for update to authenticated
using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "businesses_delete_own" on public.businesses for delete to authenticated
using ((select auth.uid()) = owner_id);

-- Both profile and business settings update in a single database transaction.
create function public.update_my_settings(
  p_first_name text,
  p_last_name text,
  p_business_name text,
  p_phone text,
  p_city text,
  p_profession text,
  p_default_profit_margin numeric,
  p_minimum_profit_margin numeric
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  update public.profiles
  set first_name = btrim(p_first_name), last_name = btrim(p_last_name)
  where id = auth.uid();
  if not found then raise exception 'Profile not found'; end if;
  update public.businesses
  set name = btrim(p_business_name),
      phone = nullif(btrim(p_phone), ''),
      city = nullif(btrim(p_city), ''),
      profession = nullif(btrim(p_profession), ''),
      default_profit_margin = p_default_profit_margin,
      minimum_profit_margin = p_minimum_profit_margin
  where owner_id = auth.uid();
  if not found then raise exception 'Business not found'; end if;
end;
$$;

revoke all on function public.update_my_settings(text,text,text,text,text,text,numeric,numeric) from public;
grant execute on function public.update_my_settings(text,text,text,text,text,text,numeric,numeric) to authenticated;
