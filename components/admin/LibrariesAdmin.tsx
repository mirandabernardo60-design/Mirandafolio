"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteLibrary, saveLibrary } from "@/app/admin/actions";
import { toast } from "./Toast";

/* eslint-disable @next/next/no-img-element */
type L = { id: string; name: string; slug: string; icon_url: string | null; position: number; count: number };

export function LibrariesAdmin({ items }: { items: L[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState<string | null>(null);
  const submit = (id: string | null) => (fd: FormData) => start(async () => {
    const r = await saveLibrary(id, fd);
    if (r.ok) { toast(id ? "Saved" : "Created"); setEditing(null); router.refresh(); } else toast(r.error, true);
  });
  const Fields = ({ l }: { l?: L }) => (
    <>
      <input className="adm-input" name="name" placeholder="Framer" defaultValue={l?.name} required maxLength={60} style={{ flex: 1, minWidth: 140 }} />
      <input className="adm-input" name="icon_url" placeholder="Icon URL (optional)" defaultValue={l?.icon_url ?? ""} style={{ flex: 2, minWidth: 180 }} />
      <input className="adm-input" name="position" type="number" defaultValue={l?.position ?? items.length + 1} style={{ width: 80 }} aria-label="Order" />
    </>
  );
  return (
    <>
      <form action={submit(null)} className="adm-card" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <Fields /><button className="adm-btn primary" disabled={pending}>Create library</button>
      </form>
      <div className="adm-card adm-scroll" style={{ padding: 0 }}>
        <table className="adm-table">
          <thead><tr><th>Library</th><th>Websites</th><th></th></tr></thead>
          <tbody>
            {items.map((l) => (
              <tr key={l.id}>
                {editing === l.id ? (
                  <td colSpan={3}><form action={submit(l.id)} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Fields l={l} /><button className="adm-btn primary sm">Save</button>
                    <button type="button" className="adm-btn sm" onClick={() => setEditing(null)}>Cancel</button>
                  </form></td>
                ) : (
                  <>
                    <td style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {l.icon_url ? <img src={l.icon_url} alt="" width={18} height={18} style={{ borderRadius: 4 }} /> : <span className="lib-dot">{l.name[0]}</span>}
                      <b style={{ fontWeight: 500 }}>{l.name}</b>
                    </td>
                    <td style={{ color: "var(--muted)" }}>{l.count}</td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <a className="adm-btn sm" href={`/library/${l.slug}`} target="_blank" rel="noreferrer">View</a>{" "}
                      <button className="adm-btn sm" onClick={() => setEditing(l.id)}>Edit</button>{" "}
                      <button className="adm-btn sm danger" disabled={pending}
                        onClick={() => confirm(`Delete library “${l.name}”? Websites are kept.`) && start(async () => { const r = await deleteLibrary(l.id); if (r.ok) { toast("Deleted"); router.refresh(); } else toast(r.error, true); })}>Delete</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {!items.length && <tr><td colSpan={3} style={{ color: "var(--muted)", textAlign: "center", padding: 24 }}>No libraries yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
