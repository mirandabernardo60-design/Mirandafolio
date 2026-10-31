"use client";
import { useState } from "react";
import { Icon } from "./Icon";

export function CopyLink() {
  const [done, setDone] = useState(false);
  return (
    <a className="row" href="#" onClick={async (e) => {
      e.preventDefault();
      try { await navigator.clipboard.writeText(window.location.href); setDone(true); setTimeout(() => setDone(false), 1500); } catch { /* ignore */ }
    }}>
      <Icon name="share" width={14} /> {done ? "Link copied" : "Share"}
    </a>
  );
}
