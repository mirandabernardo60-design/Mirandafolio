"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUserId } from "@/lib/viewer";

type R = { ok: true } | { ok: false; error: string };

/** Save or unsave a website for the signed-in visitor. */
export async function toggleBookmark(siteId: string, save: boolean): Promise<R> {
  if (!z.string().uuid().safeParse(siteId).success) return { ok: false, error: "Invalid website." };
  const uid = await getUserId();
  if (!uid) return { ok: false, error: "Sign in to save websites." };
  const db = await createClient();
  const { error } = save
    ? await db.from("bookmarks").upsert({ user_id: uid, site_id: siteId })
    : await db.from("bookmarks").delete().eq("user_id", uid).eq("site_id", siteId);
  if (error) return { ok: false, error: "Couldn't update your saved websites. Try again." };
  revalidatePath("/saved");
  return { ok: true };
}

const reportSchema = z.object({
  siteId: z.string().uuid(),
  reason: z.enum(["broken-link", "wrong-info", "inappropriate", "other"]),
  message: z.string().trim().max(1000),
});

/** A visitor reports a problem with a website. */
export async function reportProblem(raw: unknown): Promise<R> {
  const p = reportSchema.safeParse(raw);
  if (!p.success) return { ok: false, error: "Choose what's wrong (and keep the note under 1000 characters)." };
  const uid = await getUserId();
  if (!uid) return { ok: false, error: "Sign in to report a problem." };
  const db = await createClient();
  const { error } = await db.from("reports").insert({ site_id: p.data.siteId, user_id: uid, reason: p.data.reason, message: p.data.message });
  if (error) return { ok: false, error: "Couldn't send the report. Try again." };
  return { ok: true };
}
