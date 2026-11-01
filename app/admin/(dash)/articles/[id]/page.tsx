import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { ArticleForm } from "@/components/admin/ArticleForm";

export default async function EditArticle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase: db } = await requireAdmin();
  const [{ data: article }, { data: categories }, { data: sites }] = await Promise.all([
    db.from("articles").select("*, article_sites(site_id, position)").eq("id", id).maybeSingle(),
    db.from("categories").select("id, name").order("position").order("name"),
    db.from("sites").select("id, name, favicon_url").order("name"),
  ]);
  if (!article) notFound();
  const site_ids = ((article.article_sites ?? []) as { site_id: string; position: number }[])
    .sort((a, b) => a.position - b.position).map((s) => s.site_id);
  return (
    <>
      <div className="adm-head"><h1 className="adm-h1">Edit article</h1></div>
      <ArticleForm key={article.updated_at} article={{ ...article, site_ids }} categories={categories ?? []} sites={sites ?? []} />
    </>
  );
}
