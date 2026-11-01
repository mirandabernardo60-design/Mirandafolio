"use client";
import { Icon } from "./Icon";
export function MenuButton() {
  return (
    <button className="icon-btn m-icon" aria-label="Open menu"
      onClick={() => window.dispatchEvent(new Event("miranda:toggle-sidebar"))}>
      <Icon name="menu" width={22} />
    </button>
  );
}
