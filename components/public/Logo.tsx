/** Miranda wordmark: heavy uppercase grotesk + angular monogram, mirroring the reference's logo composition. */
export function Logo({ size = 19 }: { size?: number }) {
  return (
    <span className="logo-inner" style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
      <svg width={size * 1.25} height={size} viewBox="0 0 30 24" aria-hidden="true">
        <path fill="currentColor" d="M0 22 L6 2 H11 L15 13 L19 2 H24 L30 22 H25 L21.5 10 L17 22 H13 L8.5 10 L5 22 Z" />
      </svg>
      <span className="logo-word" style={{ fontSize: size }}>Miranda</span>
    </span>
  );
}
