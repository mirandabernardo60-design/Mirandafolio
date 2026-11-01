import Link from "next/link";
import { memberSignOut } from "@/app/auth-actions";
import { getViewer } from "@/lib/viewer";
import { Icon } from "./Icon";
import { MenuButton } from "./MenuButton";

export async function Topbar({ title, crumbs, tabs }: { title?: string; crumbs?: { href?: string; label: string }[]; tabs?: { href: string; label: string; active: boolean }[] }) {
  const { signedIn, isAdmin } = await getViewer();
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
      ) : tabs ? (
        <nav className="top-tabs" aria-label="Sections">
          {tabs.map((t) => <Link key={t.href} href={t.href} aria-current={t.active ? "page" : undefined}>{t.label}</Link>)}
        </nav>
      ) : (
        <h1>{title}</h1>
      )}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
        {signedIn && <Link href="/saved" className="icon-btn hide-sm" aria-label="Saved websites" title="Saved"><Icon name="bookmark" width={15} /></Link>}
        {isAdmin && <Link href="/admin/references/new" className="btn-pill">Add site</Link>}
        {signedIn && (
          <form action={memberSignOut}><button className="btn-ghost" style={{ background: "none", border: 0 }}>Sign out</button></form>
        )}
      </div>
    </header>
  );
}
