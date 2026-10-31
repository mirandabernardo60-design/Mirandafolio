"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteCategory, deleteTag, saveCategory, saveTag } from "@/app/admin/actions";
import { CATEGORY_ICONS, Icon } from "@/components/public/Icon";
import { toast } from "./Toast";

type Item = { id: string; name: string; slug: string; icon?: string; position?: number; count: number };

/** Shared CRUD list for categories and tags. */
export function NameList({ kind, items }: { kind: "category" | "tag"; items: Item[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState<string | null>(null);
  const save = kind === "category" ? saveCategory : saveTag;
  const del = kind === "category" ? deleteCategory : deleteTag;
  const publicBase = kind === "category" ? "/category" : "/tag";

  const submit = (id: string | null) => (fd: FormData) =>
    start(async () => {
      const r = await save(id, fd);
      if (r.ok) { toast(id ? "Saved" : "Created"); setEditing(null); router.refresh(); } else toast(r.error, true);
    });

  const Fields = ({ item }: { item?: Item }) => (
    <>
      <input className="adm-input" name="name" placeholder={`New ${kind} name`} defaultValue={item?.name} required maxLength={kind === "tag" ? 40 : 60} style={{ flex: 1, minWidth: 160 }} />
      {kind === "category" && (
        <>
          <select className="adm-select" name="icon" defaultValue={item?.icon ?? "grid"} style={{ width: 130 }} aria-label="Icon">
            {CATEGORY_ICONS.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
          <input className="adm-input" name="position" type="number" defaultValue={item?.position ?? items.length + 1} style={{ width: 80 }} aria-label="Order" />
        </>
      )}
    </>
  );

  return (
    <>
      <form action={submit(null)} className="adm-card" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <Fields />
        <button className="adm-btn primary" disabled={pending}>Create {kind}</button>
      </form>
      <div className="adm-card adm-scroll" style={{ padding: 0 }}>
        <table className="adm-table">
          <thead><tr><th>Name</th><th className="hide-m">Slug</th><th>Websites</th><th></th></tr></thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id}>
                {editing === it.id ? (
                  <td colSpan={4}>
                    <form action={submit(it.id)} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Fields item={it} />
                      <button className="adm-btn primary sm" disabled={pending}>Save</button>
                      <button type="button" className="adm-btn sm" onClick={() => setEditing(null)}>Cancel</button>
                    </form>
                  </td>
                ) : (
                  <>
                    <td style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {it.icon && <Icon name={it.icon} width={14} />} <b style={{ fontWeight: 500 }}>{it.name}</b>
                    </td>
                    <td className="hide-m" style={{ color: "var(--muted)" }}>{it.slug}</td>
                    <td>
                      <Link href={`/admin/references?${kind}=${it.id}`} style={{ color: "var(--muted)" }}>{it.count}</Link>
                    </td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <a className="adm-btn sm" href={`${publicBase}/${it.slug}`} target="_blank" rel="noreferrer">View</a>{" "}
                      <button className="adm-btn sm" onClick={() => setEditing(it.id)}>Rename</button>{" "}
                      <button className="adm-btn sm danger" disabled={pending}
                        onClick={() => confirm(`Delete ${kind} “${it.name}”? ${it.count} website(s) will lose it (they are not deleted).`) &&
                          start(async () => { const r = await del(it.id); if (r.ok) { toast("Deleted"); router.refresh(); } else toast(r.error, true); })}>
                        Delete
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {!items.length && <tr><td colSpan={4} style={{ color: "var(--muted)", textAlign: "center", padding: 24 }}>Nothing here yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
