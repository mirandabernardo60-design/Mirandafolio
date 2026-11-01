import { Suspense } from "react";
import { Footer } from "@/components/public/Footer";
import { Reveal } from "@/components/public/Reveal";
import { SearchPalette } from "@/components/public/SearchPalette";
import { Sidebar } from "@/components/public/Sidebar";
import { getCategories, getLibraries, getTags, listSites } from "@/lib/queries";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { BookmarksProvider } from "@/components/public/Bookmarks";
import { getUserId } from "@/lib/viewer";

export const revalidate = 60;

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [categories, tags, featured, recent, libraries] = await Promise.all([
    getCategories().catch(() => []), getTags().catch(() => []),
    listSites({ featured: true, sort: "custom", limit: 8 }),
    listSites({ sort: "latest", limit: 8 }),
    getLibraries(),
  ]);
  const uid = await getUserId().catch(() => null);
  let saved: string[] = [];
  if (uid) {
    const db = await createClient();
    const { data } = await db.from("bookmarks").select("site_id").eq("user_id", uid);
    saved = (data ?? []).map((b) => b.site_id);
  }
  const mini = (s: (typeof recent)[number]) => ({ slug: s.slug, name: s.name, short_description: s.short_description, favicon_url: s.favicon_url, category: s.category?.name ?? "" });
  return (
    <BookmarksProvider initial={saved}>
    <div className="shell">
      <Sidebar categories={categories} tags={tags} libraries={libraries} />
      <div style={{ minWidth: 0 }}>
        {!hasSupabaseEnv() && (
          <div style={{ background: "#3a1d00", color: "#ffcf99", fontSize: 12, padding: "8px 16px" }}>
            Supabase is not configured. Copy <code>.env.example</code> to <code>.env.local</code> and fill in your project keys (see README).
          </div>
        )}
        <Suspense>
          <Reveal>{children}</Reveal>
        </Suspense>
        <Footer categories={categories} tags={tags} />
      </div>
      <SearchPalette categories={categories} tags={tags} featured={featured.map(mini)} recent={recent.map(mini)} />
    </div>
    </BookmarksProvider>
  );
}
