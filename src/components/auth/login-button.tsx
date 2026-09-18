"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
import { LogOut, User as UserIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWatchlist } from "@/hooks/use-watchlist";
import { AuthModal } from "./auth-modal";
import type { User } from "@supabase/supabase-js";

export function LoginButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const menuRef = useRef<HTMLDivElement>(null);
  const { count } = useWatchlist();
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) {
    return <div className="w-9 h-9 rounded-full bg-secondary/60 animate-pulse" />;
  }

  // Not logged in
  if (!user) {
    return (
      <>
        <button
          onClick={() => { setAuthMode("login"); setAuthModalOpen(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30 transition-colors"
        >
          <UserIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Login</span>
        </button>
        <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} initialMode={authMode} />
      </>
    );
  }

  // Logged in
  const name = user.user_metadata?.name || user.email?.split("@")[0] || "User";

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-full bg-secondary/60 border border-border/60 hover:border-primary/60 transition-colors"
        >
          <div className="w-6 h-6 rounded-full bg-primary/40 flex items-center justify-center">
            <UserIcon className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="text-xs font-semibold hidden sm:inline max-w-[80px] truncate">{name}</span>
          <ChevronDown className={cn("w-3 h-3 transition-transform", menuOpen && "rotate-180")} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border/60 bg-popover/95 backdrop-blur-xl shadow-2xl overflow-hidden z-50">
            <div className="p-3 border-b border-border/40">
              <p className="text-sm font-bold truncate">{name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
            </div>
            <div className="p-2 space-y-1">
              <div className="px-3 py-1.5 text-xs text-foreground/70 flex items-center justify-between">
                <span>My List</span>
                <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">{count}</span>
              </div>
              <div className="border-t border-border/40 my-1" />
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
