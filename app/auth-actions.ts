"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

type State = { ok: boolean; error?: string; message?: string } | null;

const creds = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

/** Only allow redirects back into this site (no open redirects). */
function safeNext(raw: FormDataEntryValue | null) {
  const n = String(raw ?? "");
  return /^\/(?!\/)[\w\-/?=&.%]*$/.test(n) && !n.startsWith("/login") && !n.startsWith("/signup") ? n : "/";
}

export async function memberSignIn(_: State, form: FormData): Promise<State> {
  const p = creds.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(p.data);
  if (error) {
    if (/confirm/i.test(error.message)) return { ok: false, error: "Confirm your email first: check your inbox for the link." };
    return { ok: false, error: "Wrong email or password." };
  }
  redirect(safeNext(form.get("next")));
}

export async function memberSignUp(_: State, form: FormData): Promise<State> {
  const p = creds.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message };
  const h = await headers();
  const origin = process.env.NEXT_PUBLIC_SITE_URL || `https://${h.get("host")}`;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    ...p.data,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) {
    if (/registered|exists/i.test(error.message)) return { ok: false, error: "This email already has an account. Sign in instead." };
    if (/not allowed|disabled/i.test(error.message)) return { ok: false, error: "Sign-ups are closed right now." };
    return { ok: false, error: error.message };
  }
  if (data.session) redirect("/"); // email confirmation is off: signed in straight away
  return { ok: true, message: "Account created. Check your email and click the link to confirm, then sign in." };
}

export async function memberSignOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
