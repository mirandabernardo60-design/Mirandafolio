import { NextResponse } from "next/server";
import { createPublicClient, hasSupabaseEnv } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim().slice(0, 100) ?? "";
  if (!q || !hasSupabaseEnv()) return NextResponse.json([]);
  const { data } = await createPublicClient()
    .rpc("search_sites", { q })
    .eq("status", "published")
    .select("slug, name, short_description, favicon_url")
    .limit(8);
  return NextResponse.json(data ?? []);
}
