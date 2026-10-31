import { requireAdmin } from "@/lib/auth";
import { MediaGrid } from "@/components/admin/MediaGrid";

export default async function Media() {
  const { supabase: db } = await requireAdmin();
  // Uploads are stored as <slug>/<uuid>.<ext>: list folders, then files.
  const { data: folders } = await db.storage.from("thumbnails").list("", { limit: 1000 });
  const files: { path: string; size: number; created_at: string }[] = [];
  for (const folder of folders ?? []) {
    if (folder.id) { files.push({ path: folder.name, size: folder.metadata?.size ?? 0, created_at: folder.created_at }); continue; }
    const { data } = await db.storage.from("thumbnails").list(folder.name, { limit: 1000 });
    (data ?? []).forEach((f) => files.push({ path: `${folder.name}/${f.name}`, size: f.metadata?.size ?? 0, created_at: f.created_at }));
  }
  const { data: used } = await db.from("sites").select("id, name, thumbnail_path").not("thumbnail_path", "is", null);
  const usage = Object.fromEntries((used ?? []).map((u) => [u.thumbnail_path, { id: u.id, name: u.name }]));
  return (
    <>
      <div className="adm-head"><h1 className="adm-h1">Media</h1>
        <p style={{ color: "var(--muted)", fontSize: 13, width: "100%" }}>Upload or replace thumbnails from each reference’s edit page. Unused uploads can be removed safely here.</p>
      </div>
      <MediaGrid files={files} usage={usage} base={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/`} />
    </>
  );
}
