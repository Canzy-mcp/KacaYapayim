-- Clients access marketplace records through the scoped RPCs.
alter table private.market_categories enable row level security;
alter table private.market_providers enable row level security;
alter table private.market_requests enable row level security;
alter table private.market_offers enable row level security;
alter table private.market_messages enable row level security;
alter table private.market_reviews enable row level security;
alter table private.market_favorites enable row level security;
alter table private.market_notices enable row level security;
alter table private.market_reports enable row level security;

create unique index market_offers_one_accepted_per_request
  on private.market_offers(request_id) where state = 'accepted';
