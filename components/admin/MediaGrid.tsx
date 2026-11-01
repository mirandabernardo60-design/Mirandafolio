"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteUnusedMedia } from "@/app/admin/actions";
import { toast } from "./Toast";

/* eslint-disable @next/next/no-img-element */
export function MediaGrid({ files, usage, base }: {
  files: { path: string; size: number; created_at: string | null }[];
  usage: Record<string, { id: string; name: string }>;
  base: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const unused = files.filter((f) => !usage[f.path]).map((f) => f.path);
  const remove = (paths: string[]) => start(async () => {
    const r = await deleteUnusedMedia(paths);
    if (r.ok) { toast(`Removed ${r.data?.removed ?? 0} file(s)`); router.refresh(); } else toast(r.error, true);
  });
  return (
    <>
      <div className="adm-toolbar">
        <span style={{ fontSize: 13 }}>{files.length} files · {unused.length} unused</span>
        <button className="adm-btn sm danger" disabled={pending || !unused.length} style={{ marginLeft: "auto" }}
          onClick={() => confirm(`Remove ${unused.length} unused file(s)?`) && remove(unused)}>Remove all unused</button>
      </div>
      <div className="adm-media">
        {files.map((f) => {
          const u = usage[f.path];
          return (
            <div key={f.path} className="adm-card" style={{ padding: 8 }}>
              <a href={base + f.path} target="_blank" rel="noreferrer" className="adm-preview"><img src={base + f.path} alt="" loading="lazy" /></a>
              <div style={{ fontSize: 11.5, marginTop: 8, display: "flex", justifyContent: "space-between", gap: 6, alignItems: "center" }}>
                {u ? <Link href={`/admin/references/${u.id}`} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</Link>
                  : <span className="badge draft">unused</span>}
                <span style={{ color: "var(--dim)" }}>{Math.round(f.size / 1024)} KB</span>
              </div>
              {!u && <button className="adm-btn sm danger" style={{ marginTop: 8, width: "100%", justifyContent: "center" }} disabled={pending} onClick={() => remove([f.path])}>Remove</button>}
            </div>
          );
        })}
        {!files.length && <p style={{ color: "var(--muted)" }}>No uploads yet.</p>}
      </div>
    </>
  );
}
