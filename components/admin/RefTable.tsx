"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { bulkUpdate, deleteSites, duplicateSite, reorderSites } from "@/app/admin/actions";
import { formatDate, thumbnailSrc } from "@/lib/utils";
import { toast } from "./Toast";

type Row = {
  id: string; name: string; slug: string; url: string; status: "draft" | "published"; featured: boolean;
  position: number; created_at: string; updated_at: string; category_id: string | null; short_description: string;
  design_style: string; thumbnail_path: string | null; thumbnail_url: string | null; site_tags: { tags: { name: string } | null }[];
};

/* eslint-disable @next/next/no-img-element */
export function RefTable({ sites, categories, initialCategory = "", initialQuery = "" }: { sites: Row[]; categories: { id: string; name: string }[]; initialCategory?: string; initialQuery?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [q, setQ] = useState(initialQuery);
  const [status, setStatus] = useState("");
  const [cat, setCat] = useState(initialCategory);
  const [sort, setSort] = useState("custom");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [order, setOrder] = useState(sites.map((s) => s.id));
  useEffect(() => setOrder(sites.map((s) => s.id)), [sites]);

  const catName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? "—";
  const byId = useMemo(() => new Map(sites.map((s) => [s.id, s])), [sites]);

  const rows = useMemo(() => {
    const needle = q.toLowerCase();
    let list = order.map((id) => byId.get(id)!).filter(Boolean).filter((s) => {
      if (status === "featured" ? !s.featured : status && s.status !== status) return false;
      if (cat && (cat === "none" ? s.category_id : s.category_id !== cat)) return false;
      if (!needle) return true;
      const tags = s.site_tags.map((t) => t.tags?.name ?? "").join(" ");
      return [s.name, s.url, s.short_description, s.design_style, catName(s.category_id), tags].join(" ").toLowerCase().includes(needle);
    });
    if (sort === "latest") list = [...list].sort((a, b) => b.created_at.localeCompare(a.created_at));
    if (sort === "updated") list = [...list].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, cat, sort, order, byId]);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, msg: string) =>
    start(async () => {
      const r = await fn();
      if (r.ok) { toast(msg); setSel(new Set()); router.refresh(); } else toast(r.error ?? "Failed", true);
    });

  const move = (id: string, dir: -1 | 1) => {
    const i = order.indexOf(id);
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
    run(() => reorderSites(next), "Order saved");
  };

  const ids = [...sel];
  const allSelected = rows.length > 0 && rows.every((r) => sel.has(r.id));

  return (
    <>
      <div className="adm-toolbar">
        <input className="adm-input" placeholder="Search name, URL, tags…" value={q} onChange={(e) => setQ(e.target.value)} style={{ minWidth: 220 }} />
        <select className="adm-select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status filter">
          <option value="">All statuses</option><option value="published">Published</option><option value="draft">Draft</option><option value="featured">Featured</option>
        </select>
        <select className="adm-select" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category filter">
          <option value="">All categories</option><option value="none">Uncategorized</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="adm-select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
          <option value="custom">Custom order</option><option value="latest">Newest</option><option value="updated">Recently updated</option><option value="name">Name A–Z</option>
        </select>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted)" }}>{rows.length} of {sites.length}</span>
      </div>

      <div className="adm-card adm-scroll" style={{ padding: 0 }}>
        <table className="adm-table">
          <thead>
            <tr>
              <th style={{ width: 36 }}><input type="checkbox" aria-label="Select all" checked={allSelected}
                onChange={() => setSel(allSelected ? new Set() : new Set(rows.map((r) => r.id)))} /></th>
              <th></th><th>Name</th><th className="hide-m">Category</th><th>Status</th><th className="hide-m">Updated</th>
              {sort === "custom" && <th className="hide-m">Order</th>}<th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => {
              const src = thumbnailSrc(s);
              return (
                <tr key={s.id}>
                  <td><input type="checkbox" aria-label={`Select ${s.name}`} checked={sel.has(s.id)}
                    onChange={() => { const n = new Set(sel); if (n.has(s.id)) n.delete(s.id); else n.add(s.id); setSel(n); }} /></td>
                  <td style={{ width: 76 }}>{src ? <img className="adm-thumb" src={src} alt="" /> : <div className="adm-thumb" />}</td>
                  <td>
                    <Link href={`/admin/references/${s.id}`} style={{ fontWeight: 500 }}>{s.name}</Link>
                    <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{s.url.replace(/^https?:\/\//, "")}</div>
                  </td>
                  <td className="hide-m">{catName(s.category_id)}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <span className={`badge ${s.status === "published" ? "pub" : "draft"}`}>{s.status}</span>{" "}
                    {s.featured && <span className="badge feat">featured</span>}
                  </td>
                  <td className="hide-m" style={{ color: "var(--muted)", whiteSpace: "nowrap" }}>{formatDate(s.updated_at)}</td>
                  {sort === "custom" && (
                    <td className="hide-m" style={{ whiteSpace: "nowrap" }}>
                      <button className="adm-btn sm" aria-label="Move up" disabled={pending} onClick={() => move(s.id, -1)}>↑</button>{" "}
                      <button className="adm-btn sm" aria-label="Move down" disabled={pending} onClick={() => move(s.id, 1)}>↓</button>
                    </td>
                  )}
                  <td style={{ whiteSpace: "nowrap", textAlign: "right" }}>
                    <button className="adm-btn sm" disabled={pending}
                      onClick={() => run(() => bulkUpdate([s.id], { status: s.status === "published" ? "draft" : "published" }), s.status === "published" ? "Unpublished" : "Published")}>
                      {s.status === "published" ? "Unpublish" : "Publish"}
                    </button>{" "}
                    <button className="adm-btn sm" disabled={pending}
                      onClick={() => run(() => bulkUpdate([s.id], { featured: !s.featured }), s.featured ? "Unfeatured" : "Featured")}>
                      {s.featured ? "Unfeature" : "Feature"}
                    </button>{" "}
                    <button className="adm-btn sm" disabled={pending} onClick={() => run(() => duplicateSite(s.id), "Duplicated as draft")}>Duplicate</button>{" "}
                    <button className="adm-btn sm danger" disabled={pending}
                      onClick={() => confirm(`Delete “${s.name}”? This cannot be undone.`) && run(() => deleteSites([s.id]), "Deleted")}>Delete</button>
                  </td>
                </tr>
              );
            })}
            {!rows.length && <tr><td colSpan={8} style={{ color: "var(--muted)", padding: 24, textAlign: "center" }}>No references match.</td></tr>}
          </tbody>
        </table>
      </div>

      {ids.length > 0 && (
        <div className="adm-bulk">
          <b style={{ fontSize: 13 }}>{ids.length} selected</b>
          <button className="adm-btn sm" disabled={pending} onClick={() => run(() => bulkUpdate(ids, { status: "published" }), "Published")}>Publish</button>
          <button className="adm-btn sm" disabled={pending} onClick={() => run(() => bulkUpdate(ids, { status: "draft" }), "Moved to drafts")}>Unpublish</button>
          <button className="adm-btn sm" disabled={pending} onClick={() => run(() => bulkUpdate(ids, { featured: true }), "Featured")}>Feature</button>
          <button className="adm-btn sm" disabled={pending} onClick={() => run(() => bulkUpdate(ids, { featured: false }), "Unfeatured")}>Unfeature</button>
          <select className="adm-select" style={{ width: "auto", height: 28, padding: "0 8px", fontSize: 12 }} defaultValue=""
            onChange={(e) => { const v = e.target.value; e.target.value = ""; if (v) run(() => bulkUpdate(ids, { category_id: v === "none" ? null : v }), "Category updated"); }}>
            <option value="" disabled>Set category…</option><option value="none">None</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="adm-btn sm danger" disabled={pending}
            onClick={() => confirm(`Delete ${ids.length} references? This cannot be undone.`) && run(() => deleteSites(ids), "Deleted")}>Delete</button>
          <button className="adm-btn sm" style={{ marginLeft: "auto" }} onClick={() => setSel(new Set())}>Clear</button>
        </div>
      )}
    </>
  );
}
