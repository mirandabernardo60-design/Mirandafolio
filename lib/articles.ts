import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicClient, hasSupabaseEnv } from "./supabase/server";
import type { ArticleFull, ArticleSite } from "./types";

const SELECT = "*, category:categories(*), sites:article_sites(position, site:sites(id, name, slug, favicon_url))";
type Row = Omit<ArticleFull, "sites"> & { sites: { position: number; site: ArticleSite | null }[] };
const shape = (r: Row): ArticleFull => ({
  ...r,
  sites: (r.sites ?? []).sort((a, b) => a.position - b.position).map((s) => s.site).filter(Boolean) as ArticleSite[],
});

/** Reading time at ~220 words per minute, minimum 1. */
export function readMinutes(body: string) {
  return Math.max(1, Math.round(body.trim().split(/\s+/).filter(Boolean).length / 220));
}

async function _listArticles(opts: { category?: string; limit?: number } = {}): Promise<ArticleFull[]> {
  if (!hasSupabaseEnv()) return [];
  const db = createPublicClient();
  let q = db.from("articles").select(SELECT).eq("status", "published").order("published_at", { ascending: false });
  if (opts.category) {
    const { data: c } = await db.from("categories").select("id").eq("slug", opts.category).maybeSingle();
    if (!c) return [];
    q = q.eq("category_id", c.id);
  }
  if (opts.limit) q = q.limit(opts.limit);
  const { data } = await q;
  return ((data ?? []) as Row[]).map(shape);
}

async function _getArticle(slug: string): Promise<ArticleFull | null> {
  if (!hasSupabaseEnv()) return null;
  const { data } = await createPublicClient().from("articles").select(SELECT)
    .eq("slug", slug).eq("status", "published").maybeSingle();
  return data ? shape(data as Row) : null;
}

// ---- Cached public reads (cleared by revalidateTag("public") whenever the admin changes content) ----
function cached<A extends unknown[], R>(fn: (...a: A) => Promise<R>, key: string) {
  return (...a: A) => unstable_cache(() => fn(...a), [key, JSON.stringify(a)], { tags: ["public"], revalidate: 300 })();
}
export const listArticles = cached(_listArticles, "listArticles");
export const getArticle = cached(_getArticle, "getArticle");
