import Link from "next/link";
import { notFound } from "next/navigation";
import { MiniSite, SiteCard, Thumb } from "@/components/public/Cards";
import { CarouselSection } from "@/components/public/Carousel";
import { Icon, Verified } from "@/components/public/Icon";
import { Topbar } from "@/components/public/Topbar";
import { CopyLink } from "@/components/public/CopyLink";
import { getRelated, getSiteBySlug, getSiteExtras } from "@/lib/queries";
import { AddToCollection } from "@/components/public/AddToCollection";
import { BookmarkButton } from "@/components/public/Bookmarks";
import { ReportProblem } from "@/components/public/ReportProblem";
import { getViewer } from "@/lib/viewer";
import { createClient } from "@/lib/supabase/server";
import { formatDate, hostname, pageShot, thumbnailSrc } from "@/lib/utils";

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
  const [related, extras, viewer] = await Promise.all([getRelated(site), getSiteExtras(site.id), getViewer()]);
  let adminCollections: { id: string; name: string }[] = [];
  let memberOf: string[] = [];
  if (viewer.isAdmin) {
    const db = await createClient();
    const [{ data: cols }, { data: mem }] = await Promise.all([
      db.from("collections").select("id, name").order("name"),
      db.from("collection_sites").select("collection_id").eq("site_id", site.id),
    ]);
    adminCollections = cols ?? [];
    memberOf = (mem ?? []).map((m) => m.collection_id);
  }

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
            <span className="mini-icon detail-icon">
              {site.favicon_url ? <img src={site.favicon_url} alt="" /> : site.name[0]}
            </span>
            <div className="detail-title">
              <h1>{site.name} {site.featured && <Verified style={{ width: 18, height: 18 }} />}</h1>
              {(site.design_style || site.category?.name) && <p>{site.design_style || site.category?.name}</p>}
            </div>
            <a className="btn-blue" href={site.url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: "auto" }}>
              Visit Website <Icon name="external" width={13} />
            </a>
          </div>

          <div className="detail-shot" data-reveal>
            <div className="gallery">
              <a href={site.url} target="_blank" rel="noopener noreferrer" className="gallery-item" aria-label={`Open ${site.name}`}>
                <Thumb site={site} eager />
              </a>
              {(site.gallery_pages ?? []).map((u) => (
                <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="gallery-item" aria-label={`Open ${u}`}>
                  <div className="thumb"><img src={pageShot(u)} alt={`${site.name} — ${hostname(u)}${new URL(u).pathname}`} loading="lazy" /></div>
                </a>
              ))}
            </div>
          </div>

          <div className="detail-body">
            <div data-reveal>
              <p className="eyebrow">About</p>
              <h2>{site.short_description || site.name}</h2>
              {site.description && <p className="prose">{site.description}</p>}
              {(site.features ?? []).length > 0 && (
                <>
                  <p className="eyebrow" style={{ marginTop: 32 }}>Features &amp; use cases</p>
                  <ul className="features">
                    {(site.features ?? []).map((x) => <li key={x}><Icon name="right" width={13} /> {x}</li>)}
                  </ul>
                </>
              )}

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
              {site.pricing && <div><p className="eyebrow">Pricing</p><p style={{ fontWeight: 500 }}>
                <Link href={`/all?pricing=${encodeURIComponent(site.pricing)}`}>{site.pricing}</Link></p></div>}
              {Object.keys(site.social ?? {}).length > 0 && (
                <div><p className="eyebrow">Links</p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {Object.entries(site.social ?? {}).map(([k, href]) => (
                      <a key={k} href={href} target="_blank" rel="noopener noreferrer" className="social-link" aria-label={k}>
                        <Icon name={k === "x" ? "sx" : k} width={16} />
                      </a>
                    ))}
                  </div></div>
              )}
              {site.design_style && (
                <div><p className="eyebrow">Design style</p><p style={{ fontWeight: 500 }}>
                  <Link href={`/all?style=${encodeURIComponent(site.design_style)}`}>{site.design_style}</Link></p></div>
              )}
              {extras.libraries.length > 0 && (
                <div><p className="eyebrow">Built with</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {extras.libraries.map((l) => <Link key={l.id} href={`/library/${l.slug}`} className="pill">{l.name}</Link>)}
                  </div></div>
              )}
              {extras.collections.length > 0 && (
                <div><p className="eyebrow">In collections</p>
                  <div style={{ display: "grid", gap: 6 }}>
                    {extras.collections.map((c) => <Link key={c.id} href={`/collections/${c.slug}`} style={{ fontWeight: 500 }}>{c.name}</Link>)}
                  </div></div>
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
          {viewer.isAdmin && <AddToCollection siteId={site.id} collections={adminCollections} memberOf={memberOf} />}
          <BookmarkButton siteId={site.id} name={site.name} variant="row" />
          <CopyLink />
          <ReportProblem siteId={site.id} siteName={site.name} />
          <a className="row" href={site.url} target="_blank" rel="noopener noreferrer"><Icon name="external" width={14} /> Open website</a>
          {related.length > 0 && (
            <>
              <p className="eyebrow" style={{ marginTop: 22 }}>Similar websites</p>
              {related.slice(0, 8).map((s) => (
                <Link key={s.id} className="row" href={`/references/${s.slug}`}>
                  {s.favicon_url ? <img src={s.favicon_url} alt="" /> : <span className="ph" />}<span>{s.name}</span>
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
