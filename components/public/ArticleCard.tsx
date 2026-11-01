import Link from "next/link";
import type { ArticleFull } from "@/lib/types";
import { readMinutes } from "@/lib/articles";
import { formatDate } from "@/lib/utils";

/* eslint-disable @next/next/no-img-element */
export function ArticleCard({ a }: { a: ArticleFull }) {
  const icons = a.sites.slice(0, 7);
  const extra = a.sites.length - icons.length;
  return (
    <Link href={`/articles/${a.slug}`} className="acard" data-reveal>
      <div className="acard-icons">
        {icons.length ? icons.map((s) => (
          <span key={s.id} className="acard-icon" title={s.name}>
            {s.favicon_url ? <img src={s.favicon_url} alt="" loading="lazy" /> : s.name.slice(0, 1)}
          </span>
        )) : <span className="acard-icon acard-icon--doc" aria-hidden="true">✦</span>}
        {extra > 0 && <span className="acard-more">+{extra}</span>}
      </div>
      <h3>{a.title}</h3>
      {a.excerpt && <p>{a.excerpt}</p>}
      <div className="acard-foot">
        <span>{formatDate(a.published_at ?? a.created_at)}</span>
        <span>{readMinutes(a.body)} min read</span>
      </div>
    </Link>
  );
}
