"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { CategoryCount, Tag } from "@/lib/types";
import type { LibraryCount } from "@/lib/queries";
import { Icon } from "./Icon";
import { Logo } from "./Logo";

export function Sidebar({ categories, tags, libraries = [] }: { categories: CategoryCount[]; tags: Tag[]; libraries?: LibraryCount[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(true);
  const [libsOpen, setLibsOpen] = useState(true);
  const [tagsOpen, setTagsOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const h = () => setOpen((o) => !o);
    window.addEventListener("miranda:toggle-sidebar", h);
    return () => window.removeEventListener("miranda:toggle-sidebar", h);
  }, []);

  const cur = (href: string) => (pathname === href ? "page" : undefined);

  return (
    <>
      {open && <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 39, background: "rgba(0,0,0,.5)" }} />}
      <aside className="sidebar" data-open={open}>
        <Link href="/" className="logo" aria-label="Miranda home"><Logo /></Link>
        <div className="sidebar-scroll">
          <button className="nav-item" style={{ width: "calc(100% - 8px)", background: "none", border: 0 }}
            onClick={() => window.dispatchEvent(new Event("miranda:open-search"))}>
            <Icon name="search" /> Search <span className="kbd">⌘ K</span>
          </button>
          <div style={{ height: 6 }} />
          <Link className="nav-item" href="/" aria-current={cur("/")}><Icon name="compass" /> Explore</Link>
          <Link className="nav-item" href="/featured" aria-current={cur("/featured")}><Icon name="bolt" /> Featured</Link>
          <Link className="nav-item" href="/articles" aria-current={cur("/articles")}><Icon name="file" /> Articles</Link>
          <Link className="nav-item" href="/collections" aria-current={cur("/collections")}><Icon name="folders" /> Collections</Link>
          <Link className="nav-item" href="/saved" aria-current={cur("/saved")}><Icon name="bookmark" /> Saved</Link>
          <Link className="nav-item" href="/all" aria-current={cur("/all")}><Icon name="folders" /> All websites</Link>
          <div style={{ height: 10 }} />

          <button className="nav-group" aria-expanded={tagsOpen} onClick={() => setTagsOpen((v) => !v)}>
            Tags <Icon name="chevron" />
          </button>
          <div className="nav-collapse" data-open={tagsOpen}>
            <div>
              {tags.map((t) => (
                <Link key={t.id} className="nav-item" href={`/tag/${t.slug}`} aria-current={cur(`/tag/${t.slug}`)}>
                  <Icon name="tag" /> {t.name}
                </Link>
              ))}
              {!tags.length && <p className="nav-item" style={{ color: "var(--dim)" }}>No tags yet</p>}
            </div>
          </div>

          {libraries.length > 0 && (
            <>
              <button className="nav-group" aria-expanded={libsOpen} onClick={() => setLibsOpen((v) => !v)}>
                Libraries <Icon name="chevron" />
              </button>
              <div className="nav-collapse" data-open={libsOpen}>
                <div style={{ paddingTop: 4 }}>
                  {libraries.map((l) => (
                    <Link key={l.id} className="nav-item" href={`/library/${l.slug}`} aria-current={cur(`/library/${l.slug}`)}>
                      {l.icon_url
                        ? <img src={l.icon_url} alt="" width={16} height={16} style={{ borderRadius: 3, flex: "none" }} />
                        : <span className="lib-dot" aria-hidden="true">{l.name.slice(0, 1)}</span>}
                      {l.name} <span className="nav-count">{l.site_count}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
          <button className="nav-group" aria-expanded={catsOpen} onClick={() => setCatsOpen((v) => !v)}>
            Categories <Icon name="chevron" />
          </button>
          <div className="nav-collapse" data-open={catsOpen}>
            <div style={{ paddingTop: 4 }}>
              {categories.map((c) => (
                <Link key={c.id} className="nav-item" href={`/category/${c.slug}`} aria-current={cur(`/category/${c.slug}`)}>
                  <Icon name={c.icon} /> {c.name} <span className="nav-count">{c.site_count}</span>
                </Link>
              ))}
              {!categories.length && <p className="nav-item" style={{ color: "var(--dim)" }}>No categories yet</p>}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
