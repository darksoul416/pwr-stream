"use client";

import { useState, useRef, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { Github, LogOut, User, ChevronDown, Crown, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWatchlist } from "@/hooks/use-watchlist";

export function LoginButton() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { count } = useWatchlist();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Loading state
  if (status === "loading") {
    return (
      <div className="w-9 h-9 rounded-full bg-secondary/60 animate-pulse" />
    );
  }

  // Not logged in
  if (!session) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => signIn("github")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-secondary/60 border border-border/60 hover:border-primary/60 hover:bg-primary/20 transition-colors"
          title="Log in with GitHub"
        >
          <Github className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Login</span>
        </button>
      </div>
    );
  }

  // Logged in
  const user = session.user;
  const name = user?.name || user?.email?.split("@")[0] || "User";
  const image = user?.image;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-full bg-secondary/60 border border-border/60 hover:border-primary/60 transition-colors"
      >
        {image ? (
           
          <img
            src={image}
            alt={name}
            className="w-6 h-6 rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-primary/40 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
        )}
        <span className="text-xs font-semibold hidden sm:inline max-w-[80px] truncate">
          {name}
        </span>
        <ChevronDown className={cn("w-3 h-3 transition-transform", menuOpen && "rotate-180")} />
      </button>

      {/* Dropdown menu */}
      {menuOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border/60 bg-popover/95 backdrop-blur-xl shadow-2xl overflow-hidden z-50">
          {/* User info */}
          <div className="p-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              {image && (
                 
                <img
                  src={image}
                  alt={name}
                  className="w-10 h-10 rounded-full"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold truncate">{name}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="p-2 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Account
            </div>
            <div className="px-3 py-1.5 text-xs text-foreground/70 flex items-center justify-between">
              <span>My List</span>
              <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                {count}
              </span>
            </div>
            <div className="px-3 py-1.5 text-xs text-foreground/70">
              Login via: <span className="font-bold text-primary capitalize">{(user as any).provider}</span>
            </div>

            <div className="border-t border-border/40 my-1" />

            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
