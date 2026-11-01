-- Miranda — visitor bookmarks and "Report a problem"

create table if not exists public.bookmarks (
  user_id uuid not null references auth.users (id) on delete cascade,
  site_id uuid not null references public.sites (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, site_id)
);
create index if not exists bookmarks_user_idx on public.bookmarks (user_id, created_at desc);
alter table public.bookmarks enable row level security;
drop policy if exists "bookmarks own read" on public.bookmarks;
create policy "bookmarks own read" on public.bookmarks for select using (user_id = auth.uid());
drop policy if exists "bookmarks own insert" on public.bookmarks;
create policy "bookmarks own insert" on public.bookmarks for insert with check (user_id = auth.uid());
drop policy if exists "bookmarks own delete" on public.bookmarks;
create policy "bookmarks own delete" on public.bookmarks for delete using (user_id = auth.uid());

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references public.sites (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  reason text not null check (reason in ('broken-link', 'wrong-info', 'inappropriate', 'other')),
  message text not null default '' check (char_length(message) <= 1000),
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);
create index if not exists reports_status_idx on public.reports (status, created_at desc);
alter table public.reports enable row level security;
drop policy if exists "reports insert signed in" on public.reports;
create policy "reports insert signed in" on public.reports for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "reports admin read" on public.reports;
create policy "reports admin read" on public.reports for select using (public.is_admin());
drop policy if exists "reports admin update" on public.reports;
create policy "reports admin update" on public.reports for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "reports admin delete" on public.reports;
create policy "reports admin delete" on public.reports for delete using (public.is_admin());
