import { Logo } from "@/components/public/Logo";
import { LoginForm } from "./LoginForm";

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;
  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 16 }}>
      <div className="adm-card" style={{ width: "min(380px, 100%)", padding: 28 }}>
        <Logo />
        <p style={{ color: "var(--muted)", fontSize: 13, margin: "10px 0 22px" }}>Only the admin can add sites. Sign in to continue.</p>
        {error === "not-admin" && <p className="adm-err" style={{ marginBottom: 12 }}>This account is not an administrator.</p>}
        <LoginForm next={next ?? ""} />
      </div>
    </main>
  );
}
