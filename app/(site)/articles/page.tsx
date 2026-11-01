import { ArticleCard } from "@/components/public/ArticleCard";
import { Topbar } from "@/components/public/Topbar";
import { listArticles } from "@/lib/articles";

export const metadata = { title: "Articles" };

export default async function Articles() {
  const articles = await listArticles();
  return (
    <>
      <Topbar title="Articles" />
      <div className="page">
        <section className="section">
          <div className="section-head"><h2>All Articles</h2></div>
          {articles.length
            ? <div className="grid-articles">{articles.map((a) => <ArticleCard key={a.id} a={a} />)}</div>
            : <p className="empty">No articles yet.</p>}
        </section>
      </div>
    </>
  );
}
