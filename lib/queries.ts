import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicClient, hasSupabaseEnv } from "./supabase/server";
import type { CategoryCount, Site, SiteFull, Tag } from "./types";

const SITE_SELECT = "*, category:categories(*), tags:site_tags(tag:tags(*))";

type Row = Site & { category: SiteFull["category"]; tags: { tag: Tag }[] };
const shape = (r: Row): SiteFull => ({ ...r, tags: (r.tags ?? []).map((t) => t.tag).filter(Boolean) });

export type Sort = "latest" | "oldest" | "name" | "custom";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function orderFor(q: any, sort: Sort) {
  switch (sort) {
    case "oldest": return q.order("created_at", { ascending: true });
    case "name": return q.order("name", { ascending: true });
    case "custom": return q.order("position", { ascending: true }).order("created_at", { ascending: false });
    default: return q.order("created_at", { ascending: false });
  }
}

const _getCategories = (async (): Promise<CategoryCount[]> => {
  if (!hasSupabaseEnv()) return [];
  const db = createPublicClient();
  const { data, error } = await db.from("category_counts").select("*").order("position").order("name");
  if (!error) return (data ?? []) as CategoryCount[];
  // Fallback if the counts view is unavailable: list categories without counts.
  const r = await db.from("categories").select("*").order("position").order("name");
  if (r.error) throw r.error; // don't cache a failure
  return (r.data ?? []).map((c) => ({ ...c, site_count: 0 })) as CategoryCount[];
});

const _getTags = (async (): Promise<Tag[]> => {
  if (!hasSupabaseEnv()) return [];
  const { data, error } = await createPublicClient().from("tags").select("*").order("name");
  if (error) throw error; // don't cache a failure
  return (data ?? []) as Tag[];
});

async function _getPublishedCount() {
  if (!hasSupabaseEnv()) return 0;
  const { count } = await createPublicClient()
    .from("sites")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");
  return count ?? 0;
}

export type ListParams = {
  q?: string;
  category?: string; // slug
  tag?: string; // slug
  library?: string; // slug
  collection?: string; // id
  style?: string;
  pricing?: string;
  sort?: Sort;
  featured?: boolean;
  limit?: number;
};

async function _listSites(p: ListParams = {}): Promise<SiteFull[]> {
  if (!hasSupabaseEnv()) return [];
  const db = createPublicClient();
  let ids: string[] | null = null;

  if (p.q?.trim()) {
    const { data } = await db.rpc("search_sites", { q: p.q.trim() });
    ids = ((data ?? []) as Site[]).map((s) => s.id);
    if (!ids.length) return [];
  }
  if (p.library) {
    const { data } = await db.from("site_libraries").select("site_id, libraries!inner(slug)").eq("libraries.slug", p.library);
    const libIds = (data ?? []).map((r: { site_id: string }) => r.site_id);
    ids = ids ? ids.filter((i) => libIds.includes(i)) : libIds;
    if (!ids.length) return [];
  }
  if (p.collection) {
    const { data } = await db.from("collection_sites").select("site_id").eq("collection_id", p.collection);
    const cIds = (data ?? []).map((r: { site_id: string }) => r.site_id);
    ids = ids ? ids.filter((i) => cIds.includes(i)) : cIds;
    if (!ids.length) return [];
  }
  if (p.tag) {
    const { data } = await db.from("site_tags").select("site_id, tags!inner(slug)").eq("tags.slug", p.tag);
    const tagIds = (data ?? []).map((r: { site_id: string }) => r.site_id);
    ids = ids ? ids.filter((i) => tagIds.includes(i)) : tagIds;
    if (!ids.length) return [];
  }

  let q = db.from("sites").select(SITE_SELECT).eq("status", "published");
  if (ids) q = q.in("id", ids);
  if (p.category) {
    const { data: cat } = await db.from("categories").select("id").eq("slug", p.category).maybeSingle();
    if (!cat) return [];
    q = q.eq("category_id", cat.id);
  }
  if (p.style) q = q.ilike("design_style", p.style);
  if (p.pricing) q = q.eq("pricing", p.pricing);
  if (p.featured) q = q.eq("featured", true);
  q = orderFor(q, p.sort ?? "latest");
  if (p.limit) q = q.limit(p.limit);

  const { data } = await q;
  return ((data ?? []) as Row[]).map(shape);
}

async function _getSiteBySlug(slug: string): Promise<SiteFull | null> {
  if (!hasSupabaseEnv()) return null;
  const { data } = await createPublicClient()
    .from("sites")
    .select(SITE_SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return data ? shape(data as Row) : null;
}

async function _getRelated(site: SiteFull, limit = 12): Promise<SiteFull[]> {
  if (!hasSupabaseEnv()) return [];
  let q = createPublicClient()
    .from("sites")
    .select(SITE_SELECT)
    .eq("status", "published")
    .neq("id", site.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (site.category_id) q = q.eq("category_id", site.category_id);
  const { data } = await q;
  return ((data ?? []) as Row[]).map(shape);
}

async function _getStyles(): Promise<string[]> {
  if (!hasSupabaseEnv()) return [];
  const { data } = await createPublicClient().from("sites").select("design_style").eq("status", "published");
  return [...new Set((data ?? []).map((r: { design_style: string }) => r.design_style).filter(Boolean))].sort();
}

export type LibraryCount = { id: string; name: string; slug: string; icon_url: string | null; position: number; site_count: number };

const _getLibraries = (async (): Promise<LibraryCount[]> => {
  if (!hasSupabaseEnv()) return [];
  const { data, error } = await createPublicClient().from("library_counts").select("*").order("position").order("name");
  if (error) return []; // libraries are optional (migration 0003)
  return (data ?? []) as LibraryCount[];
});

export type CollectionCard = {
  id: string; name: string; slug: string; description: string; created_at: string; updated_at: string;
  site_count: number; icons: { name: string; favicon_url: string | null }[];
};

async function _listCollections(opts: { limit?: number; sort?: "latest" | "name" | "size" } = {}): Promise<CollectionCard[]> {
  if (!hasSupabaseEnv()) return [];
  const { data } = await createPublicClient()
    .from("collections")
    .select("id, name, slug, description, created_at, updated_at, items:collection_sites(position, site:sites(name, favicon_url, status))")
    .eq("published", true)
    .order("updated_at", { ascending: false });
  type R = { id: string; name: string; slug: string; description: string; created_at: string; updated_at: string;
    items: { position: number; site: { name: string; favicon_url: string | null; status: string } | null }[] };
  let rows = ((data ?? []) as R[]).map((c) => {
    const live = (c.items ?? []).filter((i) => i.site && i.site.status === "published").sort((a, b) => a.position - b.position);
    return { id: c.id, name: c.name, slug: c.slug, description: c.description, created_at: c.created_at, updated_at: c.updated_at,
      site_count: live.length, icons: live.slice(0, 5).map((i) => ({ name: i.site!.name, favicon_url: i.site!.favicon_url })) };
  });
  if (opts.sort === "name") rows = rows.sort((a, b) => a.name.localeCompare(b.name));
  if (opts.sort === "size") rows = rows.sort((a, b) => b.site_count - a.site_count);
  return opts.limit ? rows.slice(0, opts.limit) : rows;
}

async function _getCollection(slug: string) {
  if (!hasSupabaseEnv()) return null;
  const { data } = await createPublicClient().from("collections").select("id, name, slug, description, updated_at").eq("slug", slug).eq("published", true).maybeSingle();
  return data as { id: string; name: string; slug: string; description: string; updated_at: string } | null;
}

async function _getSiteExtras(siteId: string) {
  if (!hasSupabaseEnv()) return { libraries: [], collections: [] };
  const db = createPublicClient();
  const [{ data: libs }, { data: cols }] = await Promise.all([
    db.from("site_libraries").select("library:libraries(id, name, slug, icon_url)").eq("site_id", siteId),
    db.from("collection_sites").select("collection:collections(id, name, slug, published)").eq("site_id", siteId),
  ]);
  type L = { id: string; name: string; slug: string; icon_url: string | null };
  type C = { id: string; name: string; slug: string; published: boolean };
  return {
    libraries: ((libs ?? []) as unknown as { library: L | null }[]).map((r) => r.library).filter(Boolean) as L[],
    collections: ((cols ?? []) as unknown as { collection: C | null }[]).map((r) => r.collection).filter((c): c is C => !!c && c.published),
  };
}

// ---- Cached public reads (cleared by revalidateTag("public") whenever the admin changes content) ----
function cached<A extends unknown[], R>(fn: (...a: A) => Promise<R>, key: string) {
  return (...a: A) => unstable_cache(() => fn(...a), [key, JSON.stringify(a)], { tags: ["public"], revalidate: 300 })();
}
export const getCategories = cached(_getCategories, "getCategories");
export const getTags = cached(_getTags, "getTags");
export const getPublishedCount = cached(_getPublishedCount, "getPublishedCount");
export const listSites = cached(_listSites, "listSites");
export const getSiteBySlug = cached(_getSiteBySlug, "getSiteBySlug");
export const getRelated = cached(_getRelated, "getRelated");
export const getStyles = cached(_getStyles, "getStyles");
export const getLibraries = cached(_getLibraries, "getLibraries");
export const listCollections = cached(_listCollections, "listCollections");
export const getCollection = cached(_getCollection, "getCollection");
export const getSiteExtras = cached(_getSiteExtras, "getSiteExtras");
