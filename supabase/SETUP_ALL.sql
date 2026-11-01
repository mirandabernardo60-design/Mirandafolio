-- Miranda: complete setup. Paste ALL of this into Supabase → SQL Editor → Run (once).
-- Create the user 123@gmail.com in Authentication → Users first, so the last line makes it admin.

-- Miranda — initial schema
create extension if not exists pg_trgm;

-- ---------- Admins ----------
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

create policy "admins read self" on public.admins
  for select using (user_id = auth.uid());

-- ---------- Categories ----------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  icon text not null default 'grid',
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index categories_position_idx on public.categories (position, name);

-- ---------- Tags ----------
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  created_at timestamptz not null default now()
);

-- ---------- Sites (website references) ----------
create type public.site_status as enum ('draft', 'published');

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  url text not null check (url ~* '^https?://'),
  canonical_url text,
  short_description text not null default '' check (char_length(short_description) <= 160),
  description text not null default '' check (char_length(description) <= 5000),
  thumbnail_path text,          -- path inside the "thumbnails" bucket (uploaded)
  thumbnail_url text,           -- external OG image url (when not uploaded)
  favicon_url text,
  category_id uuid references public.categories (id) on delete set null,
  design_style text not null default '',
  featured boolean not null default false,
  status public.site_status not null default 'draft',
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(short_description, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(design_style, '')), 'C')
  ) stored
);
create index sites_status_idx on public.sites (status, position, created_at desc);
create index sites_category_idx on public.sites (category_id);
create index sites_featured_idx on public.sites (featured) where featured;
create index sites_search_idx on public.sites using gin (search);
create index sites_name_trgm_idx on public.sites using gin (name gin_trgm_ops);

create table public.site_tags (
  site_id uuid not null references public.sites (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (site_id, tag_id)
);
create index site_tags_tag_idx on public.site_tags (tag_id);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger sites_touch before update on public.sites
  for each row execute function public.touch_updated_at();

-- ---------- RLS ----------
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.sites enable row level security;
alter table public.site_tags enable row level security;

create policy "categories public read" on public.categories for select using (true);
create policy "categories admin write" on public.categories for all
  using (public.is_admin()) with check (public.is_admin());

create policy "tags public read" on public.tags for select using (true);
create policy "tags admin write" on public.tags for all
  using (public.is_admin()) with check (public.is_admin());

create policy "sites public read published" on public.sites for select
  using (status = 'published' or public.is_admin());
create policy "sites admin write" on public.sites for all
  using (public.is_admin()) with check (public.is_admin());

create policy "site_tags public read" on public.site_tags for select using (
  exists (select 1 from public.sites s where s.id = site_id and (s.status = 'published' or public.is_admin()))
);
create policy "site_tags admin write" on public.site_tags for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------- Search (respects RLS: security invoker) ----------
create or replace function public.search_sites(q text)
returns setof public.sites
language sql
stable
security invoker
set search_path = public
as $$
  select s.* from public.sites s
  left join public.categories c on c.id = s.category_id
  where
    s.search @@ websearch_to_tsquery('simple', q)
    or s.name ilike '%' || q || '%'
    or s.short_description ilike '%' || q || '%'
    or c.name ilike '%' || q || '%'
    or exists (
      select 1 from public.site_tags st join public.tags t on t.id = st.tag_id
      where st.site_id = s.id and t.name ilike '%' || q || '%'
    )
  order by ts_rank(s.search, websearch_to_tsquery('simple', q)) desc, s.created_at desc
  limit 200;
$$;

-- Published counts per category (for the sidebar)
create or replace view public.category_counts
with (security_invoker = true) as
  select c.id, c.name, c.slug, c.icon, c.position,
         count(s.id) filter (where s.status = 'published')::int as site_count
  from public.categories c
  left join public.sites s on s.category_id = c.id
  group by c.id;

-- ---------- Storage ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('thumbnails', 'thumbnails', true, 5242880,
        array['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif'])
on conflict (id) do nothing;

create policy "thumbnails public read" on storage.objects for select
  using (bucket_id = 'thumbnails');
create policy "thumbnails admin insert" on storage.objects for insert
  with check (bucket_id = 'thumbnails' and public.is_admin());
create policy "thumbnails admin update" on storage.objects for update
  using (bucket_id = 'thumbnails' and public.is_admin());
create policy "thumbnails admin delete" on storage.objects for delete
  using (bucket_id = 'thumbnails' and public.is_admin());

-- Starter categories (edit/delete them freely from /admin/categories).
insert into public.categories (name, slug, icon, position) values
  ('Design', 'design', 'palette', 1),
  ('Portfolio', 'portfolio', 'user', 2),
  ('Agency', 'agency', 'briefcase', 3),
  ('E-Commerce', 'e-commerce', 'cart', 4),
  ('SaaS', 'saas', 'layers', 5),
  ('Editorial', 'editorial', 'file', 6)
on conflict (slug) do nothing;


-- Make 123@gmail.com the admin
insert into public.admins (user_id) select id from auth.users where email = '123@gmail.com' on conflict do nothing;
