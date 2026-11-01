import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/utils";

export default async function AdminArticles() {
  const { supabase: db } = await requireAdmin();
  const { data } = await db.from("articles").select("id, title, slug, status, updated_at, published_at").order("updated_at", { ascending: false });
  const rows = data ?? [];
  return (
    <>
      <div className="adm-head">
        <h1 className="adm-h1">Articles</h1>
        <Link href="/admin/articles/new" className="adm-btn primary" style={{ marginLeft: "auto" }}>+ New article</Link>
      </div>
      <div className="adm-card adm-scroll" style={{ padding: 0 }}>
        <table className="adm-table">
          <thead><tr><th>Title</th><th>Status</th><th className="hide-m">Updated</th><th></th></tr></thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id}>
                <td><Link href={`/admin/articles/${a.id}`} style={{ fontWeight: 500 }}>{a.title}</Link></td>
                <td><span className={`badge ${a.status === "published" ? "pub" : "draft"}`}>{a.status}</span></td>
                <td className="hide-m" style={{ color: "var(--muted)" }}>{formatDate(a.updated_at)}</td>
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  {a.status === "published" && <a className="adm-btn sm" href={`/articles/${a.slug}`} target="_blank" rel="noreferrer">View</a>}{" "}
                  <Link className="adm-btn sm" href={`/admin/articles/${a.id}`}>Edit</Link>
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={4} style={{ color: "var(--muted)", textAlign: "center", padding: 24 }}>No articles yet. Write your first one.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
