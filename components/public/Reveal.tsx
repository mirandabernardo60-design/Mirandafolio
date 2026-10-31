"use client";
import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Staggered fade-up for every [data-reveal] element inside, batched on scroll.
 * Re-runs on navigation and observes DOM mutations, so newly added references animate too.
 */
export function Reveal({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const sp = useSearchParams();

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    document.documentElement.classList.add("js");
    const el = root.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const seen = new WeakSet<Element>();
    let triggers: ScrollTrigger[] = [];
    const run = () => {
      const items = Array.from(el.querySelectorAll<HTMLElement>("[data-reveal]")).filter((n) => !seen.has(n));
      if (!items.length) return;
      items.forEach((n) => seen.add(n));
      gsap.set(items, { opacity: 0, y: 14 });
      triggers = triggers.concat(
        ScrollTrigger.batch(items, {
          start: "top 94%",
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.06, overwrite: true }),
        }),
      );
    };
    run();
    const mo = new MutationObserver(run);
    mo.observe(el, { childList: true, subtree: true });
    return () => { mo.disconnect(); triggers.forEach((t) => t.kill()); };
  }, [pathname, sp]);

  return <div ref={root}>{children}</div>;
}
