-- O1: owners could delete their business row, cascading to market_providers/market_reviews and
-- resetting suspension. Account deletion runs through the service role (auth.admin.deleteUser cascade).
revoke delete on public.businesses from authenticated;
drop policy if exists "businesses_delete_own" on public.businesses;

-- D1: logo_url may only hold the value public.set_my_logo writes. Null out any non-conforming
-- value first (legitimate rows always match, so only tampered values are lost), then validate
-- the constraint. NOT VALID would make every later UPDATE of a bad row fail.
update public.businesses set logo_url=null
 where logo_url is not null and logo_url !~ ('^/api/business/logo/' || id::text || '\?v=[0-9]{1,16}$');
alter table public.businesses add constraint businesses_logo_url_valid
  check (logo_url is null or logo_url ~ ('^/api/business/logo/' || id::text || '\?v=[0-9]{1,16}$'));

-- D2: feedback is written only by the server action (service role) so the rate limit cannot be bypassed.
revoke insert on public.feedback from authenticated;
drop policy if exists feedback_insert_own on public.feedback;
