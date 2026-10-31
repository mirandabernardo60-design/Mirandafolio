"use client";
import { useRef } from "react";
import { Icon } from "./Icon";

export function CarouselSection({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  const track = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => track.current?.scrollBy({ left: dir * track.current.clientWidth, behavior: "smooth" });
  return (
    <section className="section">
      <div className="section-head">
        {icon}
        <h2>{title}</h2>
        <div className="arrows">
          <button className="icon-btn" aria-label="Previous" onClick={() => scroll(-1)}><Icon name="left" width={14} /></button>
          <button className="icon-btn" aria-label="Next" onClick={() => scroll(1)}><Icon name="right" width={14} /></button>
        </div>
      </div>
      <div className="carousel" ref={track}>{children}</div>
    </section>
  );
}
