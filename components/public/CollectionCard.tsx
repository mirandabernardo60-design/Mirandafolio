import Link from "next/link";
import type { CollectionCard as C } from "@/lib/queries";

/* eslint-disable @next/next/no-img-element */
export function CollectionCard({ c }: { c: C }) {
  return (
    <Link href={`/collections/${c.slug}`} className="ccard" data-reveal>
      <div className="acard-icons">
        {c.icons.map((s, i) => (
          <span key={i} className="acard-icon" title={s.name}>
            {s.favicon_url ? <img src={s.favicon_url} alt="" loading="lazy" /> : s.name.slice(0, 1)}
          </span>
        ))}
      </div>
      <h3>{c.name}</h3>
      {c.description && <p>{c.description}</p>}
      <span className="ccard-count">{c.site_count} {c.site_count === 1 ? "website" : "websites"}</span>
    </Link>
  );
}
