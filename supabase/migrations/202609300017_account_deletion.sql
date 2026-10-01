-- Allow an auth user and all owned business records to be removed in one
-- database transaction. Quote/job references must not block the cascade.
alter table public.jobs drop constraint jobs_accepted_quote_id_fkey;
alter table public.jobs add constraint jobs_accepted_quote_id_fkey
  foreign key (accepted_quote_id) references public.quotes(id) on delete set null;

alter table public.quotes drop constraint quotes_job_id_fkey;
alter table public.quotes add constraint quotes_job_id_fkey
  foreign key (job_id) references public.jobs(id) on delete cascade;

alter table public.quotes drop constraint quotes_parent_quote_id_fkey;
alter table public.quotes add constraint quotes_parent_quote_id_fkey
  foreign key (parent_quote_id) references public.quotes(id) on delete set null;
