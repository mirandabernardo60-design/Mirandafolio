import { requireAdmin } from "@/lib/auth";
import { CollectionsAdmin } from "@/components/admin/CollectionsAdmin";

export default async function AdminCollections() {
  const { supabase: db } = await requireAdmin();
  const [{ data: cols }, { data: sites }] = await Promise.all([
    db.from("collections").select("id, name, slug, description, published, items:collection_sites(position, site:sites(id, name))").order("updated_at", { ascending: false }),
    db.from("sites").select("id, name").order("name"),
  ]);
  type R = { id: string; name: string; slug: string; description: string; published: boolean; items: { position: number; site: { id: string; name: string } | null }[] };
  const collections = ((cols ?? []) as unknown as R[]).map((c) => ({
    ...c, sites: (c.items ?? []).sort((a, b) => a.position - b.position).map((i) => i.site).filter(Boolean) as { id: string; name: string }[],
  }));
  return (
    <>
      <div className="adm-head"><h1 className="adm-h1">Collections</h1></div>
      <CollectionsAdmin collections={collections} allSites={sites ?? []} />
    </>
  );
}
