"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteArticle, saveArticle } from "@/app/admin/actions";
import { slugify } from "@/lib/utils";
import { toast } from "./Toast";

/* eslint-disable @next/next/no-img-element */
type Site = { id: string; name: string; favicon_url: string | null };
type A = { id: string; title: string; slug: string; excerpt: string; body: string; category_id: string | null; status: "draft" | "published"; site_ids: string[] };

const HELP = "## Heading · **bold** · *italic* · [link](https://…) · - list · 1. list · > quote · ![caption](https://image.jpg) · ---";

export function ArticleForm({ article, categories, sites }: { article?: A; categories: { id: string; name: string }[]; sites: Site[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [slugTouched, setSlugTouched] = useState(Boolean(article));
  const [pick, setPick] = useState("");
  const [f, setF] = useState({
    title: article?.title ?? "", slug: article?.slug ?? "", excerpt: article?.excerpt ?? "", body: article?.body ?? "",
    category_id: article?.category_id ?? "", status: article?.status ?? ("draft" as "draft" | "published"),
    site_ids: article?.site_ids ?? ([] as string[]),
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));
  const words = f.body.trim().split(/\s+/).filter(Boolean).length;
  const err = (k: string) => errors[k] && <span className="adm-err">{errors[k]}</span>;

  function submit(status: "draft" | "published") {
    setErrors({});
    start(async () => {
      const r = await saveArticle(article?.id ?? null, { ...f, slug: slugTouched ? f.slug : "", status });
      if (!r.ok) { setErrors(r.fields ?? {}); toast(r.error, true); return; }
      toast(status === "published" ? "Published" : "Saved as draft");
      if (!article && r.data) router.replace(`/admin/articles/${r.data.id}`); else router.refresh();
    });
  }

  const chosen = f.site_ids.map((id) => sites.find((s) => s.id === id)).filter(Boolean) as Site[];

  return (
    <form className="adm-form" onSubmit={(e) => { e.preventDefault(); submit(f.status); }} noValidate>
      <div className="stack">
        <div className="adm-card stack">
          <label className="adm-label">Title
            <input className="adm-input" value={f.title} aria-invalid={!!errors.title} placeholder="8 Best AI Branding Tools (2026)"
              onChange={(e) => { set("title", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }} />{err("title")}</label>
          <label className="adm-label">Slug
            <input className="adm-input" value={f.slug} onChange={(e) => { setSlugTouched(true); set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-")); }} />
            <span style={{ fontWeight: 400, color: "var(--dim)" }}>/articles/{f.slug || "…"}</span>{err("slug")}</label>
          <label className="adm-label">Summary (shown on the card) <span style={{ fontWeight: 400, color: "var(--dim)" }}>{f.excerpt.length}/300</span>
            <textarea className="adm-textarea" style={{ minHeight: 80 }} maxLength={300} value={f.excerpt} onChange={(e) => set("excerpt", e.target.value)} /></label>
          <label className="adm-label">Article <span style={{ fontWeight: 400, color: "var(--dim)" }}>{words} words · ~{Math.max(1, Math.round(words / 220))} min read</span>
            <textarea className="adm-textarea" style={{ minHeight: 420, fontFamily: "ui-monospace, Menlo, monospace", fontSize: 13 }}
              value={f.body} onChange={(e) => set("body", e.target.value)} placeholder={"Write here. Use ## for section titles.\n\n## Why it stands out\nA paragraph…"} />
            <span style={{ fontWeight: 400, color: "var(--dim)" }}>{HELP}</span>{err("body")}</label>
        </div>
      </div>

      <div className="stack" style={{ position: "sticky", top: 16 }}>
        <div className="adm-card stack">
          <div className="adm-toggle">Status <span className={`badge ${f.status === "published" ? "pub" : "draft"}`}>{f.status}</span></div>
          <button type="button" className="adm-btn primary" disabled={pending} style={{ justifyContent: "center" }} onClick={() => submit("published")}>
            {pending ? "Saving…" : f.status === "published" ? "Save & keep published" : "Publish"}
          </button>
          <button type="button" className="adm-btn" disabled={pending} style={{ justifyContent: "center" }} onClick={() => submit("draft")}>
            {f.status === "published" ? "Unpublish (save as draft)" : "Save as draft"}
          </button>
          {article?.status === "published" && <a className="adm-btn" style={{ justifyContent: "center" }} href={`/articles/${article.slug}`} target="_blank" rel="noreferrer">View article ↗</a>}
        </div>
        <div className="adm-card stack">
          <label className="adm-label">Category
            <select className="adm-select" value={f.category_id} onChange={(e) => set("category_id", e.target.value)}>
              <option value="">— None (shows on home) —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></label>
          <div className="adm-label">Websites in this article <span style={{ fontWeight: 400, color: "var(--dim)" }}>(their icons appear on the card)</span>
            <div className="adm-chips">
              {chosen.map((s) => (
                <span key={s.id} className="adm-chip">
                  {s.favicon_url && <img src={s.favicon_url} alt="" width={14} height={14} style={{ borderRadius: 3 }} />}{s.name}
                  <button type="button" aria-label={`Remove ${s.name}`} onClick={() => set("site_ids", f.site_ids.filter((x) => x !== s.id))}>×</button>
                </span>
              ))}
            </div>
            <select className="adm-select" value={pick} onChange={(e) => { const v = e.target.value; setPick(""); if (v && !f.site_ids.includes(v)) set("site_ids", [...f.site_ids, v]); }}>
              <option value="">+ Add a website…</option>
              {sites.filter((s) => !f.site_ids.includes(s.id)).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
        {article && (
          <button type="button" className="adm-btn danger" disabled={pending} style={{ justifyContent: "center" }}
            onClick={() => confirm(`Delete “${article.title}” permanently?`) && start(async () => {
              const r = await deleteArticle(article.id);
              if (r.ok) { toast("Deleted"); router.replace("/admin/articles"); } else toast(r.error, true);
            })}>Delete article</button>
        )}
      </div>
    </form>
  );
}
