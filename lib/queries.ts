import "server-only";
import { cache } from "react";
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

export const getCategories = cache(async (): Promise<CategoryCount[]> => {
  if (!hasSupabaseEnv()) return [];
  const { data } = await createPublicClient()
    .from("category_counts")
    .select("*")
    .order("position")
    .order("name");
  return (data ?? []) as CategoryCount[];
});

export const getTags = cache(async (): Promise<Tag[]> => {
  if (!hasSupabaseEnv()) return [];
  const { data } = await createPublicClient().from("tags").select("*").order("name");
  return (data ?? []) as Tag[];
});

export async function getPublishedCount() {
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
  style?: string;
  sort?: Sort;
  featured?: boolean;
  limit?: number;
};

export async function listSites(p: ListParams = {}): Promise<SiteFull[]> {
  if (!hasSupabaseEnv()) return [];
  const db = createPublicClient();
  let ids: string[] | null = null;

  if (p.q?.trim()) {
    const { data } = await db.rpc("search_sites", { q: p.q.trim() });
    ids = ((data ?? []) as Site[]).map((s) => s.id);
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
  if (p.featured) q = q.eq("featured", true);
  q = orderFor(q, p.sort ?? "latest");
  if (p.limit) q = q.limit(p.limit);

  const { data } = await q;
  return ((data ?? []) as Row[]).map(shape);
}

export async function getSiteBySlug(slug: string): Promise<SiteFull | null> {
  if (!hasSupabaseEnv()) return null;
  const { data } = await createPublicClient()
    .from("sites")
    .select(SITE_SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return data ? shape(data as Row) : null;
}

export async function getRelated(site: SiteFull, limit = 12): Promise<SiteFull[]> {
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

export async function getStyles(): Promise<string[]> {
  if (!hasSupabaseEnv()) return [];
  const { data } = await createPublicClient().from("sites").select("design_style").eq("status", "published");
  return [...new Set((data ?? []).map((r: { design_style: string }) => r.design_style).filter(Boolean))].sort();
}
