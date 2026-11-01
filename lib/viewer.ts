import "server-only";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { createClient, createServiceClient, hasSupabaseEnv } from "./supabase/server";

/** Current user id, verified. Uses local JWT verification (getClaims) when available — no network round trip. */
export const getUserId = cache(async (): Promise<string | null> => {
  if (!hasSupabaseEnv()) return null;
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const auth = supabase.auth as any;
  if (typeof auth.getClaims === "function") {
    const { data, error } = await auth.getClaims();
    if (!error) return (data?.claims?.sub as string | undefined) ?? null;
  }
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
});

/** Admin lookup, cached for 10 minutes per user (admins rarely change). */
const isAdminCached = (uid: string) =>
  unstable_cache(async () => {
    const svc = createServiceClient();
    if (!svc) return null; // no service key: fall back to the RPC below
    const { data } = await svc.from("admins").select("user_id").eq("user_id", uid).maybeSingle();
    return Boolean(data);
  }, ["is-admin", uid], { revalidate: 600, tags: ["admins"] })();

/** Who is looking at the page (cached per request). */
export const getViewer = cache(async () => {
  const uid = await getUserId();
  if (!uid) return { signedIn: false, isAdmin: false };
  const cachedAdmin = await isAdminCached(uid).catch(() => null);
  if (cachedAdmin !== null) return { signedIn: true, isAdmin: cachedAdmin };
  const supabase = await createClient();
  const { data } = await supabase.rpc("is_admin");
  return { signedIn: true, isAdmin: Boolean(data) };
});
