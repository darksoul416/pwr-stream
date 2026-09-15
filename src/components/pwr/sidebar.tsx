"use client";

import { Home, Film, Tv, Sparkles, Search, Heart, Radio, X, Zap, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ViewName } from "@/lib/types";
import { useWatchlist } from "@/hooks/use-watchlist";
import { InstallAppButton } from "./install-button";

interface SidebarProps {
  view: ViewName;
  onNavigate: (v: ViewName) => void;
  open: boolean;
  onClose: () => void;
}

const mainNav = [
  { id: "home" as const, label: "Home", icon: Home },
  { id: "movies" as const, label: "Movies", icon: Film },
  { id: "tv" as const, label: "TV Shows", icon: Tv },
  { id: "anime" as const, label: "Anime", icon: Sparkles },
];

const libraryNav = [
  { id: "mylist" as const, label: "My List", icon: Bookmark },
  { id: "search" as const, label: "Search", icon: Search },
];

export function Sidebar({ view, onNavigate, open, onClose }: SidebarProps) {
  const { count, hydrated } = useWatchlist();
  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed lg:sticky top-0 z-50 lg:z-30 h-screen w-64 shrink-0 bg-sidebar/95 backdrop-blur-xl border-r border-border/40 flex flex-col transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-border/40">
          <button
            onClick={() => onNavigate("home")}
            className="flex items-center gap-2.5 group"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary blur-md opacity-60 group-hover:opacity-90 transition-opacity" />
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-neon-pink flex items-center justify-center font-black text-white pwr-glow">
                <Zap className="w-5 h-5 fill-current" />
              </div>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-lg font-black tracking-tight pwr-gradient-text">
                PWR
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                STREAM
              </span>
            </div>
          </button>
          <button
            onClick={onClose}
            className="lg:hidden text-muted-foreground hover:text-foreground p-1"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
            Browse
          </p>
          {mainNav.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all relative group",
                  active
                    ? "bg-primary/15 text-primary pwr-border-glow"
                    : "text-foreground/70 hover:text-foreground hover:bg-secondary/60"
                )}
              >
                <Icon className="w-4.5 h-4.5 shrink-0" />
                {item.label}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full pwr-glow" />
                )}
              </button>
            );
          })}

          <p className="px-3 py-2 mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
            Discover
          </p>
          {libraryNav.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            const showCount = hydrated && item.id === "mylist" && count > 0;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all relative group",
                  active
                    ? "bg-primary/15 text-primary pwr-border-glow"
                    : "text-foreground/70 hover:text-foreground hover:bg-secondary/60"
                )}
              >
                <Icon className="w-4.5 h-4.5 shrink-0" />
                {item.label}
                {showCount && (
                  <span className="ml-auto px-1.5 min-w-[1.25rem] h-5 inline-flex items-center justify-center rounded-full text-[10px] font-bold bg-primary text-primary-foreground pwr-glow">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full pwr-glow" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer card */}
        <div className="p-3">
          <div className="relative rounded-2xl overflow-hidden border border-primary/30 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-4 pwr-border-glow">
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/30 rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Radio className="w-3.5 h-3.5 text-primary pwr-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  Live Now
                </span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Streaming all your favorite shows, movies & anime — free, no signup.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex -space-x-2">
                  {["a", "b", "c"].map((k) => (
                    <div
                      key={k}
                      className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-neon-cyan border-2 border-background"
                    />
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">
                  12.4k watching
                </span>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground/60 text-center mt-3 px-2 leading-relaxed">
            Streams via vidlove.cc &amp; AniList.<br/>
            For educational purposes only.
          </p>

          {/* Install App button */}
          <div className="mt-3">
            <InstallAppButton variant="full" />
          </div>
        </div>
      </aside>
    </>
  );
}
