"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SiteFull } from "@/lib/types";
import { thumbnailSrc } from "@/lib/utils";
import { Verified } from "./Icon";

/* eslint-disable @next/next/no-img-element */

const FALLBACK = "#1b2a8f";

/** Average colour of an image, darkened, for the slide's left panel (like Toolfolio). */
function useTint(src: string | null) {
  const [tint, setTint] = useState(FALLBACK);
  useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = c.height = 16;
        const ctx = c.getContext("2d")!;
        ctx.drawImage(img, 0, 0, 16, 16);
        const d = ctx.getImageData(0, 0, 16, 16).data;
        let r = 0, g = 0, b = 0;
        for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
        const n = d.length / 4;
        const k = 0.55; // darken so white text stays readable
        setTint(`rgb(${Math.round((r / n) * k)}, ${Math.round((g / n) * k)}, ${Math.round((b / n) * k)})`);
      } catch { /* image without CORS: keep fallback */ }
    };
    img.src = src;
  }, [src]);
  return tint;
}

function Slide({ site, active }: { site: SiteFull; active: boolean }) {
  const src = thumbnailSrc(site);
  const tint = useTint(src);
  return (
    <Link href={`/references/${site.slug}`} className="hero-slide" aria-hidden={!active} tabIndex={active ? 0 : -1}>
      <div className="hero-info" style={{ background: `linear-gradient(135deg, ${tint} 0%, color-mix(in srgb, ${tint} 70%, #000) 100%)` }}>
        <span className="hero-icon">
          {site.favicon_url ? <img src={site.favicon_url} alt="" /> : site.name.slice(0, 1)}
        </span>
        <h2>{site.name} {site.featured && <Verified style={{ width: 20, height: 20 }} />}</h2>
        {site.short_description && <p>{site.short_description}</p>}
        <span className="hero-tag">{site.category?.name ?? site.design_style}</span>
      </div>
      <div className="hero-shot">
        {src ? <img src={src} alt={`${site.name} preview`} /> : <span className="fallback">{site.name.slice(0, 1)}</span>}
      </div>
    </Link>
  );
}

export function HeroCarousel({ sites }: { sites: SiteFull[] }) {
  const [i, setI] = useState(0);
  const paused = useRef(false);
  const n = sites.length;
  const go = useCallback((to: number) => setI(((to % n) + n) % n), [n]);

  useEffect(() => {
    if (n < 2) return;
    const t = setInterval(() => { if (!paused.current && !document.hidden) setI((v) => (v + 1) % n); }, 6000);
    return () => clearInterval(t);
  }, [n]);

  if (!n) return null;
  return (
    <section className="hero" data-reveal aria-roledescription="carousel"
      onMouseEnter={() => (paused.current = true)} onMouseLeave={() => (paused.current = false)}>
      <div className="hero-track" style={{ transform: `translateX(-${i * 100}%)` }}>
        {sites.map((s, k) => <Slide key={s.id} site={s} active={k === i} />)}
      </div>
      {n > 1 && (
        <div className="hero-dots" role="tablist">
          {sites.map((s, k) => (
            <button key={s.id} role="tab" aria-selected={k === i} aria-label={`Show ${s.name}`} onClick={() => go(k)} />
          ))}
        </div>
      )}
    </section>
  );
}
