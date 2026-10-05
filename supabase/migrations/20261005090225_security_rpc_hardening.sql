-- Trigger invocation is unaffected by revoking direct RPC execution.
revoke execute on function public.enforce_customer_limit() from public,anon,authenticated;
revoke execute on function public.enforce_quote_limit() from public,anon,authenticated;
revoke execute on function public.handle_new_user() from public,anon,authenticated;
revoke execute on function public.refresh_job_pricing_on_cost() from public,anon,authenticated;
revoke execute on function public.rls_auto_enable() from public,anon,authenticated;
revoke execute on function public.sync_profession_template_components() from public,anon,authenticated;
-- Existing implementation already permits only service_role; align API ACL with it.
revoke execute on function public.apply_verified_billing_event(text,text,text,text,timestamptz,uuid,text,text,text,text,text,timestamptz,timestamptz,boolean) from public,anon,authenticated;
-- Internal plan lookup is used by triggers and service-only public quote projection.
revoke execute on function public.effective_plan_id(uuid) from public,anon,authenticated;
grant execute on function public.effective_plan_id(uuid) to service_role;
