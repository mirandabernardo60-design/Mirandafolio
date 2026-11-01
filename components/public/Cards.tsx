import Link from "next/link";
import type { SiteFull } from "@/lib/types";
import { thumbnailSrc } from "@/lib/utils";
import { Verified } from "./Icon";

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
  return (
    <Link href={`/references/${site.slug}`} className="card" data-reveal>
      <div className="thumb-wrap">
        <Thumb site={site} eager={eager} />
        {site.description || site.short_description ? (
          <div className="thumb-hover"><p>{site.description || site.short_description}</p></div>
        ) : null}
      </div>
      <div className="card-meta">
        <strong>{site.name}</strong>
        {site.featured && <Verified />}
        {(site.short_description || site.category) && <span className="dot">•</span>}
        <span className="sub">{site.short_description || site.category?.name}</span>
      </div>
    </Link>
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
