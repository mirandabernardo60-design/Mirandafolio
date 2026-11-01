-- Miranda — richer website pages: pricing, features, social links, extra page screenshots
alter table public.sites add column if not exists pricing text not null default ''
  check (pricing in ('', 'Free', 'Freemium', 'Paid', 'One-time', 'Subscription', 'Open source'));
alter table public.sites add column if not exists features text[] not null default '{}';
alter table public.sites add column if not exists social jsonb not null default '{}'::jsonb;
alter table public.sites add column if not exists gallery_pages text[] not null default '{}';
create index if not exists sites_pricing_idx on public.sites (pricing);
