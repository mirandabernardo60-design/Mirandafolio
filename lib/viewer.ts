import "server-only";
import { cache } from "react";
import { createClient, hasSupabaseEnv } from "./supabase/server";

/** Who is looking at the page (cached per request). */
export const getViewer = cache(async () => {
  if (!hasSupabaseEnv()) return { signedIn: false, isAdmin: false };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { signedIn: false, isAdmin: false };
  const { data } = await supabase.rpc("is_admin");
  return { signedIn: true, isAdmin: Boolean(data) };
});
