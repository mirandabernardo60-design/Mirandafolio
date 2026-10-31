"use client";
import { Icon } from "./Icon";
export function MenuButton() {
  return (
    <button className="icon-btn mobile-only" aria-label="Open menu"
      onClick={() => window.dispatchEvent(new Event("miranda:toggle-sidebar"))}>
      <Icon name="menu" width={17} />
    </button>
  );
}
