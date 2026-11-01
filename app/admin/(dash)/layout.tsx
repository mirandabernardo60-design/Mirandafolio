import Link from "next/link";
import { Icon } from "@/components/public/Icon";
import { Logo } from "@/components/public/Logo";
import { requireAdmin } from "@/lib/auth";
import { signOut } from "../actions";
import { Toaster } from "@/components/admin/Toast";

export const dynamic = "force-dynamic";

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();
  return (
    <div className="adm">
      <aside className="adm-side">
        <Link href="/admin" className="logo"><Logo size={16} /></Link>
        <nav>
          <Link className="nav-item" href="/admin"><Icon name="compass" /> Overview</Link>
          <Link className="nav-item" href="/admin/references"><Icon name="layers" /> References</Link>
          <Link className="nav-item" href="/admin/references/new"><Icon name="plus" /> Add website</Link>
          <Link className="nav-item" href="/admin/articles"><Icon name="file" /> Articles</Link>
          <Link className="nav-item" href="/admin/collections"><Icon name="folders" /> Collections</Link>
          <Link className="nav-item" href="/admin/libraries"><Icon name="layers" /> Libraries</Link>
          <Link className="nav-item" href="/admin/categories"><Icon name="grid" /> Categories</Link>
          <Link className="nav-item" href="/admin/tags"><Icon name="tag" /> Tags</Link>
          <Link className="nav-item" href="/admin/reports"><Icon name="flag" /> Reports</Link>
          <Link className="nav-item" href="/admin/media"><Icon name="camera" /> Media</Link>
          <Link className="nav-item" href="/" target="_blank"><Icon name="external" /> View site</Link>
        </nav>
        <div className="grow" style={{ flex: 1 }} />
        <div className="grow" style={{ fontSize: 11, color: "var(--dim)", padding: "0 8px 8px", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</div>
        <form action={signOut}><button className="nav-item" style={{ background: "none", border: 0, width: "100%" }}><Icon name="collapse" /> Sign out</button></form>
      </aside>
      <main className="adm-main">{children}</main>
      <Toaster />
    </div>
  );
}
