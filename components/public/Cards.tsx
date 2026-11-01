import Link from "next/link";
import type { SiteFull } from "@/lib/types";
import { thumbnailSrc } from "@/lib/utils";
import { Icon, Verified } from "./Icon";
import { BookmarkButton } from "./Bookmarks";

/* eslint-disable @next/next/no-img-element */
export function Thumb({ site, eager }: { site: SiteFull; eager?: boolean }) {
  const src = thumbnailSrc(site);
  return (
    <div className="thumb">
      {src ? (
        <img src={src} alt={`${site.name} preview`} loading={eager ? "eager" : "lazy"} decoding="async" />
      ) : (
        <div className="fallback">{site.name.slice(0, 1)}</div>
      )}
    </div>
  );
}

export function SiteCard({ site, eager }: { site: SiteFull; eager?: boolean }) {
  const blurb = site.description || site.short_description;
  const label = site.pricing || site.design_style || site.category?.name;
  return (
    <div className="card" data-reveal>
      <Link href={`/references/${site.slug}`} className="card-link" aria-label={site.name}>
        <div className="thumb-wrap">
          <Thumb site={site} eager={eager} />
          <div className="thumb-hover">
            {label && <span className="th-label">{label}</span>}
            <Icon name="eye" width={20} className="th-eye" />
            {blurb && <p>{blurb}</p>}
            {site.favicon_url && <img className="th-icon" src={site.favicon_url} alt="" loading="lazy" />}
          </div>
        </div>
      </Link>
      <div className="card-meta">
        <Link href={`/references/${site.slug}`} className="card-name"><strong>{site.name}</strong></Link>
        {site.featured && <Verified />}
        {(site.short_description || site.category?.name) && <span className="dot">•</span>}
        <span className="sub">{site.short_description || site.category?.name}</span>
        <BookmarkButton siteId={site.id} name={site.name} />
        <a className="card-ext" href={site.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${site.name} in a new tab`}>
          <Icon name="external" width={16} />
        </a>
      </div>
    </div>
  );
}

export function MiniSite({ site }: { site: SiteFull }) {
  return (
    <Link href={`/references/${site.slug}`} className="mini" data-reveal>
      <span className="mini-icon">
        {site.favicon_url ? <img src={site.favicon_url} alt="" loading="lazy" /> : site.name.slice(0, 1)}
      </span>
      <span style={{ minWidth: 0 }}>
        <span className="mini-title">{site.name} {site.featured && <Verified />}</span>
        <span className="mini-sub" style={{ display: "block" }}>{site.short_description || site.category?.name || ""}</span>
      </span>
    </Link>
  );
}
