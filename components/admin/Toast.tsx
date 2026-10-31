"use client";
import { useEffect, useState } from "react";

export function toast(message: string, error = false) {
  window.dispatchEvent(new CustomEvent("miranda:toast", { detail: { message, error } }));
}

export function Toaster() {
  const [t, setT] = useState<{ message: string; error: boolean } | null>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const h = (e: Event) => {
      setT((e as CustomEvent).detail);
      clearTimeout(timer);
      timer = setTimeout(() => setT(null), 2800);
    };
    window.addEventListener("miranda:toast", h);
    return () => window.removeEventListener("miranda:toast", h);
  }, []);
  return t ? <div className={`adm-toast ${t.error ? "err" : ""}`} role="status">{t.message}</div> : null;
}
