import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { RefForm } from "@/components/admin/RefForm";

export default async function EditReference({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase: db } = await requireAdmin();
  const [{ data: site }, { data: categories }, { data: tags }, { data: libraries }] = await Promise.all([
    db.from("sites").select("*, site_tags(tags(name)), site_libraries(library_id)").eq("id", id).maybeSingle(),
    db.from("categories").select("id, name").order("position").order("name"),
    db.from("tags").select("name").order("name"),
    db.from("libraries").select("id, name").order("position").order("name"),
  ]);
  if (!site) notFound();
  return (
    <>
      <div className="adm-head"><h1 className="adm-h1">Edit “{site.name}”</h1></div>
      <RefForm
        key={site.updated_at}
        site={{ ...site, tags: (site.site_tags as { tags: { name: string } | null }[]).map((t) => t.tags?.name).filter(Boolean) as string[],
          library_ids: ((site.site_libraries ?? []) as { library_id: string }[]).map((l) => l.library_id) }}
        categories={categories ?? []}
        allTags={(tags ?? []).map((t) => t.name)}
        libraries={libraries ?? []}
      />
    </>
  );
}
