"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { captureScreenshot, deleteSites, fetchSiteMetadata, saveSite } from "@/app/admin/actions";
import type { Site } from "@/lib/types";
import { slugify, thumbnailSrc } from "@/lib/utils";
import { toast } from "./Toast";

type Props = {
  site?: Site & { tags: string[] };
  categories: { id: string; name: string }[];
  allTags: string[];
};

/* eslint-disable @next/next/no-img-element */
export function RefForm({ site, categories, allTags }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [fetching, setFetching] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [slugTouched, setSlugTouched] = useState(Boolean(site));
  const [shooting, setShooting] = useState(false);
  const [newShot, setNewShot] = useState(false); // a fresh screenshot that must be stored on save
  const lastShotFor = useRef(site?.url ?? "");
  const [tagInput, setTagInput] = useState("");
  const [newCat, setNewCat] = useState(false);

  const [f, setF] = useState({
    name: site?.name ?? "",
    slug: site?.slug ?? "",
    url: site?.url ?? "",
    canonical_url: site?.canonical_url ?? "",
    short_description: site?.short_description ?? "",
    description: site?.description ?? "",
    thumbnail_url: site?.thumbnail_url ?? "",
    favicon_url: site?.favicon_url ?? "",
    category_id: site?.category_id ?? "",
    design_style: site?.design_style ?? "",
    featured: site?.featured ?? false,
    status: site?.status ?? ("draft" as "draft" | "published"),
    position: site?.position ?? 0,
    tags: site?.tags ?? ([] as string[]),
    new_category: "",
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!slugTouched) set("slug", f.name ? slugify(f.name) : "");
  }, [f.name, slugTouched]);

  const storedSrc = site && !newShot ? thumbnailSrc({ thumbnail_path: site.thumbnail_path, thumbnail_url: null }) : null;
  const preview = storedSrc ?? (f.thumbnail_url || null);

  /** Takes a live screenshot of the site and fills in its details. */
  async function capture(url: string, quiet = false) {
    lastShotFor.current = url;
    setShooting(true);
    setFetching(true);
    const [shot, meta] = await Promise.all([captureScreenshot(url), fetchSiteMetadata(url)]);
    if (lastShotFor.current !== url) return; // the URL changed meanwhile
    setShooting(false);
    setFetching(false);
    const m = meta.ok ? meta.data : undefined;
    const img = shot.ok ? shot.data?.url : m?.image ?? null;
    setF((p) => ({
      ...p,
      name: p.name || (m?.title ?? "").split(/\s[|–—-]\s/)[0].slice(0, 120),
      short_description: p.short_description || (m?.description ?? "").slice(0, 160),
      description: p.description || (m?.description ?? ""),
      thumbnail_url: img || p.thumbnail_url,
      favicon_url: m?.favicon || p.favicon_url,
      canonical_url: m?.canonical || p.canonical_url,
    }));
    if (img) setNewShot(true);
    if (!img) toast("Couldn't capture a preview of this site. Check the link or try again.", true);
    else if (!quiet) toast("Preview updated");
  }

  // Screenshot appears automatically as soon as a valid link is pasted/typed.
  useEffect(() => {
    const url = f.url.trim();
    if (!/^https?:\/\/[^\s/]+\.[^\s]{2,}/i.test(url) || url === lastShotFor.current) return;
    const t = setTimeout(() => capture(url, true), 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.url]);

  function addTag(raw: string) {
    const t = raw.trim().replace(/,$/, "");
    if (t && !f.tags.some((x) => x.toLowerCase() === t.toLowerCase())) set("tags", [...f.tags, t]);
    setTagInput("");
  }

  function submit(status: "draft" | "published") {
    setErrors({});
    if (newCat && !f.new_category.trim()) { setErrors({ new_category: "Type a name for the new category" }); return; }
    const fd = new FormData();
    fd.set("payload", JSON.stringify({ ...f, status }));
    if (newShot) fd.set("persistScreenshot", "1");
    start(async () => {
      const r = await saveSite(site?.id ?? null, fd);
      if (!r.ok) { setErrors(r.fields ?? {}); toast(r.error, true); return; }
      toast(status === "published" ? "Published" : "Saved as draft");
      setNewShot(false);
      if (!site && r.data) router.replace(`/admin/references/${r.data.id}`);
      else router.refresh();
    });
  }

  const err = (k: string) => errors[k] && <span className="adm-err">{errors[k]}</span>;

  return (
    <form className="adm-form" onSubmit={(e) => { e.preventDefault(); submit(f.status); }} noValidate>
      <div className="stack">
        <div className="adm-card stack">
          <label className="adm-label">Website URL
            <div style={{ display: "flex", gap: 8 }}>
              <input className="adm-input" name="url" type="url" placeholder="https://example.com" value={f.url} aria-invalid={!!errors.url}
                onChange={(e) => set("url", e.target.value)} onBlur={() => { if (f.url && !/^https?:\/\//i.test(f.url)) set("url", `https://${f.url}`); }} />
              {fetching && <span style={{ alignSelf: "center", fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap" }}>Loading site…</span>}
            </div>
            {err("url")}
          </label>
          <div className="adm-row2">
            <label className="adm-label">Name<input className="adm-input" name="name" value={f.name} aria-invalid={!!errors.name} onChange={(e) => set("name", e.target.value)} />{err("name")}</label>
            <label className="adm-label">Slug<input className="adm-input" name="slug" value={f.slug} aria-invalid={!!errors.slug}
              onChange={(e) => { setSlugTouched(true); set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-")); }} />
              <span style={{ fontWeight: 400, color: "var(--dim)" }}>/references/{f.slug || "…"}</span>{err("slug")}</label>
          </div>
          <label className="adm-label">Short description <span style={{ fontWeight: 400, color: "var(--dim)" }}>{f.short_description.length}/160</span>
            <input className="adm-input" name="short_description" maxLength={160} value={f.short_description} onChange={(e) => set("short_description", e.target.value)} />{err("short_description")}</label>
          <label className="adm-label">Full description (optional)
            <textarea className="adm-textarea" name="description" value={f.description} onChange={(e) => set("description", e.target.value)} />{err("description")}</label>
        </div>

        <div className="adm-card stack">
          <div className="adm-row2">
            <label className="adm-label">Category
              <select className="adm-select" name="category_id" value={newCat ? "__new" : f.category_id}
                onChange={(e) => {
                  if (e.target.value === "__new") { setNewCat(true); set("category_id", ""); }
                  else { setNewCat(false); set("new_category", ""); set("category_id", e.target.value); }
                }}>
                <option value="">— None —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                <option value="__new">+ New category…</option>
              </select>
              {newCat && (
                <input className="adm-input" autoFocus placeholder="New category name" maxLength={60} value={f.new_category}
                  aria-invalid={!!errors.new_category} onChange={(e) => set("new_category", e.target.value)} />
              )}
              {err("new_category")}
              <Link href="/admin/categories" style={{ fontWeight: 400, color: "var(--muted)" }}>Manage categories →</Link>
            </label>
            <label className="adm-label">Design style
              <input className="adm-input" name="design_style" placeholder="e.g. Minimal, Brutalist, 3D" value={f.design_style} onChange={(e) => set("design_style", e.target.value)} /></label>
          </div>
          <div className="adm-label">Tags
            <div className="adm-chips">
              {f.tags.map((t) => (
                <span key={t} className="adm-chip">{t}<button type="button" aria-label={`Remove ${t}`} onClick={() => set("tags", f.tags.filter((x) => x !== t))}>×</button></span>
              ))}
            </div>
            <input className="adm-input" list="tag-suggestions" placeholder="Pick a tag or type a new one, then Enter" value={tagInput}
              onChange={(e) => { if (e.target.value.endsWith(",")) addTag(e.target.value); else setTagInput(e.target.value); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(tagInput); } }} onBlur={() => tagInput && addTag(tagInput)} />
            <datalist id="tag-suggestions">{allTags.filter((t) => !f.tags.includes(t)).map((t) => <option key={t} value={t} />)}</datalist>
          </div>
          <div className="adm-row2">
            <label className="adm-label">Canonical URL<input className="adm-input" value={f.canonical_url} onChange={(e) => set("canonical_url", e.target.value)} />{err("canonical_url")}</label>
            <label className="adm-label">Favicon URL<input className="adm-input" value={f.favicon_url} onChange={(e) => set("favicon_url", e.target.value)} />{err("favicon_url")}</label>
          </div>
        </div>
      </div>

      <div className="stack" style={{ position: "sticky", top: 16 }}>
        <div className="adm-card stack">
          <div className="adm-toggle">Status
            <span className={`badge ${f.status === "published" ? "pub" : "draft"}`}>{f.status}</span>
          </div>
          <div className="adm-toggle">Featured
            <button type="button" role="switch" aria-checked={f.featured} aria-label="Featured" className="adm-switch" onClick={() => set("featured", !f.featured)} />
          </div>
          <label className="adm-label">Display order<input className="adm-input" type="number" value={f.position} onChange={(e) => set("position", Number(e.target.value))} /></label>
          <div style={{ display: "grid", gap: 8 }}>
            <button type="button" className="adm-btn primary" disabled={pending} style={{ justifyContent: "center" }} onClick={() => submit("published")}>
              {pending ? "Saving…" : f.status === "published" ? "Save & keep published" : "Publish"}
            </button>
            <button type="button" className="adm-btn" disabled={pending} style={{ justifyContent: "center" }} onClick={() => submit("draft")}>
              {f.status === "published" ? "Unpublish (save as draft)" : "Save as draft"}
            </button>
            {site?.status === "published" && (
              <a className="adm-btn" style={{ justifyContent: "center" }} href={`/references/${site.slug}`} target="_blank" rel="noreferrer">View public page ↗</a>
            )}
          </div>
        </div>

        <div className="adm-card stack">
          <span className="adm-label" style={{ margin: 0 }}>Website preview</span>
          <div className="adm-preview">
            {shooting ? "Capturing the site…" : preview ? <img src={preview} alt="Website preview" /> : "Paste the website link and the preview appears here"}
          </div>
          <button type="button" className="adm-btn sm" disabled={shooting || !f.url}
            onClick={() => capture(f.url.trim())}>{shooting ? "Capturing…" : "Retake screenshot"}</button>
          <p style={{ fontSize: 11.5, color: "var(--dim)" }}>Taken automatically from the live site and saved with the reference.</p>
        </div>

        {site && (
          <button type="button" className="adm-btn danger" disabled={pending} style={{ justifyContent: "center" }}
            onClick={() => confirm(`Delete “${site.name}” permanently?`) && start(async () => {
              const r = await deleteSites([site.id]);
              if (r.ok) { toast("Deleted"); router.replace("/admin/references"); } else toast(r.error, true);
            })}>Delete reference</button>
        )}
      </div>
    </form>
  );
}
