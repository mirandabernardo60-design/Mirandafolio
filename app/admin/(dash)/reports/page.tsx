import { requireAdmin } from "@/lib/auth";
import { ReportsTable } from "@/components/admin/ReportsTable";

export default async function AdminReports() {
  const { supabase: db } = await requireAdmin();
  const { data } = await db.from("reports")
    .select("id, reason, message, status, created_at, site:sites(id, name, slug, url)")
    .order("status").order("created_at", { ascending: false });
  const rows = (data ?? []) as never[];
  const open = (data ?? []).filter((r) => r.status === "open").length;
  return (
    <>
      <div className="adm-head"><h1 className="adm-h1">Reports</h1><span className="badge draft">{open} open</span></div>
      <ReportsTable reports={rows} />
    </>
  );
}
