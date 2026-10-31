import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

/** Server-side authorization gate. Every admin page and action calls this. */
export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || !isAdmin) redirect("/admin/login?error=not-admin");
  return { supabase, user };
}
