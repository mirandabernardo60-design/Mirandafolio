import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!/^https:\/\//.test(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "") || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // Prefer local JWT verification (no network round trip); fall back to getUser.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const auth = supabase.auth as any;
  let user: { id: string } | null = null;
  if (typeof auth.getClaims === "function") {
    const { data, error } = await auth.getClaims();
    user = !error && data?.claims?.sub ? { id: data.claims.sub } : null;
  } else {
    user = (await supabase.auth.getUser()).data.user;
  }
  const path = request.nextUrl.pathname;
  const redirectTo = (pathname: string, next: string) => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = `?next=${encodeURIComponent(next)}`;
    return NextResponse.redirect(url);
  };

  // Admin area: admin login page; is_admin is enforced again in every admin page/action.
  if (path.startsWith("/admin")) {
    if (!user && !path.startsWith("/admin/login")) return redirectTo("/admin/login", path);
    return response;
  }

  // Everyone must have an account to see the site.
  const isAuthPage = path === "/login" || path === "/signup" || path.startsWith("/auth/");
  if (!user && !isAuthPage) return redirectTo("/login", path + request.nextUrl.search);
  if (user && (path === "/login" || path === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return response;
}

// Run on every page except static files and images.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico)$).*)"],
};
