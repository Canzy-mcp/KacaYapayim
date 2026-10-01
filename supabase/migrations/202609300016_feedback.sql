create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  type text not null check (type in ('bug','idea','general')),
  message text not null check (char_length(message) between 10 and 2000),
  page text not null check (char_length(page) <= 100),
  created_at timestamptz not null default now()
);
create index feedback_created_idx on public.feedback(created_at desc);
alter table public.feedback enable row level security;
revoke all on public.feedback from anon, authenticated;
grant insert on public.feedback to authenticated;
create policy feedback_insert_own on public.feedback for insert to authenticated
  with check (user_id = auth.uid() and exists (
    select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()
  ));
