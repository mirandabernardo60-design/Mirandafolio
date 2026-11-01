import { notFound } from "next/navigation";
import { SiteCard } from "@/components/public/Cards";
import { Topbar } from "@/components/public/Topbar";
import { getCollection, listSites } from "@/lib/queries";

type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P) {
  const c = await getCollection((await params).slug);
  return c ? { title: c.name, description: c.description } : { title: "Not found" };
}

export default async function CollectionPage({ params }: P) {
  const c = await getCollection((await params).slug);
  if (!c) notFound();
  const sites = await listSites({ collection: c.id, sort: "custom" });
  return (
    <>
      <Topbar crumbs={[{ href: "/", label: "Home" }, { href: "/collections", label: "Collections" }, { label: c.name }]} />
      <div className="page">
        <header className="col-head" data-reveal>
          <h1>{c.name}</h1>
          {c.description && <p>{c.description}</p>}
          <span>{sites.length} {sites.length === 1 ? "website" : "websites"}</span>
        </header>
        {sites.length
          ? <div className="grid-cards">{sites.map((s) => <SiteCard key={s.id} site={s} />)}</div>
          : <p className="empty">This collection is empty.</p>}
      </div>
    </>
  );
}
