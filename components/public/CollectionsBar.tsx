"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";

const SORTS = [{ v: "latest", l: "Latest" }, { v: "size", l: "Most websites" }, { v: "name", l: "A–Z" }];

export function CollectionsBar({ count }: { count: number }) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [open, setOpen] = useState(false);
  const push = (k: string, v: string | null) => {
    const n = new URLSearchParams(sp.toString());
    if (v) n.set(k, v); else n.delete(k);
    router.replace(`${pathname}${n.toString() ? `?${n}` : ""}`, { scroll: false });
  };
  useEffect(() => { const t = setTimeout(() => { if ((sp.get("q") ?? "") !== q) push("q", q.trim() || null); }, 250); return () => clearTimeout(t); }, [q]); // eslint-disable-line react-hooks/exhaustive-deps
  const sort = sp.get("sort") ?? "latest";
  return (
    <div className="filterbar">
      <div style={{ position: "relative" }}>
        <Icon name="search" width={12} style={{ position: "absolute", left: 10, top: 8, color: "var(--muted)" }} />
        <input className="search-input" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search collections" />
      </div>
      <span className="count" style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted)" }}>Showing {count} {count === 1 ? "collection" : "collections"}</span>
      <div style={{ position: "relative" }}>
        <button className="chip" onClick={() => setOpen((o) => !o)} aria-expanded={open}>{SORTS.find((s) => s.v === sort)?.l} <Icon name="chevron" /></button>
        {open && (
          <div className="menu" style={{ left: "auto", right: 0 }}>
            {SORTS.map((s) => <button key={s.v} aria-current={s.v === sort} onClick={() => { setOpen(false); push("sort", s.v === "latest" ? null : s.v); }}>{s.l}</button>)}
          </div>
        )}
      </div>
    </div>
  );
}
