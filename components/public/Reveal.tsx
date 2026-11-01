"use client";
import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Staggered fade-up for [data-reveal] elements as they scroll into view.
 * Content is never left hidden: anything already on screen shows immediately,
 * and a safety timer reveals everything if the observer doesn't fire.
 * Newly added elements (client navigation, new references) are picked up too.
 */
export function Reveal({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const sp = useSearchParams();

  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const seen = new WeakSet<Element>();
    const io = new IntersectionObserver((entries) => {
      let k = 0;
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const t = e.target as HTMLElement;
        t.style.setProperty("--rv-i", String(k++ % 8));
        t.classList.add("rv-in");
        io.unobserve(t);
      }
    }, { rootMargin: "0px 0px -6% 0px" });

    const scan = () => {
      const vh = window.innerHeight;
      el.querySelectorAll<HTMLElement>("[data-reveal]").forEach((n) => {
        if (seen.has(n)) return;
        seen.add(n);
        if (n.getBoundingClientRect().top < vh * 0.94) return; // already visible: no animation, no hiding
        n.classList.add("rv");
        io.observe(n);
      });
    };
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(el, { childList: true, subtree: true });
    // Safety net: never leave anything hidden.
    const safety = window.setTimeout(() => el.querySelectorAll(".rv:not(.rv-in)").forEach((n) => n.classList.add("rv-in")), 4000);
    return () => { io.disconnect(); mo.disconnect(); clearTimeout(safety); };
  }, [pathname, sp]);

  return <div ref={root}>{children}</div>;
}
