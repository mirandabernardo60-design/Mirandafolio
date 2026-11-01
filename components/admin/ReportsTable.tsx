"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteReport, setReportStatus } from "@/app/admin/actions";
import { formatDate } from "@/lib/utils";
import { toast } from "./Toast";

type R = { id: string; reason: string; message: string; status: "open" | "resolved"; created_at: string; site: { id: string; name: string; slug: string; url: string } | null };
const LABEL: Record<string, string> = { "broken-link": "Broken link / site down", "wrong-info": "Wrong or outdated info", inappropriate: "Inappropriate / spam", other: "Other" };

export function ReportsTable({ reports }: { reports: R[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, msg: string) =>
    start(async () => { const r = await fn(); if (r.ok) { toast(msg); router.refresh(); } else toast(r.error ?? "Failed", true); });
  return (
    <div className="adm-card adm-scroll" style={{ padding: 0 }}>
      <table className="adm-table">
        <thead><tr><th>Website</th><th>Problem</th><th className="hide-m">Received</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {reports.map((r) => (
            <tr key={r.id}>
              <td>{r.site ? <><Link href={`/admin/references/${r.site.id}`} style={{ fontWeight: 500 }}>{r.site.name}</Link>
                <div><a href={r.site.url} target="_blank" rel="noreferrer" style={{ fontSize: 11.5, color: "var(--muted)" }}>{r.site.url.replace(/^https?:\/\//, "")} ↗</a></div></> : "—"}</td>
              <td><div>{LABEL[r.reason] ?? r.reason}</div>{r.message && <div style={{ color: "var(--muted)", fontSize: 12.5, maxWidth: 420, whiteSpace: "pre-wrap" }}>{r.message}</div>}</td>
              <td className="hide-m" style={{ color: "var(--muted)", whiteSpace: "nowrap" }}>{formatDate(r.created_at)}</td>
              <td><span className={`badge ${r.status === "open" ? "draft" : "pub"}`}>{r.status}</span></td>
              <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                <button className="adm-btn sm" disabled={pending}
                  onClick={() => run(() => setReportStatus(r.id, r.status === "open" ? "resolved" : "open"), r.status === "open" ? "Marked resolved" : "Reopened")}>
                  {r.status === "open" ? "Mark resolved" : "Reopen"}
                </button>{" "}
                <button className="adm-btn sm danger" disabled={pending} onClick={() => confirm("Delete this report?") && run(() => deleteReport(r.id), "Deleted")}>Delete</button>
              </td>
            </tr>
          ))}
          {!reports.length && <tr><td colSpan={5} style={{ color: "var(--muted)", textAlign: "center", padding: 24 }}>No reports. Visitors can send them from any website page.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
