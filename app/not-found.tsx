import Link from "next/link";
export default function NotFound() {
  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", textAlign: "center", padding: 16 }}>
      <div><h1 style={{ fontSize: 28, fontWeight: 500 }}>Page not found</h1>
        <p style={{ color: "var(--muted)", margin: "8px 0 20px" }}>This reference may have been unpublished or removed.</p>
        <Link href="/" className="btn-pill">Back to Miranda</Link></div>
    </main>
  );
}
