"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

type Hit = { slug: string; name: string; short_description: string; favicon_url: string | null };

export function SearchPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
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

  useEffect(() => { if (open) setTimeout(() => input.current?.focus(), 10); }, [open]);

  useEffect(() => {
    if (!q.trim()) { setHits([]); return; }
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctl.signal });
        if (res.ok) { setHits(await res.json()); setActive(0); }
      } catch { /* aborted */ }
    }, 150);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [q]);

  if (!open) return null;
  return (
    <div className="palette-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
      <div className="palette" role="dialog" aria-label="Search">
        <input ref={input} value={q} placeholder="Search websites, categories, tags…" onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, hits.length - 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
            if (e.key === "Enter") {
              setOpen(false);
              router.push(hits[active] ? `/references/${hits[active].slug}` : `/all?q=${encodeURIComponent(q)}`);
            }
          }} />
        <ul>
          {hits.map((h, i) => (
            <li key={h.slug}>
              <Link href={`/references/${h.slug}`} data-active={i === active} onClick={() => setOpen(false)}>
                <span className="mini-icon" style={{ width: 24, height: 24, borderRadius: 6 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {h.favicon_url ? <img src={h.favicon_url} alt="" /> : h.name[0]}
                </span>
                <span>{h.name}</span>
                <span style={{ color: "var(--muted)", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.short_description}</span>
              </Link>
            </li>
          ))}
          {q && !hits.length && (
            <li style={{ padding: 12, color: "var(--muted)", fontSize: 13, display: "flex", gap: 8, alignItems: "center" }}>
              <Icon name="search" width={13} /> Press Enter to search all websites
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
