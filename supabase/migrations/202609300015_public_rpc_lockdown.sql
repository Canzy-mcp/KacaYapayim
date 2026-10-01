-- Public quote RPCs must be reachable only through the rate-limited Next API/page.
revoke all on function public.get_public_quote(uuid) from public, anon, authenticated;
revoke all on function public.mark_quote_viewed(uuid,uuid) from public, anon, authenticated;
revoke all on function public.respond_to_quote(uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.get_public_quote(uuid) to service_role;
grant execute on function public.mark_quote_viewed(uuid,uuid) to service_role;
grant execute on function public.respond_to_quote(uuid,text,text,text) to service_role;
