"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CategoryCount, Tag } from "@/lib/types";
import { Icon } from "./Icon";

/* eslint-disable @next/next/no-img-element */

type Mini = { slug: string; name: string; short_description: string; favicon_url: string | null; category?: string };
type View = "trending" | "categories" | "tags" | "latest";
const VIEWS: { id: View; label: string }[] = [
  { id: "trending", label: "Trending" },
  { id: "categories", label: "Categories" },
  { id: "tags", label: "Tags" },
  { id: "latest", label: "Latest Additions" },
];

function AppIcon({ s, size = 56 }: { s: Mini; size?: number }) {
  return (
    <span className="sp-appicon" style={{ width: size, height: size, borderRadius: size * 0.22 }}>
      {s.favicon_url ? <img src={s.favicon_url} alt="" /> : s.name.slice(0, 1)}
    </span>
  );
}

function Row({ title, featured, children }: { title: string; featured?: boolean; children: React.ReactNode }) {
  const track = useRef<HTMLDivElement>(null);
  const by = (d: number) => track.current?.scrollBy({ left: d * track.current.clientWidth * 0.8, behavior: "smooth" });
  return (
    <section className="sp-row">
      <div className="sp-row-head">
        {featured && <Icon name="bolt" width={14} style={{ color: "#5b8cff", fill: "#5b8cff" }} />}
        <h3>{title}</h3>
        <div className="sp-arrows">
          <button aria-label="Previous" onClick={() => by(-1)}><Icon name="left" width={14} /></button>
          <button aria-label="Next" onClick={() => by(1)}><Icon name="right" width={14} /></button>
        </div>
      </div>
      <div className="sp-track" ref={track}>{children}</div>
    </section>
  );
}

export function SearchPalette({ categories, tags, featured, recent }: {
  categories: CategoryCount[]; tags: Tag[]; featured: Mini[]; recent: Mini[];
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("trending");
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Mini[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); }
      if (e.key === "Escape") setOpen(false);
    };
    const ev = () => setOpen(true);
    window.addEventListener("keydown", key);
    window.addEventListener("miranda:open-search", ev);
    return () => { window.removeEventListener("keydown", key); window.removeEventListener("miranda:open-search", ev); };
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    setTimeout(() => input.current?.focus(), 20);
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const term = q.trim();
    if (!term) { setHits([]); setLoading(false); return; }
    setLoading(true);
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctl.signal });
        if (res.ok) { setHits(await res.json()); setActive(0); }
      } catch { /* aborted */ } finally { setLoading(false); }
    }, 150);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [q]);

  const term = q.trim().toLowerCase();
  const catHits = useMemo(() => (term ? categories.filter((c) => c.name.toLowerCase().includes(term)).slice(0, 6) : []), [term, categories]);
  const tagHits = useMemo(() => (term ? tags.filter((t) => t.name.toLowerCase().includes(term)).slice(0, 8) : []), [term, tags]);

  const close = () => setOpen(false);
  if (!open) return null;

  const SiteCard = ({ s }: { s: Mini }) => (
    <Link href={`/references/${s.slug}`} className="sp-card" onClick={close}>
      <AppIcon s={s} size={28} />
      <strong>{s.name}</strong>
      <span>{s.short_description || s.category}</span>
    </Link>
  );

  return (
    <div className="sp-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="sp" role="dialog" aria-modal="true" aria-label="Search">
        <div className="sp-search">
          <Icon name="search" width={17} />
          <input ref={input} value={q} placeholder="Search for websites, categories, or tags…" aria-label="Search"
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, hits.length - 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
              if (e.key === "Enter" && term) {
                close();
                router.push(hits[active] ? `/references/${hits[active].slug}` : `/all?q=${encodeURIComponent(q.trim())}`);
              }
            }} />
          <button className="sp-close" aria-label="Close search" onClick={close}><Icon name="x" width={16} /></button>
        </div>

        <div className="sp-body">
          {!term && (
            <nav className="sp-nav" aria-label="Search sections">
              <p>Navigation</p>
              {VIEWS.map((v) => (
                <button key={v.id} aria-current={view === v.id} onClick={() => setView(v.id)}>{v.label}</button>
              ))}
            </nav>
          )}

          <div className="sp-main">
            {term ? (
              <div className="sp-results">
                {catHits.length > 0 && (
                  <>
                    <p className="sp-label">Categories</p>
                    <div className="sp-chips">
                      {catHits.map((c) => <Link key={c.id} href={`/category/${c.slug}`} onClick={close}><Icon name={c.icon} width={13} /> {c.name}</Link>)}
                    </div>
                  </>
                )}
                {tagHits.length > 0 && (
                  <>
                    <p className="sp-label">Tags</p>
                    <div className="sp-chips">
                      {tagHits.map((t) => <Link key={t.id} href={`/tag/${t.slug}`} onClick={close}>#{t.name}</Link>)}
                    </div>
                  </>
                )}
                <p className="sp-label">Websites</p>
                {hits.map((h, i) => (
                  <Link key={h.slug} href={`/references/${h.slug}`} className="sp-hit" data-active={i === active}
                    onMouseEnter={() => setActive(i)} onClick={close}>
                    <AppIcon s={h} size={36} />
                    <span><strong>{h.name}</strong><em>{h.short_description}</em></span>
                    <Icon name="right" width={14} />
                  </Link>
                ))}
                {!loading && !hits.length && <p className="sp-empty">No websites match “{q.trim()}”. Press Enter to search everything.</p>}
                {loading && !hits.length && <p className="sp-empty">Searching…</p>}
              </div>
            ) : view === "trending" ? (
              <>
                {featured.length > 0 && (
                  <Row title="Featured" featured>
                    {featured.map((s) => (
                      <Link key={s.slug} href={`/references/${s.slug}`} onClick={close} title={s.name} className="sp-iconlink"><AppIcon s={s} /></Link>
                    ))}
                  </Row>
                )}
                {categories.length > 0 && (
                  <Row title="Popular Categories">
                    {[...categories].sort((a, b) => b.site_count - a.site_count).slice(0, 8).map((c) => (
                      <Link key={c.id} href={`/category/${c.slug}`} className="sp-card" onClick={close}>
                        <span className="sp-caticon"><Icon name={c.icon} width={18} /></span>
                        <strong>{c.name}</strong>
                        <span>{c.site_count} {c.site_count === 1 ? "website" : "websites"}</span>
                      </Link>
                    ))}
                  </Row>
                )}
                {recent.length > 0 && (
                  <Row title="Latest Additions">{recent.map((s) => <SiteCard key={s.slug} s={s} />)}</Row>
                )}
                {!featured.length && !categories.length && !recent.length && <p className="sp-empty">Nothing here yet.</p>}
              </>
            ) : view === "categories" ? (
              <div className="sp-grid">
                {categories.map((c) => (
                  <Link key={c.id} href={`/category/${c.slug}`} className="sp-card" onClick={close}>
                    <span className="sp-caticon"><Icon name={c.icon} width={18} /></span>
                    <strong>{c.name}</strong>
                    <span>{c.site_count} {c.site_count === 1 ? "website" : "websites"}</span>
                  </Link>
                ))}
              </div>
            ) : view === "tags" ? (
              <div className="sp-chips" style={{ paddingTop: 4 }}>
                {tags.map((t) => <Link key={t.id} href={`/tag/${t.slug}`} onClick={close}>#{t.name}</Link>)}
                {!tags.length && <p className="sp-empty">No tags yet.</p>}
              </div>
            ) : (
              <div className="sp-list">
                {recent.map((s) => (
                  <Link key={s.slug} href={`/references/${s.slug}`} className="sp-hit" onClick={close}>
                    <AppIcon s={s} size={36} />
                    <span><strong>{s.name}</strong><em>{s.short_description || s.category}</em></span>
                    <Icon name="right" width={14} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
