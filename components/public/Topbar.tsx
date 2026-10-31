import Link from "next/link";
import { Icon } from "./Icon";
import { MenuButton } from "./MenuButton";

export function Topbar({ title, crumbs }: { title?: string; crumbs?: { href?: string; label: string }[] }) {
  return (
    <header className="topbar">
      <MenuButton />
      {crumbs ? (
        <nav className="crumbs" aria-label="Breadcrumb">
          {crumbs.map((c, i) => (
            <span key={i} style={{ display: "contents" }}>
              {i > 0 && <em style={{ color: "var(--dim)", fontStyle: "normal" }}>/</em>}
              {c.href ? <Link href={c.href}>{c.label}</Link> : <span>{c.label}</span>}
            </span>
          ))}
        </nav>
      ) : (
        <h1>{title}</h1>
      )}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
        <Link href="/featured" className="icon-btn hide-sm" aria-label="Featured"><Icon name="bookmark" width={15} /></Link>
        <Link href="/admin/references/new" className="btn-pill">Add site</Link>
      </div>
    </header>
  );
}
