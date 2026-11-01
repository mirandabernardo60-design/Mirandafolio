"use client";
import Link from "next/link";
import { useRef } from "react";
import { Icon } from "./Icon";

export function CarouselSection({ title, icon, children, moreHref, wide }: { title: string; icon?: React.ReactNode; children: React.ReactNode; moreHref?: string; wide?: boolean }) {
  const track = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => track.current?.scrollBy({ left: dir * track.current.clientWidth, behavior: "smooth" });
  return (
    <section className="section">
      <div className="section-head">
        {icon}
        <h2>{title}</h2>
        <div className="arrows">
          <button className="icon-btn" aria-label="Previous" onClick={() => scroll(-1)}><Icon name="left" width={14} /></button>
          {moreHref && <Link className="icon-btn" aria-label="See all" href={moreHref}><Icon name="plus" width={14} /></Link>}
          <button className="icon-btn" aria-label="Next" onClick={() => scroll(1)}><Icon name="right" width={14} /></button>
        </div>
      </div>
      <div className="carousel" ref={track}>{children}</div>
    </section>
  );
}
