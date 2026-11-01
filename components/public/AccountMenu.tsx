"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { memberSignOut } from "@/app/auth-actions";
import { Icon } from "./Icon";

export function AccountMenu({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button className="icon-btn m-icon" aria-label="Account" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Icon name="user" width={20} />
      </button>
      {open && (
        <div className="menu" style={{ left: "auto", right: 0, minWidth: 180 }} onClick={() => setOpen(false)}>
          <Link href="/saved"><Icon name="bookmark" width={13} /> Saved websites</Link>
          {isAdmin && <Link href="/admin/references/new"><Icon name="plus" width={13} /> Add site</Link>}
          {isAdmin && <Link href="/admin"><Icon name="grid" width={13} /> Admin</Link>}
          <form action={memberSignOut}><button><Icon name="collapse" width={13} /> Sign out</button></form>
        </div>
      )}
    </div>
  );
}
