import { requireAdmin } from "@/lib/auth";
import { NameList } from "@/components/admin/NameList";

export default async function Categories() {
  const { supabase: db } = await requireAdmin();
  const [{ data: cats }, { data: sites }] = await Promise.all([
    db.from("categories").select("*").order("position").order("name"),
    db.from("sites").select("category_id"),
  ]);
  const count = (id: string) => (sites ?? []).filter((s) => s.category_id === id).length;
  return (
    <>
      <div className="adm-head"><h1 className="adm-h1">Categories</h1></div>
      <NameList kind="category" items={(cats ?? []).map((c) => ({ ...c, count: count(c.id) }))} />
    </>
  );
}
