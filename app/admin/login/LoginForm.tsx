"use client";
import { useActionState } from "react";
import { signIn } from "../actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signIn, null);
  return (
    <form action={action} style={{ display: "grid", gap: 14 }}>
      <input type="hidden" name="next" value={next} />
      <label className="adm-label">Email<input className="adm-input" name="email" type="email" autoComplete="email" required /></label>
      <label className="adm-label">Password<input className="adm-input" name="password" type="password" autoComplete="current-password" required /></label>
      {state && !state.ok && <p className="adm-err" role="alert">{state.error}</p>}
      <button className="adm-btn primary" disabled={pending} style={{ justifyContent: "center", height: 38 }}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
