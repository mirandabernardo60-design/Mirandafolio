import Link from "next/link";

export function Banner() {
  const lines = Array.from({ length: 26 }, (_, i) => i);
  return (
    <div className="banner" data-reveal>
      <svg className="lines" viewBox="0 0 1200 140" preserveAspectRatio="none" aria-hidden="true">
        {lines.map((i) => (
          <path key={i} d={`M${560 + i * 26} 160 Q ${760 + i * 18} ${60 - i * 2} ${1220} ${-20 + i * 7}`} stroke="#3e5cff" strokeWidth="1" fill="none" />
        ))}
        {lines.map((i) => (
          <path key={`b${i}`} d={`M${520 + i * 30} -20 L ${860 + i * 14} 160`} stroke="#2b46e6" strokeWidth=".8" fill="none" opacity=".6" />
        ))}
      </svg>
      <div style={{ position: "relative" }}>
        <h3>No more searching for inspiration.</h3>
        <p>A curated library of the best websites on the internet</p>
      </div>
      <Link href="/all" className="btn-pill" style={{ position: "relative", padding: "9px 18px", fontSize: 13 }}>Browse all websites</Link>
    </div>
  );
}
