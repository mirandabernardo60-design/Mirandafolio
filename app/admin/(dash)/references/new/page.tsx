import { requireAdmin } from "@/lib/auth";
import { RefForm } from "@/components/admin/RefForm";

export default async function NewReference() {
  const { supabase: db } = await requireAdmin();
  const [{ data: categories }, { data: tags }, { data: libraries }] = await Promise.all([
    db.from("categories").select("id, name").order("position").order("name"),
    db.from("tags").select("name").order("name"),
    db.from("libraries").select("id, name").order("position").order("name"),
  ]);
  return (
    <>
      <div className="adm-head"><h1 className="adm-h1">Add website</h1></div>
      <RefForm categories={categories ?? []} allTags={(tags ?? []).map((t) => t.name)} libraries={libraries ?? []} />
    </>
  );
}
