import Link from "next/link";
import type { CategoryCount, Tag } from "@/lib/types";
import { Icon } from "./Icon";
import { Logo } from "./Logo";
import { OpenSearch } from "./OpenSearch";

export function Footer({ categories, tags }: { categories: CategoryCount[]; tags: Tag[] }) {
  return (
    <footer>
      <div className="footer-hero">
        <h2>Find exactly what<br />you&apos;re looking for</h2>
        <OpenSearch className="footer-search"><Icon name="search" width={12} /> Search websites…</OpenSearch>
      </div>
      <div className="footer">
        <div>
          <Logo size={16} />
          <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 10, maxWidth: 240 }}>
            Miranda is a personal library of website references. All the inspiration, in one place.
          </p>
        </div>
        <div>
          <h4>Categories</h4>
          <ul className="cols2">{categories.map((c) => <li key={c.id}><Link href={`/category/${c.slug}`}>{c.name}</Link></li>)}</ul>
        </div>
        <div>
          <h4>Tags</h4>
          <ul>{tags.slice(0, 10).map((t) => <li key={t.id}><Link href={`/tag/${t.slug}`}>{t.name}</Link></li>)}</ul>
        </div>
        <div>
          <h4>Miranda</h4>
          <ul>
            <li><Link href="/all">All websites</Link></li>
            <li><Link href="/featured">Featured</Link></li>
            <li><Link href="/admin">Admin</Link></li>
          </ul>
        </div>
      </div>
      <p style={{ padding: "0 16px 24px", fontSize: 11, color: "var(--dim)" }}>© {new Date().getFullYear()} Miranda</p>
    </footer>
  );
}
