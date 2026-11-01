-- Miranda — curated collections and libraries (platforms such as Framer, Webflow, Shopify)

-- ---------- Collections ----------
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null default '' check (char_length(description) <= 400),
  category_id uuid references public.categories (id) on delete set null,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.collection_sites (
  collection_id uuid not null references public.collections (id) on delete cascade,
  site_id uuid not null references public.sites (id) on delete cascade,
  position int not null default 0,
  added_at timestamptz not null default now(),
  primary key (collection_id, site_id)
);
create index if not exists collection_sites_site_idx on public.collection_sites (site_id);
drop trigger if exists collections_touch on public.collections;
create trigger collections_touch before update on public.collections
  for each row execute function public.touch_updated_at();

alter table public.collections enable row level security;
alter table public.collection_sites enable row level security;
drop policy if exists "collections read" on public.collections;
create policy "collections read" on public.collections for select using (published or public.is_admin());
drop policy if exists "collections admin write" on public.collections;
create policy "collections admin write" on public.collections for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "collection_sites read" on public.collection_sites;
create policy "collection_sites read" on public.collection_sites for select using (true);
drop policy if exists "collection_sites admin write" on public.collection_sites;
create policy "collection_sites admin write" on public.collection_sites for all using (public.is_admin()) with check (public.is_admin());

-- ---------- Libraries ----------
create table if not exists public.libraries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  icon_url text,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.site_libraries (
  site_id uuid not null references public.sites (id) on delete cascade,
  library_id uuid not null references public.libraries (id) on delete cascade,
  primary key (site_id, library_id)
);
create index if not exists site_libraries_lib_idx on public.site_libraries (library_id);

alter table public.libraries enable row level security;
alter table public.site_libraries enable row level security;
drop policy if exists "libraries read" on public.libraries;
create policy "libraries read" on public.libraries for select using (true);
drop policy if exists "libraries admin write" on public.libraries;
create policy "libraries admin write" on public.libraries for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "site_libraries read" on public.site_libraries;
create policy "site_libraries read" on public.site_libraries for select using (
  exists (select 1 from public.sites s where s.id = site_id and (s.status = 'published' or public.is_admin()))
);
drop policy if exists "site_libraries admin write" on public.site_libraries;
create policy "site_libraries admin write" on public.site_libraries for all using (public.is_admin()) with check (public.is_admin());

create or replace view public.library_counts with (security_invoker = true) as
  select l.id, l.name, l.slug, l.icon_url, l.position,
         count(s.id) filter (where s.status = 'published')::int as site_count
  from public.libraries l
  left join public.site_libraries sl on sl.library_id = l.id
  left join public.sites s on s.id = sl.site_id
  group by l.id;

-- Starter libraries (edit or delete in /admin/libraries)
insert into public.libraries (name, slug, position) values
  ('Framer', 'framer', 1), ('Webflow', 'webflow', 2), ('Shopify', 'shopify', 3),
  ('Wix', 'wix', 4), ('Squarespace', 'squarespace', 5), ('WordPress', 'wordpress', 6),
  ('Next.js', 'next-js', 7), ('Custom code', 'custom-code', 8)
on conflict (slug) do nothing;
