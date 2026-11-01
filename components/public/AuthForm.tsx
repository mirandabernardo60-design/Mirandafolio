"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { memberSignIn, memberSignUp } from "@/app/auth-actions";
import { Logo } from "./Logo";

export function AuthForm({ mode, next }: { mode: "signin" | "signup"; next: string }) {
  const [state, action, pending] = useActionState(mode === "signin" ? memberSignIn : memberSignUp, null);
  const [email, setEmail] = useState("");
  const q = next && next !== "/" ? `?next=${encodeURIComponent(next)}` : "";
  return (
    <main className="auth-wrap">
      <div className="auth-card">
        <Logo />
        <h1>{mode === "signin" ? "Sign in to Miranda" : "Create your account"}</h1>
        <p className="auth-sub">A curated library of the best websites on the internet.</p>
        {state?.ok && state.message ? (
          <p className="auth-ok" role="status">{state.message}</p>
        ) : (
          <form action={action} className="auth-form">
            <input type="hidden" name="next" value={next} />
            <label>Email<input name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <label>Password<input name="password" type="password" minLength={6} required
              autoComplete={mode === "signin" ? "current-password" : "new-password"} /></label>
            {state && !state.ok && <p className="auth-err" role="alert">{state.error}</p>}
            <button className="btn-pill auth-btn" disabled={pending}>
              {pending ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
            </button>
          </form>
        )}
        <p className="auth-switch">
          {mode === "signin" ? <>No account yet? <Link href={`/signup${q}`}>Sign up</Link></> : <>Already have an account? <Link href={`/login${q}`}>Sign in</Link></>}
        </p>
      </div>
    </main>
  );
}
