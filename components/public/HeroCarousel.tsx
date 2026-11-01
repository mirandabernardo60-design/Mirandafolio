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
    <Link href={`/references/${site.slug}`} className="hero-slide" aria-hidden={!active} tabIndex={active ? 0 : -1} draggable={false}
      style={{ background: `linear-gradient(160deg, ${tint} 0%, color-mix(in srgb, ${tint} 60%, #000) 100%)` }}
      onClick={(e) => { if ((e.currentTarget.closest(".hero") as HTMLElement | null)?.dataset.dragged === "1") e.preventDefault(); }}>
      <div className="hero-info">
        <span className="hero-icon">
          {site.favicon_url ? <img src={site.favicon_url} alt="" /> : site.name.slice(0, 1)}
        </span>
        <h2>{site.name} {site.featured && <Verified style={{ width: 20, height: 20 }} />}</h2>
        {site.short_description && <p>{site.short_description}</p>}
        <span className="hero-tag">{site.category?.name ?? site.design_style}</span>
      </div>
      <div className="hero-shot">
        {src ? <img src={src} alt={`${site.name} preview`} draggable={false} /> : <span className="fallback">{site.name.slice(0, 1)}</span>}
      </div>
    </Link>
  );
}

export function HeroCarousel({ sites }: { sites: SiteFull[] }) {
  const [i, setI] = useState(0);
  const [drag, setDrag] = useState(0); // px offset while the finger is down
  const start = useRef<{ x: number; y: number; t: number; locked: null | "x" | "y" } | null>(null);
  const root = useRef<HTMLElement>(null);
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
    <section ref={root} className="hero" data-reveal aria-roledescription="carousel"
      onMouseEnter={() => (paused.current = true)} onMouseLeave={() => (paused.current = false)}
      onPointerDown={(e) => {
        if (n < 2 || (e.pointerType === "mouse" && e.button !== 0)) return;
        start.current = { x: e.clientX, y: e.clientY, t: Date.now(), locked: null };
        paused.current = true;
        if (root.current) root.current.dataset.dragged = "0";
      }}
      onPointerMove={(e) => {
        const s0 = start.current;
        if (!s0) return;
        const dx = e.clientX - s0.x, dy = e.clientY - s0.y;
        if (!s0.locked && Math.hypot(dx, dy) > 6) s0.locked = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        if (s0.locked !== "x") return;
        if (root.current) root.current.dataset.dragged = "1";
        // resist at the ends
        const atEdge = (i === 0 && dx > 0) || (i === n - 1 && dx < 0);
        setDrag(atEdge ? dx / 3 : dx);
      }}
      onPointerUp={(e) => {
        const s0 = start.current;
        start.current = null;
        paused.current = false;
        if (!s0 || s0.locked !== "x") { setDrag(0); return; }
        const dx = e.clientX - s0.x;
        const w = root.current?.clientWidth ?? 1;
        const fast = Math.abs(dx) / Math.max(1, Date.now() - s0.t) > 0.4;
        if ((Math.abs(dx) > w * 0.18 || fast) && dx < 0) go(Math.min(i + 1, n - 1));
        else if ((Math.abs(dx) > w * 0.18 || fast) && dx > 0) go(Math.max(i - 1, 0));
        setDrag(0);
      }}
      onPointerCancel={() => { start.current = null; paused.current = false; setDrag(0); }}>
      <div className="hero-track" data-dragging={drag !== 0}
        style={{ transform: `translateX(calc(-${i * 100}% + ${drag}px))` }}>
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
