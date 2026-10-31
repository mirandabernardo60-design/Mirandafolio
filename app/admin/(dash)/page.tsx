import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { formatDate, thumbnailSrc } from "@/lib/utils";

/* eslint-disable @next/next/no-img-element */
export default async function Overview() {
  const { supabase: db } = await requireAdmin();
  const count = async (f?: (q: any) => any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    let q = db.from("sites").select("id", { count: "exact", head: true });
    if (f) q = f(q);
    return (await q).count ?? 0;
  };
  const [total, published, drafts, featured, recent] = await Promise.all([
    count(),
    count((q) => q.eq("status", "published")),
    count((q) => q.eq("status", "draft")),
    count((q) => q.eq("featured", true)),
    db.from("sites").select("id, name, slug, status, created_at, thumbnail_path, thumbnail_url").order("created_at", { ascending: false }).limit(8),
  ]);

  return (
    <>
      <div className="adm-head">
        <h1 className="adm-h1">Overview</h1>
        <Link href="/admin/references/new" className="adm-btn primary" style={{ marginLeft: "auto" }}>+ Add Website</Link>
      </div>
      <div className="adm-stats">
        {[["Total references", total], ["Published", published], ["Drafts", drafts], ["Featured", featured]].map(([l, v]) => (
          <div key={l as string} className="adm-card adm-stat"><span>{l}</span><b>{v}</b></div>
        ))}
      </div>
      <div className="adm-card">
        <div className="adm-head" style={{ marginBottom: 8 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600 }}>Recently added</h2>
          <Link href="/admin/references" className="adm-btn sm" style={{ marginLeft: "auto" }}>View all</Link>
        </div>
        <table className="adm-table">
          <tbody>
            {(recent.data ?? []).map((s) => {
              const src = thumbnailSrc(s);
              return (
                <tr key={s.id}>
                  <td style={{ width: 76 }}>{src ? <img className="adm-thumb" src={src} alt="" /> : <div className="adm-thumb" />}</td>
                  <td><Link href={`/admin/references/${s.id}`} style={{ fontWeight: 500 }}>{s.name}</Link></td>
                  <td><span className={`badge ${s.status === "published" ? "pub" : "draft"}`}>{s.status}</span></td>
                  <td className="hide-m" style={{ color: "var(--muted)" }}>{formatDate(s.created_at)}</td>
                </tr>
              );
            })}
            {!recent.data?.length && <tr><td style={{ color: "var(--muted)" }}>No references yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
