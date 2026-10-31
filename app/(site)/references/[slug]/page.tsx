import Link from "next/link";
import { notFound } from "next/navigation";
import { MiniSite, SiteCard, Thumb } from "@/components/public/Cards";
import { CarouselSection } from "@/components/public/Carousel";
import { Icon, Verified } from "@/components/public/Icon";
import { Topbar } from "@/components/public/Topbar";
import { CopyLink } from "@/components/public/CopyLink";
import { getRelated, getSiteBySlug } from "@/lib/queries";
import { formatDate, hostname, thumbnailSrc } from "@/lib/utils";

type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P) {
  const site = await getSiteBySlug((await params).slug);
  if (!site) return { title: "Not found" };
  const img = thumbnailSrc(site);
  return {
    title: site.name,
    description: site.short_description || site.description.slice(0, 160),
    openGraph: { images: img ? [img] : [] },
  };
}

/* eslint-disable @next/next/no-img-element */
export default async function ReferencePage({ params }: P) {
  const site = await getSiteBySlug((await params).slug);
  if (!site) notFound();
  const related = await getRelated(site);

  return (
    <>
      <Topbar
        crumbs={[
          { href: "/", label: "Home" },
          ...(site.category ? [{ href: `/category/${site.category.slug}`, label: site.category.name }] : []),
          { label: site.name },
        ]}
      />
      <div className="detail">
        <div className="detail-main">
          <div className="detail-hero" data-reveal>
            <span className="mini-icon" style={{ width: 26, height: 26, borderRadius: 7 }}>
              {site.favicon_url ? <img src={site.favicon_url} alt="" /> : site.name[0]}
            </span>
            <h1>{site.name} {site.featured && <Verified style={{ width: 16, height: 16 }} />}</h1>
            <a className="btn-blue" href={site.url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: "auto" }}>
              Visit Website <Icon name="external" width={13} />
            </a>
          </div>

          <div className="detail-shot" data-reveal>
            <a href={site.url} target="_blank" rel="noopener noreferrer" className="card" aria-label={`Open ${site.name}`}>
              <Thumb site={site} eager />
            </a>
          </div>

          <div className="detail-body">
            <div data-reveal>
              <p className="eyebrow">About</p>
              <h2>{site.short_description || site.name}</h2>
              {site.description && <p className="prose">{site.description}</p>}

              {site.tags.length > 0 && (
                <>
                  <p className="eyebrow" style={{ marginTop: 32 }}>Tags</p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {site.tags.map((t) => <Link key={t.id} href={`/tag/${t.slug}`} className="pill">{t.name}</Link>)}
                  </div>
                </>
              )}
              {site.category && (
                <>
                  <p className="eyebrow" style={{ marginTop: 28 }}>Categories</p>
                  <Link href={`/category/${site.category.slug}`} className="pill">{site.category.name}</Link>
                </>
              )}
            </div>
            <div data-reveal style={{ display: "grid", gap: 22, alignContent: "start" }}>
              {site.design_style && (
                <div><p className="eyebrow">Design style</p><p style={{ fontWeight: 500 }}>
                  <Link href={`/all?style=${encodeURIComponent(site.design_style)}`}>{site.design_style}</Link></p></div>
              )}
              <div><p className="eyebrow">Website</p>
                <a href={site.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", gap: 6, alignItems: "center", fontWeight: 500 }}>
                  <Icon name="globe" width={13} /> {hostname(site.url)}
                </a></div>
              <div><p className="eyebrow">Added</p><p style={{ fontWeight: 500 }}>{formatDate(site.created_at)}</p></div>
              <div><p className="eyebrow">Last updated</p><p style={{ fontWeight: 500 }}>{formatDate(site.updated_at)}</p></div>
            </div>
          </div>

          {related.length > 0 && (
            <div className="page" style={{ paddingTop: 0 }}>
              <CarouselSection title={`More ${site.category?.name ?? ""} websites`.replace("  ", " ")}>
                {related.map((s) => <SiteCard key={s.id} site={s} />)}
              </CarouselSection>
            </div>
          )}
        </div>

        <aside className="aside">
          <CopyLink />
          <a className="row" href={site.url} target="_blank" rel="noopener noreferrer"><Icon name="external" width={14} /> Open website</a>
          {related.length > 0 && (
            <>
              <p className="eyebrow" style={{ marginTop: 22 }}>Similar websites</p>
              {related.slice(0, 8).map((s) => (
                <Link key={s.id} className="row" href={`/references/${s.slug}`}>
                  {s.favicon_url ? <img src={s.favicon_url} alt="" /> : <span className="ph" />} {s.name}
                  {s.featured && <Verified />}
                </Link>
              ))}
            </>
          )}
        </aside>
      </div>
      {related.length > 4 && (
        <div className="page">
          <section className="section">
            <div className="section-head"><h2>Recently added</h2></div>
            <div className="grid-mini">{related.slice(0, 8).map((s) => <MiniSite key={s.id} site={s} />)}</div>
          </section>
        </div>
      )}
    </>
  );
}
