import { CollectionCard } from "@/components/public/CollectionCard";
import { CollectionsBar } from "@/components/public/CollectionsBar";
import { Topbar } from "@/components/public/Topbar";
import { listCollections } from "@/lib/queries";

export const metadata = { title: "Collections" };

export default async function Collections({ searchParams }: { searchParams: Promise<{ q?: string; sort?: string }> }) {
  const sp = await searchParams;
  const sort = sp.sort === "name" || sp.sort === "size" ? sp.sort : "latest";
  let cols = await listCollections({ sort });
  const q = sp.q?.trim().toLowerCase();
  if (q) cols = cols.filter((c) => `${c.name} ${c.description}`.toLowerCase().includes(q));
  return (
    <>
      <Topbar title="Collections" />
      <CollectionsBar count={cols.length} />
      <div className="page">
        {cols.length
          ? <div className="grid-articles">{cols.map((c) => <CollectionCard key={c.id} c={c} />)}</div>
          : <p className="empty">{q ? "No collections match your search." : "No collections yet."}</p>}
      </div>
    </>
  );
}
