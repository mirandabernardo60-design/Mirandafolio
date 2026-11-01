import { requireAdmin } from "@/lib/auth";
import { ArticleForm } from "@/components/admin/ArticleForm";

export default async function NewArticle() {
  const { supabase: db } = await requireAdmin();
  const [{ data: categories }, { data: sites }] = await Promise.all([
    db.from("categories").select("id, name").order("position").order("name"),
    db.from("sites").select("id, name, favicon_url").order("name"),
  ]);
  return (
    <>
      <div className="adm-head"><h1 className="adm-h1">New article</h1></div>
      <ArticleForm categories={categories ?? []} sites={sites ?? []} />
    </>
  );
}
