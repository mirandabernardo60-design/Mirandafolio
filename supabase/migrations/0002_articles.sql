-- Miranda — articles written by the admin
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  excerpt text not null default '' check (char_length(excerpt) <= 300),
  body text not null default '' check (char_length(body) <= 100000),
  category_id uuid references public.categories (id) on delete set null,
  status public.site_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists articles_status_idx on public.articles (status, published_at desc);

-- Websites mentioned in an article (their icons show on the card)
create table if not exists public.article_sites (
  article_id uuid not null references public.articles (id) on delete cascade,
  site_id uuid not null references public.sites (id) on delete cascade,
  position int not null default 0,
  primary key (article_id, site_id)
);

drop trigger if exists articles_touch on public.articles;
create trigger articles_touch before update on public.articles
  for each row execute function public.touch_updated_at();

alter table public.articles enable row level security;
alter table public.article_sites enable row level security;

drop policy if exists "articles public read published" on public.articles;
create policy "articles public read published" on public.articles for select
  using (status = 'published' or public.is_admin());
drop policy if exists "articles admin write" on public.articles;
create policy "articles admin write" on public.articles for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "article_sites public read" on public.article_sites;
create policy "article_sites public read" on public.article_sites for select using (
  exists (select 1 from public.articles a where a.id = article_id and (a.status = 'published' or public.is_admin()))
);
drop policy if exists "article_sites admin write" on public.article_sites;
create policy "article_sites admin write" on public.article_sites for all
  using (public.is_admin()) with check (public.is_admin());
