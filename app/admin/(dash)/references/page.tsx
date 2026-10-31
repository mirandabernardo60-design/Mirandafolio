import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { RefTable } from "@/components/admin/RefTable";

export default async function References({ searchParams }: { searchParams: Promise<{ category?: string; tag?: string }> }) {
  const sp = await searchParams;
  const { supabase: db } = await requireAdmin();
  const [{ data: sites }, { data: categories }] = await Promise.all([
    db.from("sites")
      .select("id, name, slug, url, status, featured, position, created_at, updated_at, category_id, short_description, design_style, thumbnail_path, thumbnail_url, site_tags(tags(name))")
      .order("position").order("created_at", { ascending: false }),
    db.from("categories").select("id, name").order("position").order("name"),
  ]);
  return (
    <>
      <div className="adm-head">
        <h1 className="adm-h1">References</h1>
        <Link href="/admin/references/new" className="adm-btn primary" style={{ marginLeft: "auto" }}>+ Add Website</Link>
      </div>
      <RefTable sites={(sites ?? []) as never} categories={categories ?? []} initialCategory={sp.category ?? ""}
        initialQuery={sp.tag ? ((await db.from("tags").select("name").eq("id", sp.tag).maybeSingle()).data?.name ?? "") : ""} />
    </>
  );
}
