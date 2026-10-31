"use client";
export function OpenSearch({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <button className={className} onClick={() => window.dispatchEvent(new Event("miranda:open-search"))}>{children}</button>
  );
}
