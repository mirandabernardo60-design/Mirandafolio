# Miranda

A personal website-inspiration library with a private CMS.
Next.js 15 (App Router) · TypeScript · Tailwind 4 + custom CSS · GSAP/ScrollTrigger · Supabase (Postgres, Auth, Storage) · Zod · Playwright.

> **Status:** this code was written in an environment with **no access to npm**, so it has **not yet been installed, built or run**.
> Run steps 1–6 below. If `npm run build` or `npm run typecheck` reports errors, paste them to Claude and they'll be fixed.

---

## 1. Install

```bash
npm install
npx playwright install chromium   # for tests
```

Requires Node 20+.

## 2. Create the Supabase project

1. Go to <https://supabase.com> → **New project**.
2. **Settings → API**: copy the *Project URL*, the *anon public* key and the *service_role* key.
3. Copy the env template and fill it in:

```bash
cp .env.example .env.local
```

| Variable | Where it's used |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | everywhere |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public reads + admin session (RLS enforces permissions) |
| `SUPABASE_SERVICE_ROLE_KEY` | server only; optional (reserved for server tasks; never sent to the browser) |
| `NEXT_PUBLIC_SITE_URL` | metadata/OG |
| `SCREENSHOT_SERVICE_URL` | optional; overrides the default screenshot service (see §6) |

## 3. Run the database migration

Either with the Supabase CLI:

```bash
npx supabase link --project-ref YOUR-REF
npx supabase db push            # applies supabase/migrations/0001_init.sql
```

or paste `supabase/migrations/0001_init.sql` into **SQL Editor → Run**. Then optionally run `supabase/seed.sql` (starter categories).

The migration creates:
- `sites`, `categories`, `tags`, `site_tags`, `admins` tables with constraints, indexes and full-text search
- Row Level Security: the public can read **published** sites only; only admins can write
- `search_sites(q)` function (name, descriptions, category, tags) and `category_counts` view
- a public `thumbnails` storage bucket (5 MB limit, image types only) with admin-only write policies

## 4. Create your admin account

Your chosen admin login is **email `123@gmail.com`, password `123`**.
Supabase requires passwords of at least 6 characters by default, so first go to **Authentication → Providers → Email** (or *Auth → Settings → Password*) and set the **minimum password length** to 3. A longer password is strongly recommended once the site is public.

1. **Authentication → Users → Add user**: enter your email and a password (tick *Auto confirm*).
2. **Authentication → Providers → Email**: you can disable *public sign-ups*, since Miranda has no sign-up page.
3. In the SQL editor:

```sql
insert into public.admins (user_id)
select id from auth.users where email = '123@gmail.com';
```

Only users in `public.admins` can open `/admin` or call any admin action; this is checked on the server (`requireAdmin()`) and again by RLS in Postgres.

## 5. Run

```bash
npm run dev          # http://localhost:3000, admin at /admin
npm run typecheck
npm run build && npm start
```

## 6. Automatic website previews

As soon as you paste a link in **Add website**, Miranda takes a live screenshot of the site (1440×900) and fills in the title, description and favicon. When you save, the screenshot is downloaded and stored in your Supabase `thumbnails` bucket, so the public site never depends on the screenshot service. Use **Retake screenshot** if the site changes.

Screenshots use the free Microlink API by default (about 50 per day without a key). For more, create a key at microlink.io or use another service and set `SCREENSHOT_SERVICE_URL` (a template where `{url}` is replaced), for example:

```
SCREENSHOT_SERVICE_URL=https://pro.microlink.io/?url={url}&screenshot=true&meta=false&apiKey=YOUR_KEY
```

If a site blocks screenshots, its Open Graph image is used instead.

## 7. Tests

```bash
npm run test:e2e                                   # public + auth + responsive (7 widths)
E2E_ADMIN_EMAIL=you@example.com E2E_ADMIN_PASSWORD=… npm run test:e2e   # + full CMS lifecycle
```

The CMS test covers: login → paste link (automatic screenshot + metadata) → invalid submit → tags → draft (hidden publicly) → publish → appears publicly → search → detail page → edit → unpublish (404) → delete.

## 8. Deploy to Vercel

1. Push this folder to a GitHub repo.
2. Vercel → **New Project** → import it (framework auto-detected).
3. Add the same environment variables (set `NEXT_PUBLIC_SITE_URL` to your production URL).
4. Deploy. In Supabase → **Authentication → URL Configuration**, set the Site URL to your production URL.

Content changes made in `/admin` revalidate the public pages immediately (`revalidatePath`), so no redeploy is ever needed.

---

## Project structure

```
app/(site)/            public site: explore, /all, /featured, /category/[slug], /tag/[slug], /references/[slug]
app/admin/login        sign-in
app/admin/(dash)/      overview, references (table, bulk actions, reorder), add/edit, categories, tags, media
app/admin/actions.ts   all server actions (Zod-validated, admin-gated)
app/api/search         ⌘K search endpoint
components/public      sidebar, top bar, filter bar, cards, carousel, reveal (GSAP), footer, logo
components/admin       reference form, table, name list, media grid, toasts
lib/                   supabase clients, queries, schemas, safe metadata fetcher, auth guard
supabase/migrations    schema, RLS, storage
tests/                 Playwright
```

## Notes on the design

The public UI follows the layout, structure and motion of the screen recording of the reference site:
a fixed left sidebar (search ⌘K, explore, collapsible groups, categories with counts, add button at the bottom), a sticky 48px blurred top bar, a filter-chip row with count + sort, a blue banner with line art, a "Featured" 4-up carousel with arrows, a 4-column "Recently added" list with icons, a 4-column 3:2 thumbnail grid, a detail page with breadcrumb, blue "Visit Website" button, about/meta split and a right "similar" rail, and a footer with the blue horizon glow.
The motion is staggered fade-up reveals batched on scroll (also applied to newly added items), a slow thumbnail zoom on hover, smooth collapsible groups and pop-in menus.

The reference site itself could not be loaded from the build environment, so measurements come from the video, not from its CSS.
Toolfolio's logo, images and copy are **not** reused: the logo is an original Miranda mark, and all content comes from your database.
Fine-tune spacing by comparing side by side at the same viewport.
