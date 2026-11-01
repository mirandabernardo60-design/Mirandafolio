"use client";
import { createContext, useCallback, useContext, useState, useTransition } from "react";
import { toggleBookmark } from "@/app/member-actions";
import { Icon } from "./Icon";

type Ctx = { has: (id: string) => boolean; toggle: (id: string) => void; pending: boolean; error: string | null };
const BookmarkCtx = createContext<Ctx | null>(null);

/** Holds the signed-in visitor's saved website ids for the whole site. */
export function BookmarksProvider({ initial, children }: { initial: string[]; children: React.ReactNode }) {
  const [ids, setIds] = useState(() => new Set(initial));
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const has = useCallback((id: string) => ids.has(id), [ids]);
  const toggle = useCallback((id: string) => {
    const save = !ids.has(id);
    setIds((prev) => { const n = new Set(prev); if (save) n.add(id); else n.delete(id); return n; });
    start(async () => {
      const r = await toggleBookmark(id, save);
      if (!r.ok) {
        setError(r.error);
        setIds((prev) => { const n = new Set(prev); if (save) n.delete(id); else n.add(id); return n; });
        setTimeout(() => setError(null), 3000);
      }
    });
  }, [ids]);
  return (
    <BookmarkCtx.Provider value={{ has, toggle, pending, error }}>
      {children}
      {error && <div className="bm-toast" role="status">{error}</div>}
    </BookmarkCtx.Provider>
  );
}

/** Bookmark icon button. `variant="row"` renders a labelled row for the website page sidebar. */
export function BookmarkButton({ siteId, name, variant = "icon" }: { siteId: string; name: string; variant?: "icon" | "row" }) {
  const ctx = useContext(BookmarkCtx);
  if (!ctx) return null;
  const on = ctx.has(siteId);
  const label = on ? `Remove ${name} from saved` : `Save ${name}`;
  if (variant === "row") {
    return (
      <button className="row bm-row" aria-pressed={on} onClick={() => ctx.toggle(siteId)}>
        <Icon name="bookmark" width={14} style={on ? { fill: "currentColor" } : undefined} /> {on ? "Saved" : "Save website"}
      </button>
    );
  }
  return (
    <button className="card-ext bm-btn" data-on={on} aria-pressed={on} aria-label={label} title={on ? "Saved" : "Save"}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); ctx.toggle(siteId); }}>
      <Icon name="bookmark" width={16} style={on ? { fill: "currentColor" } : undefined} />
    </button>
  );
}
