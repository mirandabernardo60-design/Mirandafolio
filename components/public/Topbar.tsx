import Link from "next/link";
import { memberSignOut } from "@/app/auth-actions";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { Icon } from "./Icon";
import { MenuButton } from "./MenuButton";

async function viewer() {
  if (!hasSupabaseEnv()) return { signedIn: false, isAdmin: false };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { signedIn: false, isAdmin: false };
  const { data } = await supabase.rpc("is_admin");
  return { signedIn: true, isAdmin: Boolean(data) };
}

export async function Topbar({ title, crumbs }: { title?: string; crumbs?: { href?: string; label: string }[] }) {
  const { signedIn, isAdmin } = await viewer();
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
        {isAdmin && <Link href="/admin/references/new" className="btn-pill">Add site</Link>}
        {signedIn && (
          <form action={memberSignOut}><button className="btn-ghost" style={{ background: "none", border: 0 }}>Sign out</button></form>
        )}
      </div>
    </header>
  );
}
