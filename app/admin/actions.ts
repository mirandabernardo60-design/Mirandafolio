"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { assertPublicUrl, downloadImage, fetchMetadata, screenshotUrl, type FetchedMeta } from "@/lib/metadata";
import { categorySchema, IMAGE_TYPES, MAX_IMAGE_BYTES, siteSchema, tagSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

export type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string; fields?: Record<string, string> };

function refreshPublic() {
  revalidateTag("public");
  revalidatePath("/", "layout");
}

function fail(e: unknown): { ok: false; error: string } {
  const msg = e instanceof Error ? e.message : typeof e === "object" && e && "message" in e ? String((e as { message: unknown }).message) : "Something went wrong";
  return { ok: false, error: msg };
}

// ---------- Auth ----------
export async function signIn(_: unknown, form: FormData): Promise<Result> {
  const parsed = z.object({ email: z.string().email(), password: z.string().min(1) }).safeParse({
    email: String(form.get("email") ?? "").trim().toLowerCase(), password: String(form.get("password") ?? ""),
  });
  if (!parsed.success) return { ok: false, error: !parsed.data && String(form.get("password") ?? "") === "" ? "Enter your password." : "Enter a valid email address (e.g. 123@gmail.com)." };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, error: "Invalid login credentials." };
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    await supabase.auth.signOut();
    return { ok: false, error: "This account is not an administrator." };
  }
  const next = String(form.get("next") ?? "");
  redirect(/^\/admin(\/[a-z0-9/_-]*)?$/i.test(next) && !next.startsWith("/admin/login") ? next : "/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

// ---------- Metadata ----------
export async function fetchSiteMetadata(url: string): Promise<Result<FetchedMeta>> {
  await requireAdmin();
  try {
    return { ok: true, data: await fetchMetadata(url) };
  } catch (e) {
    return fail(e);
  }
}

/** Live screenshot of a URL, used by the form as soon as a link is pasted. */
export async function captureScreenshot(url: string): Promise<Result<{ url: string }>> {
  await requireAdmin();
  try {
    await assertPublicUrl(url);
    const shot = await screenshotUrl(url);
    return shot ? { ok: true, data: { url: shot } } : { ok: false, error: "The screenshot service could not capture this site." };
  } catch (e) {
    return fail(e);
  }
}

// ---------- Helpers ----------
type DB = Awaited<ReturnType<typeof requireAdmin>>["supabase"];

async function uniqueSlug(db: DB, table: "sites" | "categories" | "tags", base: string, exceptId?: string) {
  const root = slugify(base);
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    let q = db.from(table).select("id").eq("slug", candidate);
    if (exceptId) q = q.neq("id", exceptId);
    const { data } = await q.maybeSingle();
    if (!data) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

async function uploadImage(db: DB, file: File, prefix: string) {
  if (!IMAGE_TYPES.includes(file.type)) throw new Error("Thumbnail must be PNG, JPEG, WebP, AVIF or GIF.");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Thumbnail must be 5 MB or smaller.");
  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const path = `${prefix}/${crypto.randomUUID()}.${ext}`;
  const { error } = await db.storage.from("thumbnails").upload(path, file, { contentType: file.type, cacheControl: "31536000" });
  if (error) throw error;
  return path;
}

async function syncTags(db: DB, siteId: string, names: string[]) {
  const unique = [...new Map(names.map((n) => [slugify(n), n.trim()])).entries()];
  const ids: string[] = [];
  for (const [slug, name] of unique) {
    const { data: existing } = await db.from("tags").select("id").eq("slug", slug).maybeSingle();
    if (existing) { ids.push(existing.id); continue; }
    const { data, error } = await db.from("tags").insert({ name, slug }).select("id").single();
    if (error) throw error;
    ids.push(data.id);
  }
  await db.from("site_tags").delete().eq("site_id", siteId);
  if (ids.length) {
    const { error } = await db.from("site_tags").insert(ids.map((tag_id) => ({ site_id: siteId, tag_id })));
    if (error) throw error;
  }
}

// ---------- Sites ----------
export async function saveSite(id: string | null, form: FormData): Promise<Result<{ id: string; slug: string }>> {
  const { supabase: db } = await requireAdmin();

  const raw = JSON.parse(String(form.get("payload") ?? "{}"));
  const parsed = siteSchema.safeParse(raw);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    parsed.error.issues.forEach((i) => { fields[String(i.path[0])] = i.message; });
    return { ok: false, error: "Please fix the highlighted fields.", fields };
  }
  const { tags, new_category, library_ids, ...input } = parsed.data;

  try {
    if (new_category) {
      // Create the category inline (or reuse one with the same name).
      const { data: existing } = await db.from("categories").select("id").ilike("name", new_category).maybeSingle();
      if (existing) input.category_id = existing.id;
      else {
        const catSlug = await uniqueSlug(db, "categories", new_category);
        const { data: c, error: cErr } = await db.from("categories").insert({ name: new_category, slug: catSlug, icon: "folders" }).select("id").single();
        if (cErr) throw cErr;
        input.category_id = c.id;
      }
    }
    const slug = await uniqueSlug(db, "sites", input.slug || input.name, id ?? undefined);
    const file = form.get("thumbnail");
    const removeThumb = form.get("removeThumbnail") === "1";

    let previousPath: string | null = null;
    if (id) {
      const { data } = await db.from("sites").select("thumbnail_path").eq("id", id).single();
      previousPath = data?.thumbnail_path ?? null;
    }

    let thumbnail_path: string | null | undefined = undefined;
    if (file instanceof File && file.size > 0) thumbnail_path = await uploadImage(db, file, slug);
    else if (form.get("persistScreenshot") === "1" && input.thumbnail_url) {
      // Store the screenshot in our own bucket so it never depends on the screenshot service again.
      const shot = await downloadImage(input.thumbnail_url);
      if (shot) thumbnail_path = await uploadImage(db, shot, slug);
    }
    else if (removeThumb) thumbnail_path = null;

    const row = { ...input, slug, ...(thumbnail_path !== undefined ? { thumbnail_path } : {}) };
    const { data, error } = id
      ? await db.from("sites").update(row).eq("id", id).select("id, slug").single()
      : await db.from("sites").insert(row).select("id, slug").single();
    if (error) throw error;

    await syncTags(db, data.id, tags);
    await db.from("site_libraries").delete().eq("site_id", data.id);
    if (library_ids.length) {
      const { error: lErr } = await db.from("site_libraries").insert(library_ids.map((library_id) => ({ site_id: data.id, library_id })));
      if (lErr) throw lErr;
    }

    // Safe cleanup: remove the replaced upload only after the row points to the new one.
    if (previousPath && thumbnail_path !== undefined && previousPath !== thumbnail_path) {
      await db.storage.from("thumbnails").remove([previousPath]);
    }

    refreshPublic();
    return { ok: true, data };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteSites(ids: string[]): Promise<Result> {
  const { supabase: db } = await requireAdmin();
  const parsed = z.array(z.string().uuid()).min(1).max(500).safeParse(ids);
  if (!parsed.success) return { ok: false, error: "Invalid selection." };
  const { data: rows } = await db.from("sites").select("thumbnail_path").in("id", parsed.data);
  const { error } = await db.from("sites").delete().in("id", parsed.data);
  if (error) return fail(error);
  const paths = (rows ?? []).map((r) => r.thumbnail_path).filter(Boolean) as string[];
  if (paths.length) await db.storage.from("thumbnails").remove(paths);
  refreshPublic();
  return { ok: true };
}

export async function bulkUpdate(ids: string[], patch: { status?: "draft" | "published"; featured?: boolean; category_id?: string | null }): Promise<Result> {
  const { supabase: db } = await requireAdmin();
  const p = z.object({
    ids: z.array(z.string().uuid()).min(1).max(500),
    patch: z.object({
      status: z.enum(["draft", "published"]).optional(),
      featured: z.boolean().optional(),
      category_id: z.string().uuid().nullable().optional(),
    }).refine((v) => Object.keys(v).length > 0),
  }).safeParse({ ids, patch });
  if (!p.success) return { ok: false, error: "Invalid bulk action." };
  const { error } = await db.from("sites").update(p.data.patch).in("id", p.data.ids);
  if (error) return fail(error);
  refreshPublic();
  return { ok: true };
}

export async function duplicateSite(id: string): Promise<Result<{ id: string }>> {
  const { supabase: db } = await requireAdmin();
  const { data: s, error } = await db.from("sites").select("*, site_tags(tag_id)").eq("id", id).single();
  if (error || !s) return fail(error ?? new Error("Not found"));
  const { id: _id, created_at: _c, updated_at: _u, search: _s, site_tags, thumbnail_path, ...rest } = s;
  void _id; void _c; void _u; void _s;
  const slug = await uniqueSlug(db, "sites", `${s.slug}-copy`);
  // Copy the uploaded image so deleting one never breaks the other.
  let newPath: string | null = null;
  if (thumbnail_path) {
    newPath = `${slug}/${crypto.randomUUID()}.${thumbnail_path.split(".").pop()}`;
    const { error: cpErr } = await db.storage.from("thumbnails").copy(thumbnail_path, newPath);
    if (cpErr) newPath = null;
  }
  const { data: copy, error: insErr } = await db.from("sites")
    .insert({ ...rest, name: `${s.name} (copy)`, slug, status: "draft", featured: false, thumbnail_path: newPath })
    .select("id").single();
  if (insErr) return fail(insErr);
  const tagRows = (site_tags as { tag_id: string }[]).map((t) => ({ site_id: copy.id, tag_id: t.tag_id }));
  if (tagRows.length) await db.from("site_tags").insert(tagRows);
  refreshPublic();
  return { ok: true, data: { id: copy.id } };
}

/** Persist a new custom order: ids in display order → position 0..n */
export async function reorderSites(ids: string[]): Promise<Result> {
  const { supabase: db } = await requireAdmin();
  const p = z.array(z.string().uuid()).max(2000).safeParse(ids);
  if (!p.success) return { ok: false, error: "Invalid order." };
  for (let i = 0; i < p.data.length; i++) {
    const { error } = await db.from("sites").update({ position: i }).eq("id", p.data[i]);
    if (error) return fail(error);
  }
  refreshPublic();
  return { ok: true };
}

// ---------- Categories ----------
export async function saveCategory(id: string | null, form: FormData): Promise<Result> {
  const { supabase: db } = await requireAdmin();
  const p = categorySchema.safeParse({ name: form.get("name"), icon: form.get("icon") || "grid", position: form.get("position") || 0 });
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Invalid category." };
  const slug = await uniqueSlug(db, "categories", p.data.name, id ?? undefined);
  const { error } = id
    ? await db.from("categories").update({ ...p.data, slug }).eq("id", id)
    : await db.from("categories").insert({ ...p.data, slug });
  if (error) return fail(error);
  refreshPublic();
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<Result> {
  const { supabase: db } = await requireAdmin();
  const { error } = await db.from("categories").delete().eq("id", id); // sites.category_id → null
  if (error) return fail(error);
  refreshPublic();
  revalidatePath("/admin", "layout");
  return { ok: true };
}

// ---------- Tags ----------
export async function saveTag(id: string | null, form: FormData): Promise<Result> {
  const { supabase: db } = await requireAdmin();
  const p = tagSchema.safeParse({ name: form.get("name") });
  if (!p.success) return { ok: false, error: "Tag name is required (max 40 characters)." };
  const slug = await uniqueSlug(db, "tags", p.data.name, id ?? undefined);
  const { error } = id
    ? await db.from("tags").update({ name: p.data.name, slug }).eq("id", id)
    : await db.from("tags").insert({ name: p.data.name, slug });
  if (error) return fail(error);
  refreshPublic();
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function deleteTag(id: string): Promise<Result> {
  const { supabase: db } = await requireAdmin();
  const { error } = await db.from("tags").delete().eq("id", id);
  if (error) return fail(error);
  refreshPublic();
  revalidatePath("/admin", "layout");
  return { ok: true };
}

// ---------- Media ----------
export async function deleteUnusedMedia(paths: string[]): Promise<Result<{ removed: number }>> {
  const { supabase: db } = await requireAdmin();
  const p = z.array(z.string().min(1).max(300)).max(1000).safeParse(paths);
  if (!p.success) return { ok: false, error: "Invalid selection." };
  // Re-check on the server that none are referenced right now.
  const { data: used } = await db.from("sites").select("thumbnail_path").in("thumbnail_path", p.data);
  const usedSet = new Set((used ?? []).map((u) => u.thumbnail_path));
  const safe = p.data.filter((x) => !usedSet.has(x));
  if (safe.length) {
    const { error } = await db.storage.from("thumbnails").remove(safe);
    if (error) return fail(error);
  }
  revalidatePath("/admin/media");
  return { ok: true, data: { removed: safe.length } };
}

// ---------- Articles ----------
const articleSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160),
  slug: z.string().trim().max(80).regex(/^([a-z0-9]+(-[a-z0-9]+)*)?$/, "Lowercase letters, numbers and dashes only"),
  excerpt: z.string().trim().max(300),
  body: z.string().max(100000),
  category_id: z.string().transform((v) => (v === "" ? null : v)).nullable()
    .refine((v) => v === null || z.string().uuid().safeParse(v).success, "Invalid category"),
  status: z.enum(["draft", "published"]),
  site_ids: z.array(z.string().uuid()).max(30),
});

export async function saveArticle(id: string | null, raw: unknown): Promise<Result<{ id: string; slug: string }>> {
  const { supabase: db } = await requireAdmin();
  const p = articleSchema.safeParse(raw);
  if (!p.success) {
    const fields: Record<string, string> = {};
    p.error.issues.forEach((i) => { fields[String(i.path[0])] = i.message; });
    return { ok: false, error: "Please fix the highlighted fields.", fields };
  }
  const { site_ids, ...input } = p.data;
  try {
    const slug = await uniqueSlugFor(db, "articles", input.slug || input.title, id ?? undefined);
    let published_at: string | null | undefined;
    if (input.status === "published") {
      const prev = id ? (await db.from("articles").select("published_at").eq("id", id).single()).data : null;
      published_at = prev?.published_at ?? new Date().toISOString();
    }
    const row = { ...input, slug, ...(published_at !== undefined ? { published_at } : {}) };
    const { data, error } = id
      ? await db.from("articles").update(row).eq("id", id).select("id, slug").single()
      : await db.from("articles").insert(row).select("id, slug").single();
    if (error) throw error;
    await db.from("article_sites").delete().eq("article_id", data.id);
    if (site_ids.length) {
      const { error: e2 } = await db.from("article_sites").insert(site_ids.map((site_id, position) => ({ article_id: data.id, site_id, position })));
      if (e2) throw e2;
    }
    refreshPublic();
    return { ok: true, data };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteArticle(id: string): Promise<Result> {
  const { supabase: db } = await requireAdmin();
  const { error } = await db.from("articles").delete().eq("id", id);
  if (error) return fail(error);
  refreshPublic();
  return { ok: true };
}

async function uniqueSlugFor(db: DB, table: "articles", base: string, exceptId?: string) {
  const root = slugify(base);
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    let q = db.from(table).select("id").eq("slug", candidate);
    if (exceptId) q = q.neq("id", exceptId);
    const { data } = await q.maybeSingle();
    if (!data) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

// ---------- Collections ----------
const collectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().trim().max(400).default(""),
  published: z.boolean().default(true),
});

async function uniqueSlugIn(db: DB, table: "collections" | "libraries", base: string, exceptId?: string) {
  const root = slugify(base);
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    let q = db.from(table).select("id").eq("slug", candidate);
    if (exceptId) q = q.neq("id", exceptId);
    const { data } = await q.maybeSingle();
    if (!data) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

export async function saveCollection(id: string | null, raw: unknown): Promise<Result<{ id: string; slug: string }>> {
  const { supabase: db } = await requireAdmin();
  const p = collectionSchema.safeParse(raw);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Invalid collection." };
  const slug = await uniqueSlugIn(db, "collections", p.data.name, id ?? undefined);
  const { data, error } = id
    ? await db.from("collections").update({ ...p.data, slug }).eq("id", id).select("id, slug").single()
    : await db.from("collections").insert({ ...p.data, slug }).select("id, slug").single();
  if (error) return fail(error);
  refreshPublic();
  revalidatePath("/admin", "layout");
  return { ok: true, data };
}

export async function deleteCollection(id: string): Promise<Result> {
  const { supabase: db } = await requireAdmin();
  const { error } = await db.from("collections").delete().eq("id", id);
  if (error) return fail(error);
  refreshPublic();
  revalidatePath("/admin", "layout");
  return { ok: true };
}

/** Add or remove one website from a collection (used by "Add to collection"). */
export async function toggleCollectionSite(collectionId: string, siteId: string, add: boolean): Promise<Result> {
  const { supabase: db } = await requireAdmin();
  if (!z.string().uuid().safeParse(collectionId).success || !z.string().uuid().safeParse(siteId).success) return { ok: false, error: "Invalid ids." };
  if (add) {
    const { count } = await db.from("collection_sites").select("site_id", { count: "exact", head: true }).eq("collection_id", collectionId);
    const { error } = await db.from("collection_sites").upsert({ collection_id: collectionId, site_id: siteId, position: count ?? 0 });
    if (error) return fail(error);
  } else {
    const { error } = await db.from("collection_sites").delete().eq("collection_id", collectionId).eq("site_id", siteId);
    if (error) return fail(error);
  }
  await db.from("collections").update({ updated_at: new Date().toISOString() }).eq("id", collectionId);
  refreshPublic();
  return { ok: true };
}

/** Create a collection and put the website in it, in one step. */
export async function createCollectionWithSite(name: string, siteId: string): Promise<Result<{ id: string }>> {
  const r = await saveCollection(null, { name, description: "", published: true });
  if (!r.ok || !r.data) return r.ok ? { ok: false, error: "Could not create collection." } : r;
  const t = await toggleCollectionSite(r.data.id, siteId, true);
  return t.ok ? { ok: true, data: { id: r.data.id } } : t;
}

// ---------- Libraries ----------
export async function saveLibrary(id: string | null, form: FormData): Promise<Result> {
  const { supabase: db } = await requireAdmin();
  const p = z.object({
    name: z.string().trim().min(1).max(60),
    icon_url: z.string().trim().max(2000).transform((v) => (v === "" ? null : v)).nullable()
      .refine((v) => v === null || /^https?:\/\//.test(v), "Icon must be an http(s) URL"),
    position: z.coerce.number().int().default(0),
  }).safeParse({ name: form.get("name"), icon_url: form.get("icon_url") ?? "", position: form.get("position") || 0 });
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Invalid library." };
  const slug = await uniqueSlugIn(db, "libraries", p.data.name, id ?? undefined);
  const { error } = id
    ? await db.from("libraries").update({ ...p.data, slug }).eq("id", id)
    : await db.from("libraries").insert({ ...p.data, slug });
  if (error) return fail(error);
  refreshPublic();
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function deleteLibrary(id: string): Promise<Result> {
  const { supabase: db } = await requireAdmin();
  const { error } = await db.from("libraries").delete().eq("id", id);
  if (error) return fail(error);
  refreshPublic();
  revalidatePath("/admin", "layout");
  return { ok: true };
}
