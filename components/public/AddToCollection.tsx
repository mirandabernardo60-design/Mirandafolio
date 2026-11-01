"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { createCollectionWithSite, toggleCollectionSite } from "@/app/admin/actions";
import { Icon } from "./Icon";

type C = { id: string; name: string };

/** Admin-only: put this website into one or more collections, or create a new one. */
export function AddToCollection({ siteId, collections, memberOf }: { siteId: string; collections: C[]; memberOf: string[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [inSet, setInSet] = useState(new Set(memberOf));
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const toggle = (c: C) => {
    const add = !inSet.has(c.id);
    const next = new Set(inSet); if (add) next.add(c.id); else next.delete(c.id);
    setInSet(next);
    start(async () => {
      const r = await toggleCollectionSite(c.id, siteId, add);
      if (!r.ok) { setInSet(inSet); setMsg(r.error); } else { setMsg(add ? `Added to ${c.name}` : `Removed from ${c.name}`); router.refresh(); }
    });
  };

  const create = () => {
    const n = name.trim();
    if (!n) return;
    start(async () => {
      const r = await createCollectionWithSite(n, siteId);
      if (!r.ok || !r.data) { setMsg(r.ok ? "Could not create it." : r.error); return; }
      setInSet(new Set([...inSet, r.data.id])); setName(""); setMsg(`Created “${n}”`); router.refresh();
    });
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button className="row" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <Icon name="bookmark" width={14} /> Add to collection {inSet.size > 0 && <span className="nav-count" style={{ marginLeft: "auto" }}>{inSet.size}</span>}
      </button>
      {open && (
        <div className="atc-pop">
          <p className="eyebrow" style={{ margin: "2px 4px 8px" }}>Collections</p>
          <div className="atc-list">
            {collections.map((c) => (
              <label key={c.id} className="atc-item">
                <input type="checkbox" checked={inSet.has(c.id)} disabled={pending} onChange={() => toggle(c)} />
                <span>{c.name}</span>
              </label>
            ))}
            {!collections.length && <p style={{ fontSize: 12, color: "var(--muted)", margin: 4 }}>No collections yet. Create the first one below.</p>}
          </div>
          <form className="atc-new" onSubmit={(e) => { e.preventDefault(); create(); }}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New collection name" maxLength={120} aria-label="New collection name" />
            <button disabled={pending || !name.trim()}>Create</button>
          </form>
          {msg && <p className="atc-msg" role="status">{msg}</p>}
        </div>
      )}
    </div>
  );
}
