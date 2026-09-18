"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Sidebar } from "@/components/pwr/sidebar";
import { TopBar } from "@/components/pwr/topbar";
import { HomeView } from "@/components/pwr/home-view";
import { BrowseView } from "@/components/pwr/browse-view";
import { SearchView } from "@/components/pwr/search-view";
import { WatchView } from "@/components/pwr/watch-view";
import { MyListView } from "@/components/pwr/my-list-view";
import { HistoryView } from "@/components/pwr/history-view";
import { GenreBrowser } from "@/components/pwr/genre-browser";
import { KeyboardShortcutsHelp } from "@/components/pwr/keyboard-shortcuts-help";
import { InstallAppButton } from "@/components/pwr/install-button";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useTheme } from "@/hooks/use-theme";
import type { MediaItem, AnimeItem, ViewName, WatchTarget } from "@/lib/types";

export default function Home() {
  const [view, setView] = useState<ViewName>("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [watchTarget, setWatchTarget] = useState<WatchTarget | null>(null);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { toggleMode } = useTheme();

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [view, watchTarget]);

  const navigate = useCallback((v: ViewName) => {
    setView(v);
    setSidebarOpen(false);
    if (v !== "watch") setWatchTarget(null);
    if (v !== "search") setSearchQuery("");
  }, []);

  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
    setView("search");
    setSidebarOpen(false);
  }, []);

  const handleWatchTarget = useCallback((target: WatchTarget) => {
    setWatchTarget(target);
    setView("watch");
    setSidebarOpen(false);
  }, []);

  const handleCardClick = useCallback((item: MediaItem | AnimeItem) => {
    const isAnime = (item as AnimeItem).source === "anilist";
    const target: WatchTarget = isAnime
      ? {
          source: "anilist",
          type: "anime",
          id: (item as AnimeItem).id,
        }
      : {
          source: "tmdb",
          type: (item as MediaItem).type,
          id: (item as MediaItem).id,
        };
    handleWatchTarget(target);
  }, [handleWatchTarget]);

  const handleSeeAll = useCallback((v: "movies" | "tv" | "anime") => {
    setView(v);
  }, []);

  // Focus the topbar search input — we use a global event to coordinate
  const focusSearch = useCallback(() => {
    // TopBar has its own input with Cmd/Ctrl+K handler
    // Dispatch a custom event that TopBar listens for
    window.dispatchEvent(new CustomEvent("pwr-focus-search"));
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNavigate: navigate,
    onSearchFocus: focusSearch,
    onToggleSidebar: () => setSidebarOpen((s) => !s),
    onShowHelp: () => setShowShortcutsHelp(true),
    onCloseModal: () => {
      setShowShortcutsHelp(false);
      setSidebarOpen(false);
    },
    onToggleTheme: toggleMode,
    onBack: () => navigate("home"),
  });

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <Sidebar
        view={view}
        onNavigate={navigate}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          onMenuClick={() => setSidebarOpen(true)}
          onSearch={handleSearch}
          onLogoClick={() => navigate("home")}
        />

        <main className="flex-1">
          {view === "home" && (
            <HomeView
              onCardClick={handleCardClick}
              onSeeAll={handleSeeAll}
              onWatchTarget={handleWatchTarget}
            />
          )}
          {view === "movies" && (
            <BrowseView view="movies" onCardClick={handleCardClick} />
          )}
          {view === "tv" && (
            <BrowseView view="tv" onCardClick={handleCardClick} />
          )}
          {view === "anime" && (
            <BrowseView view="anime" onCardClick={handleCardClick} />
          )}
          {view === "search" && (
            <SearchView
              query={searchQuery}
              onCardClick={handleCardClick}
              onClear={() => navigate("home")}
            />
          )}
          {view === "mylist" && (
            <MyListView onCardClick={handleCardClick} />
          )}
          {view === "history" && (
            <HistoryView onResume={handleWatchTarget} />
          )}
          {view === "genres" && (
            <GenreBrowser
              type="movie"
              onCardClick={(_, target) => handleWatchTarget(target)}
            />
          )}
          {view === "watch" && watchTarget && (
            <WatchView
              target={watchTarget}
              onBack={() => navigate("home")}
              onPlayItem={handleCardClick}
            />
          )}
        </main>

        {/* Mobile install banner (shows once, dismissible) */}
        <InstallAppButton variant="banner" />

        {/* Footer */}
        <footer className="mt-auto border-t border-border/40 bg-sidebar/40 backdrop-blur-sm">
          <div className="px-6 py-8 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center font-black text-white text-sm pwr-glow">
                  N
                </div>
                <div>
                  <p className="font-black tracking-tight text-red-600">
                    NETFLIX CLONE
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Watch anime, movies & TV — free
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>Data via TMDB, AniList</span>
                <span className="hidden md:inline">·</span>
                <span>Streams via vidlove.cc</span>
                <span className="hidden md:inline">·</span>
                <button
                  onClick={() => setShowShortcutsHelp(true)}
                  className="text-foreground/60 hover:text-primary transition-colors"
                >
                  Press <kbd className="font-mono font-bold">?</kbd> for shortcuts
                </button>
              </div>
            </div>
            <p className="mt-6 text-[10px] text-muted-foreground/60 leading-relaxed">
              Netflix Clone aggregates publicly available metadata from The Movie
              Database (TMDB) and AniList, and embeds video streams from
              vidlove.cc. We do not host any content ourselves. All trademarks,
              logos and content belong to their respective owners.
            </p>
          </div>
        </footer>
      </div>

      {/* Keyboard shortcuts help overlay */}
      <KeyboardShortcutsHelp
        open={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />
    </div>
  );
}
