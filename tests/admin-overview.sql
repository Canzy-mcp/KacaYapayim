begin;
do $$
declare
  admin_id uuid := gen_random_uuid();
  member_id uuid := gen_random_uuid();
  counts jsonb;
begin
  if has_function_privilege('anon','public.market_operator_overview(integer)','execute')
    or has_function_privilege('anon','private.market_operator_overview(integer)','execute')
  then raise exception 'Anonymous role can access operator metrics'; end if;
  insert into auth.users(id, email, last_sign_in_at)
    values (admin_id,'admin-overview@example.test',now()), (member_id,'member-overview@example.test',now());
  insert into public.platform_admins(user_id) values (admin_id);
  perform set_config('role','authenticated',true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',member_id,'aal','aal2')::text,true);
  begin
    perform public.market_operator_overview(7);
    raise exception 'Regular account can access operator metrics';
  exception when insufficient_privilege then null; end;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',admin_id,'aal','aal1')::text,true);
  begin
    perform public.market_operator_overview(7);
    raise exception 'First-factor admin session can access operator metrics';
  exception when insufficient_privilege then null; end;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',admin_id,'aal','aal2')::text,true);
  counts := public.market_operator_overview(7);
  if counts->>'days' is distinct from '7' or (counts->>'signed_in_accounts')::int < 2
    or jsonb_typeof(counts->'channels') is distinct from 'array'
  then raise exception 'Verified administrator received invalid metrics'; end if;
end;
$$;
rollback;
