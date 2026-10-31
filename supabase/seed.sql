-- Starter categories (edit/delete them freely from /admin/categories).
insert into public.categories (name, slug, icon, position) values
  ('Design', 'design', 'palette', 1),
  ('Portfolio', 'portfolio', 'user', 2),
  ('Agency', 'agency', 'briefcase', 3),
  ('E-Commerce', 'e-commerce', 'cart', 4),
  ('SaaS', 'saas', 'layers', 5),
  ('Editorial', 'editorial', 'file', 6)
on conflict (slug) do nothing;

-- Make a user an admin (run after creating the user in Supabase Auth):
-- insert into public.admins (user_id) select id from auth.users where email = 'you@example.com';
