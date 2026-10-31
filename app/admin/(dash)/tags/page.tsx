import { requireAdmin } from "@/lib/auth";
import { NameList } from "@/components/admin/NameList";

export default async function Tags() {
  const { supabase: db } = await requireAdmin();
  const [{ data: tags }, { data: links }] = await Promise.all([
    db.from("tags").select("*").order("name"),
    db.from("site_tags").select("tag_id"),
  ]);
  const count = (id: string) => (links ?? []).filter((l) => l.tag_id === id).length;
  return (
    <>
      <div className="adm-head"><h1 className="adm-h1">Tags</h1></div>
      <NameList kind="tag" items={(tags ?? []).map((t) => ({ ...t, count: count(t.id) }))} />
    </>
  );
}
