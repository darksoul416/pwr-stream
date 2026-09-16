"use client";

import { useEffect } from "react";
import type { ViewName } from "@/lib/types";

interface ShortcutHandlers {
  onNavigate?: (v: ViewName) => void;
  onSearchFocus?: () => void;
  onToggleSidebar?: () => void;
  onShowHelp?: () => void;
  onCloseModal?: () => void;
  onToggleTheme?: () => void;
  onBack?: () => void;
}

function isTyping(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || (el as HTMLElement).isContentEditable;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as Element | null;

      // Escape always works (close modals/dropdowns)
      if (e.key === "Escape") {
        handlers.onCloseModal?.();
        return;
      }

      // Don't trigger other shortcuts when typing
      if (isTyping(target)) {
        // Allow Ctrl+K even in inputs
        if ((e.metaKey || e.ctrlKey) && e.key === "k") {
          e.preventDefault();
          handlers.onSearchFocus?.();
        }
        return;
      }

      // Ctrl/Cmd+K = focus search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        handlers.onSearchFocus?.();
        return;
      }

      // ? = show help
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        handlers.onShowHelp?.();
        return;
      }

      // / = focus search
      if (e.key === "/") {
        e.preventDefault();
        handlers.onSearchFocus?.();
        return;
      }

      // G followed by a letter = navigate
      if (e.key === "g" || e.key === "G") {
        // wait for next key
        const onFollowup = (ev: KeyboardEvent) => {
          const map: Record<string, ViewName> = {
            h: "home",
            m: "movies",
            t: "tv",
            a: "anime",
            s: "search",
            l: "mylist",
          };
          const v = map[ev.key.toLowerCase()];
          if (v) {
            ev.preventDefault();
            handlers.onNavigate?.(v);
          }
          window.removeEventListener("keydown", onFollowup);
        };
        // Set a brief window to listen for the followup
        window.addEventListener("keydown", onFollowup, { once: true });
        setTimeout(() => window.removeEventListener("keydown", onFollowup), 1000);
        return;
      }

      // B = back
      if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        handlers.onBack?.();
        return;
      }

      // T = toggle theme
      if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        handlers.onToggleTheme?.();
        return;
      }

      // [ = toggle sidebar (mobile)
      if (e.key === "[") {
        e.preventDefault();
        handlers.onToggleSidebar?.();
        return;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handlers]);
}

export const SHORTCUTS = [
  { keys: "/", description: "Focus search" },
  { keys: "Ctrl+K", description: "Focus search (works anywhere)" },
  { keys: "?", description: "Show this help" },
  { keys: "G H", description: "Go to Home" },
  { keys: "G M", description: "Go to Movies" },
  { keys: "G T", description: "Go to TV Shows" },
  { keys: "G A", description: "Go to Anime" },
  { keys: "G S", description: "Go to Search" },
  { keys: "G L", description: "Go to My List" },
  { keys: "B", description: "Back" },
  { keys: "T", description: "Toggle theme (dark/light)" },
  { keys: "[", description: "Toggle sidebar (mobile)" },
  { keys: "Esc", description: "Close modals / dropdowns" },
];
