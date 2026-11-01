"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteCollection, saveCollection, toggleCollectionSite } from "@/app/admin/actions";
import { toast } from "./Toast";

type Col = { id: string; name: string; slug: string; description: string; published: boolean; sites: { id: string; name: string }[] };

export function CollectionsAdmin({ collections, allSites }: { collections: Col[]; allSites: { id: string; name: string }[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: "", description: "", published: true });
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, msg: string, after?: () => void) =>
    start(async () => { const r = await fn(); if (r.ok) { toast(msg); after?.(); router.refresh(); } else toast(r.error ?? "Failed", true); });

  const Editor = ({ c }: { c?: Col }) => {
    const [f, setF] = useState(c ? { name: c.name, description: c.description, published: c.published } : draft);
    return (
      <form className="stack" onSubmit={(e) => { e.preventDefault(); run(() => saveCollection(c?.id ?? null, f), c ? "Saved" : "Created", () => { setEditing(null); if (!c) setDraft({ name: "", description: "", published: true }); }); }}>
        <input className="adm-input" placeholder="15 Best Portfolio Websites in 2026" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required maxLength={120} />
        <textarea className="adm-textarea" style={{ minHeight: 70 }} placeholder="Short description shown on the card" value={f.description} maxLength={400} onChange={(e) => setF({ ...f, description: e.target.value })} />
        <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
          <input type="checkbox" checked={f.published} onChange={(e) => setF({ ...f, published: e.target.checked })} /> Visible on the site
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="adm-btn primary" disabled={pending}>{c ? "Save" : "Create collection"}</button>
          {c && <button type="button" className="adm-btn" onClick={() => setEditing(null)}>Cancel</button>}
        </div>
      </form>
    );
  };

  return (
    <>
      <div className="adm-card" style={{ marginBottom: 16 }}><Editor /></div>
      <div className="stack">
        {collections.map((c) => (
          <div key={c.id} className="adm-card stack">
            {editing === c.id ? <Editor c={c} /> : (
              <>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <b style={{ fontSize: 15 }}>{c.name}</b>
                  <span className={`badge ${c.published ? "pub" : "draft"}`}>{c.published ? "visible" : "hidden"}</span>
                  <span style={{ color: "var(--muted)", fontSize: 12 }}>{c.sites.length} websites</span>
                  <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                    <a className="adm-btn sm" href={`/collections/${c.slug}`} target="_blank" rel="noreferrer">View</a>
                    <button className="adm-btn sm" onClick={() => setEditing(c.id)}>Edit</button>
                    <button className="adm-btn sm danger" disabled={pending}
                      onClick={() => confirm(`Delete “${c.name}”? The websites themselves are kept.`) && run(() => deleteCollection(c.id), "Deleted")}>Delete</button>
                  </span>
                </div>
                {c.description && <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>{c.description}</p>}
                <div className="adm-chips">
                  {c.sites.map((s) => (
                    <span key={s.id} className="adm-chip">{s.name}
                      <button type="button" aria-label={`Remove ${s.name}`} onClick={() => run(() => toggleCollectionSite(c.id, s.id, false), "Removed")}>×</button>
                    </span>
                  ))}
                </div>
                <select className="adm-select" style={{ maxWidth: 320 }} value="" disabled={pending}
                  onChange={(e) => { const v = e.target.value; if (v) run(() => toggleCollectionSite(c.id, v, true), "Added"); }}>
                  <option value="">+ Add a website…</option>
                  {allSites.filter((s) => !c.sites.some((x) => x.id === s.id)).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </>
            )}
          </div>
        ))}
        {!collections.length && <p style={{ color: "var(--muted)" }}>No collections yet. Create one above, or use “Add to collection” on any website page.</p>}
      </div>
    </>
  );
}
