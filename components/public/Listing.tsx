import { Suspense } from "react";
import { CarouselSection } from "./Carousel";
import { Banner } from "./Banner";
import { MiniSite, SiteCard } from "./Cards";
import { FilterBar } from "./FilterBar";
import { Icon } from "./Icon";
import { Topbar } from "./Topbar";
import { getCategories, getStyles, getTags, listSites, type Sort } from "@/lib/queries";

export type SP = { q?: string; tag?: string; style?: string; sort?: string };

/** Shared browsing page used by Explore, category, tag, featured and all pages. */
export async function Listing({
  title, sp, category, tag, featuredOnly, showHome,
}: {
  title: string; sp: SP; category?: string; tag?: string; featuredOnly?: boolean; showHome?: boolean;
}) {
  const sort = (["latest", "oldest", "name", "custom"].includes(sp.sort ?? "") ? sp.sort : "latest") as Sort;
  const filters = { q: sp.q, tag: tag ?? sp.tag, style: sp.style, category, sort, featured: featuredOnly };
  const filtering = Boolean(sp.q || sp.tag || sp.style);

  const [categories, tags, styles, all, featured, recent] = await Promise.all([
    getCategories(), getTags(), getStyles(),
    listSites(filters),
    filtering || featuredOnly ? Promise.resolve([]) : listSites({ category, tag, featured: true, sort: "custom", limit: 12 }),
    filtering || featuredOnly ? Promise.resolve([]) : listSites({ category, tag, sort: "latest", limit: 12 }),
  ]);

  return (
    <>
      <Topbar title={title} />
      <Suspense>
        <FilterBar categories={categories} tags={tags} styles={styles} count={all.length} lockCategory={!!category} />
      </Suspense>
      <div className="page">
        {showHome && !filtering && <Banner />}

        {featured.length > 0 && (
          <CarouselSection title="Featured Websites" icon={<Icon name="bolt" width={16} style={{ color: "#5b8cff", fill: "#5b8cff" }} />}>
            {featured.map((s, i) => <SiteCard key={s.id} site={s} eager={i < 4} />)}
          </CarouselSection>
        )}

        {recent.length > 0 && (
          <section className="section">
            <div className="section-head"><h2>Recently Added</h2></div>
            <div className="grid-mini">{recent.map((s) => <MiniSite key={s.id} site={s} />)}</div>
          </section>
        )}

        <section className="section">
          <div className="section-head">
            <h2>{filtering ? `Results${sp.q ? ` for “${sp.q}”` : ""}` : featuredOnly ? "Featured" : "All Websites"}</h2>
          </div>
          {all.length ? (
            <div className="grid-cards">{all.map((s) => <SiteCard key={s.id} site={s} />)}</div>
          ) : (
            <p className="empty">No websites found{filtering ? " for these filters" : " yet"}.</p>
          )}
        </section>
      </div>
    </>
  );
}
