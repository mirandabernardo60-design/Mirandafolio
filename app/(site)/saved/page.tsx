import Link from "next/link";
import { SiteCard } from "@/components/public/Cards";
import { Topbar } from "@/components/public/Topbar";
import { createClient } from "@/lib/supabase/server";
import type { SiteFull, Tag } from "@/lib/types";
import { getUserId } from "@/lib/viewer";

export const metadata = { title: "Saved" };
export const dynamic = "force-dynamic";

export default async function Saved() {
  const uid = await getUserId();
  let sites: SiteFull[] = [];
  if (uid) {
    const db = await createClient();
    const { data } = await db.from("bookmarks")
      .select("created_at, site:sites(*, category:categories(*), tags:site_tags(tag:tags(*)))")
      .eq("user_id", uid).order("created_at", { ascending: false });
    type Row = { site: (SiteFull & { tags: { tag: Tag }[] }) | null };
    sites = ((data ?? []) as unknown as Row[])
      .map((r) => r.site).filter((s): s is NonNullable<Row["site"]> => !!s && s.status === "published")
      .map((s) => ({ ...s, tags: (s.tags ?? []).map((t) => t.tag).filter(Boolean) }));
  }
  return (
    <>
      <Topbar title="Saved" />
      <div className="page">
        <section className="section">
          <div className="section-head"><h2>Your saved websites</h2></div>
          {sites.length
            ? <div className="grid-cards">{sites.map((s) => <SiteCard key={s.id} site={s} />)}</div>
            : <p className="empty">Nothing saved yet. Tap the bookmark icon on any website to keep it here. <Link href="/" style={{ textDecoration: "underline" }}>Explore websites</Link></p>}
        </section>
      </div>
    </>
  );
}
