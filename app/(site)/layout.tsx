import { Suspense } from "react";
import { Footer } from "@/components/public/Footer";
import { Reveal } from "@/components/public/Reveal";
import { SearchPalette } from "@/components/public/SearchPalette";
import { Sidebar } from "@/components/public/Sidebar";
import { getCategories, getTags } from "@/lib/queries";
import { hasSupabaseEnv } from "@/lib/supabase/server";

export const revalidate = 60;

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [categories, tags] = await Promise.all([getCategories(), getTags()]);
  return (
    <div className="shell">
      <Sidebar categories={categories} tags={tags} />
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
      <SearchPalette />
    </div>
  );
}
