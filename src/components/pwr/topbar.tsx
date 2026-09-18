"use client";

import { useState, useEffect, useRef } from "react";
import { Menu, Search, X, Command, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoginButton } from "@/components/auth/login-button";

interface TopBarProps {
  onMenuClick: () => void;
  onSearch: (q: string) => void;
  onLogoClick: () => void;
}

export function TopBar({ onMenuClick, onSearch, onLogoClick }: TopBarProps) {
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cmd/Ctrl+K to focus search
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Listen for the global "focus search" event (from keyboard shortcuts)
  useEffect(() => {
    function onFocusSearch() {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
    window.addEventListener("pwr-focus-search", onFocusSearch);
    return () => window.removeEventListener("pwr-focus-search", onFocusSearch);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim()) {
      onSearch(q.trim());
      inputRef.current?.blur();
    }
  }

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/40">
      <div className="flex items-center gap-3 px-4 lg:px-6 h-16">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden text-muted-foreground hover:text-foreground p-2 -ml-2 rounded-lg hover:bg-secondary/60 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo on mobile */}
        <button
          onClick={onLogoClick}
          className="lg:hidden flex items-center gap-2 group"
          aria-label="Mobiman home"
        >
          <div className="w-8 h-8 rounded-lg overflow-hidden pwr-glow">
            { }
            <img src="/icons/icon-192.png" alt="Mobiman" className="w-full h-full object-cover" />
          </div>
        </button>

        {/* Search */}
        <form onSubmit={submit} className="flex-1 max-w-2xl mx-auto">
          <div
            className={cn(
              "relative flex items-center rounded-full transition-all border",
              focused
                ? "border-primary/60 bg-background shadow-[0_0_24px_rgba(124,58,237,0.18)]"
                : "border-border/60 bg-secondary/50 hover:border-border"
            )}
          >
            <Search className="absolute left-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              type="text"
              placeholder="Search movies, TV shows, anime..."
              className="w-full bg-transparent pl-10 pr-20 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            {q ? (
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  inputRef.current?.focus();
                }}
                className="absolute right-3 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-secondary/80 transition-colors"
                aria-label="Clear"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="absolute right-3 hidden md:flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-background/60 border border-border/60 text-[10px] text-muted-foreground font-mono">
                <Command className="w-3 h-3" />K
              </kbd>
            )}
          </div>
        </form>

        {/* Status pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold">
          <span className="relative flex w-2 h-2">
            <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
            <span className="relative rounded-full w-2 h-2 bg-green-400" />
          </span>
          LIVE
        </div>

        {/* Login button */}
        <LoginButton />
      </div>
    </header>
  );
}
