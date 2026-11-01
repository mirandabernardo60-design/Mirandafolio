import { Suspense } from "react";
import { CarouselSection } from "./Carousel";
import { Banner } from "./Banner";
import { HeroCarousel } from "./HeroCarousel";
import { ArticleCard } from "./ArticleCard";
import { listArticles } from "@/lib/articles";
import { CollectionCard } from "./CollectionCard";
import { listCollections } from "@/lib/queries";
import { MiniSite, SiteCard } from "./Cards";
import { FilterBar } from "./FilterBar";
import { Icon } from "./Icon";
import { Topbar } from "./Topbar";
import { getCategories, getStyles, getTags, listSites, type Sort } from "@/lib/queries";

export type SP = { q?: string; tag?: string; style?: string; pricing?: string; sort?: string };

/** Shared browsing page used by Explore, category, tag, featured and all pages. */
export async function Listing({
  title, sp, category, tag, library, featuredOnly, showHome, latestOnly,
}: {
  title: string; sp: SP; category?: string; tag?: string; library?: string; featuredOnly?: boolean; showHome?: boolean; latestOnly?: boolean;
}) {
  const sort = (["latest", "oldest", "name", "custom"].includes(sp.sort ?? "") ? sp.sort : "latest") as Sort;
  const filters = { q: sp.q, tag: tag ?? sp.tag, style: sp.style, pricing: sp.pricing, category, library, sort, featured: featuredOnly };
  const filtering = Boolean(sp.q || sp.tag || sp.style || sp.pricing || latestOnly);
  const collections = showHome && !category && !filtering ? await listCollections({ sort: "size", limit: 9 }) : [];
  const articles = filtering || featuredOnly || tag || library ? [] : await listArticles({ category, limit: 9 });

  const [categories, tags, styles, all, featured, recent] = await Promise.all([
    getCategories().catch(() => []), getTags().catch(() => []), getStyles(),
    listSites(filters),
    filtering || featuredOnly ? Promise.resolve([]) : listSites({ category, tag, library, featured: true, sort: "custom", limit: 12 }),
    filtering || featuredOnly ? Promise.resolve([]) : listSites({ category, tag, library, sort: "latest", limit: 12 }),
  ]);

  return (
    <>
      <Topbar title={title} tabs={showHome && !category || latestOnly ? [{ href: "/", label: "Explore", active: !latestOnly }, { href: "/latest", label: "Latest Additions", active: !!latestOnly }] : undefined} />
      <Suspense>
        <FilterBar categories={categories} tags={tags} styles={styles} count={all.length} lockCategory={!!category} />
      </Suspense>
      <div className="page">
        {showHome && !filtering && (featured.length || recent.length
          ? <HeroCarousel sites={(featured.length ? featured : recent).slice(0, 5)} />
          : <Banner />)}

        {featured.length > 0 && (
          <CarouselSection title="Featured Websites" icon={<Icon name="bolt" width={16} style={{ color: "#5b8cff", fill: "#5b8cff" }} />}>
            {featured.map((s, i) => <SiteCard key={s.id} site={s} eager={i < 4} />)}
          </CarouselSection>
        )}

        {collections.length > 0 && (
          <CarouselSection title="Popular Collections" icon={<Icon name="folders" width={16} />} moreHref="/collections">
            {collections.map((c) => <CollectionCard key={c.id} c={c} />)}
          </CarouselSection>
        )}

        {articles.length > 0 && (
          <CarouselSection
            title={`${category ? categories.find((c) => c.slug === category)?.name ?? "" : "Design"} Articles`.trim()}
            icon={<Icon name="file" width={16} />}
            moreHref="/articles">
            {articles.map((a) => <ArticleCard key={a.id} a={a} />)}
          </CarouselSection>
        )}

        {recent.length > 0 && (
          <section className="section">
            <div className="section-head"><h2>New Additions</h2></div>
            <div className="grid-mini">{recent.map((s) => <MiniSite key={s.id} site={s} />)}</div>
          </section>
        )}

        <section className="section">
          <div className="section-head">
            <h2>{latestOnly ? "Latest Additions" : filtering ? `Results${sp.q ? ` for “${sp.q}”` : ""}` : featuredOnly ? "Featured" : "All Websites"}</h2>
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
