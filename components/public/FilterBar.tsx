"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { CategoryCount, Tag } from "@/lib/types";
import { Icon } from "./Icon";

type Props = { categories: CategoryCount[]; tags: Tag[]; styles: string[]; count: number; lockCategory?: boolean };

const SORTS = [
  { v: "latest", l: "Latest" },
  { v: "oldest", l: "Oldest" },
  { v: "name", l: "A–Z" },
  { v: "custom", l: "Curated" },
];

function Dropdown({ label, active, children }: { label: string; active?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }} onClick={(e) => { if ((e.target as HTMLElement).closest("a")) setOpen(false); }}>
      <button className="chip" data-active={active || open} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {label} <Icon name="chevron" />
      </button>
      {open && <div className="menu" role="menu">{children}</div>}
    </div>
  );
}

export function FilterBar({ categories, tags, styles, count, lockCategory }: Props) {
  const sp = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [q, setQ] = useState(sp.get("q") ?? "");

  const href = (key: string, value: string | null) => {
    const next = new URLSearchParams(sp.toString());
    if (value) next.set(key, value); else next.delete(key);
    const s = next.toString();
    return `${pathname}${s ? `?${s}` : ""}`;
  };

  useEffect(() => {
    const t = setTimeout(() => {
      if ((sp.get("q") ?? "") !== q) router.replace(href("q", q.trim() || null), { scroll: false });
    }, 280);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const sort = sp.get("sort") ?? "latest";
  const tag = sp.get("tag");
  const style = sp.get("style");

  return (
    <div className="filterbar">
      {!lockCategory && (
        <Dropdown label="Categories">
          {categories.map((c) => (
            <Link key={c.id} href={`/category/${c.slug}`}><Icon name={c.icon} width={13} /> {c.name}</Link>
          ))}
        </Dropdown>
      )}
      <Dropdown label={tag ? `Tag: ${tags.find((t) => t.slug === tag)?.name ?? tag}` : "Tags"} active={!!tag}>
        {tag && <Link href={href("tag", null)}>Clear</Link>}
        {tags.map((t) => (
          <Link key={t.id} href={href("tag", t.slug)} aria-current={t.slug === tag}>{t.name}</Link>
        ))}
        {!tags.length && <span style={{ padding: 8, color: "var(--dim)", fontSize: 12 }}>No tags</span>}
      </Dropdown>
      <Dropdown label={style ? `Style: ${style}` : "Style"} active={!!style}>
        {style && <Link href={href("style", null)}>Clear</Link>}
        {styles.map((s) => <Link key={s} href={href("style", s)} aria-current={s === style}>{s}</Link>)}
        {!styles.length && <span style={{ padding: 8, color: "var(--dim)", fontSize: 12 }}>No styles</span>}
      </Dropdown>
      <div style={{ position: "relative" }}>
        <Icon name="search" width={12} style={{ position: "absolute", left: 10, top: 8, color: "var(--muted)" }} />
        <input className="search-input" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search websites" />
      </div>
      <span className="count" style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap" }}>
        Showing {count} {count === 1 ? "website" : "websites"}
      </span>
      <Dropdown label={SORTS.find((s) => s.v === sort)?.l ?? "Latest"}>
        {SORTS.map((s) => <Link key={s.v} href={href("sort", s.v === "latest" ? null : s.v)} aria-current={s.v === sort}>{s.l}</Link>)}
      </Dropdown>
    </div>
  );
}
