# Pôr a Miranda online (GitHub + Vercel + Supabase)

O GitHub guarda o código. O GitHub Pages só serve sites estáticos e não consegue correr o login de admin nem a base de dados, por isso o site fica online no **Vercel** (gratuito), ligado ao teu repositório do GitHub. Cada vez que mudares o código no GitHub, o Vercel atualiza o site sozinho.

## 1. Supabase (base de dados) — ~10 min
1. Cria conta em https://supabase.com → **New project**.
2. **SQL Editor** → cola o conteúdo de `supabase/migrations/0001_init.sql` → **Run**.
3. (Opcional) cola `supabase/seed.sql` → **Run** (cria categorias iniciais).
4. **Authentication → Providers → Email**: muda o mínimo da password para 3 e desliga "Allow new users to sign up".
5. **Authentication → Users → Add user**: email `123@gmail.com`, password `123`, marca "Auto confirm".
6. **SQL Editor**:
   ```sql
   insert into public.admins (user_id) select id from auth.users where email = '123@gmail.com';
   ```
7. **Settings → API**: copia o *Project URL*, a *anon public key* e a *service_role key*.

## 2. GitHub — ~5 min
1. Em https://github.com/new cria um repositório (ex.: `miranda`). Pode ser privado.
2. Na página do repositório: **Add file → Upload files** → arrasta **o conteúdo** da pasta `miranda` (não a pasta em si, e não o zip) → **Commit changes**.
   - Nunca envies um ficheiro `.env` ou `.env.local` com as tuas chaves.

## 3. Vercel (site online) — ~5 min
1. Em https://vercel.com entra com a conta do GitHub → **Add New → Project** → escolhe o repositório `miranda` → **Import**.
2. Em **Environment Variables** adiciona:
   | Nome | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL do Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key |
   | `NEXT_PUBLIC_SITE_URL` | o endereço que o Vercel te der (ex.: https://miranda.vercel.app) |
3. **Deploy**. Em 1–2 minutos o site está online.
4. No Supabase → **Authentication → URL Configuration** → *Site URL* = o teu endereço do Vercel.

## 4. Usar
- Site público: `https://o-teu-endereco.vercel.app`
- Adicionar sites: botão **Add site** (ou `/admin`) → login `123@gmail.com` / `123` → cola o link.

## Se o deploy falhar
Este código ainda não foi compilado (o ambiente onde foi escrito não tinha acesso ao npm). Se o Vercel mostrar um erro no build, copia o texto do erro e cola-o ao Claude para ser corrigido.

⚠️ A password `123` é muito fácil de adivinhar. Quando o site estiver público, muda-a no Supabase (Authentication → Users).
