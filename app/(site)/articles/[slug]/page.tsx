import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/public/ArticleCard";
import { Topbar } from "@/components/public/Topbar";
import { getArticle, listArticles, readMinutes } from "@/lib/articles";
import { Markdown } from "@/lib/markdown";
import { formatDate } from "@/lib/utils";

/* eslint-disable @next/next/no-img-element */
type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P) {
  const a = await getArticle((await params).slug);
  return a ? { title: a.title, description: a.excerpt } : { title: "Not found" };
}

export default async function ArticlePage({ params }: P) {
  const a = await getArticle((await params).slug);
  if (!a) notFound();
  const more = (await listArticles({ limit: 4 })).filter((x) => x.id !== a.id).slice(0, 3);
  return (
    <>
      <Topbar crumbs={[{ href: "/", label: "Home" }, { href: "/articles", label: "Articles" }, { label: a.title }]} />
      <article className="article">
        <header data-reveal>
          {a.category && <Link href={`/category/${a.category.slug}`} className="pill">{a.category.name}</Link>}
          <h1>{a.title}</h1>
          {a.excerpt && <p className="article-lead">{a.excerpt}</p>}
          <p className="article-meta">{formatDate(a.published_at ?? a.created_at)} · {readMinutes(a.body)} min read</p>
        </header>
        {a.sites.length > 0 && (
          <div className="article-sites" data-reveal>
            {a.sites.map((s) => (
              <Link key={s.id} href={`/references/${s.slug}`} className="pill">
                {s.favicon_url && <img src={s.favicon_url} alt="" width={14} height={14} style={{ borderRadius: 3 }} />} {s.name}
              </Link>
            ))}
          </div>
        )}
        <div data-reveal><Markdown source={a.body} /></div>
      </article>
      {more.length > 0 && (
        <div className="page">
          <section className="section">
            <div className="section-head"><h2>More Articles</h2></div>
            <div className="grid-articles">{more.map((x) => <ArticleCard key={x.id} a={x} />)}</div>
          </section>
        </div>
      )}
    </>
  );
}
