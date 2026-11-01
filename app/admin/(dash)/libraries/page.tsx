import { requireAdmin } from "@/lib/auth";
import { LibrariesAdmin } from "@/components/admin/LibrariesAdmin";

export default async function AdminLibraries() {
  const { supabase: db } = await requireAdmin();
  const [{ data: libs }, { data: links }] = await Promise.all([
    db.from("libraries").select("*").order("position").order("name"),
    db.from("site_libraries").select("library_id"),
  ]);
  const count = (id: string) => (links ?? []).filter((l) => l.library_id === id).length;
  return (
    <>
      <div className="adm-head"><h1 className="adm-h1">Libraries</h1>
        <p style={{ color: "var(--muted)", fontSize: 13, width: "100%", margin: 0 }}>What websites are built with (Framer, Webflow, Shopify…). They appear in the sidebar under “Libraries”. Assign them on each website’s edit page.</p>
      </div>
      <LibrariesAdmin items={(libs ?? []).map((l) => ({ ...l, count: count(l.id) }))} />
    </>
  );
}
