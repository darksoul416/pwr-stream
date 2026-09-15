"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Flame, TrendingUp, Star, Calendar } from "lucide-react";
import { ContentRow } from "./content-row";
import { ContentCard } from "./content-card";
import type { MediaItem, AnimeItem, ViewName } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BrowseViewProps {
  view: Exclude<ViewName, "home" | "search" | "watch" | "mylist">;
  onCardClick: (item: MediaItem | AnimeItem) => void;
}

const SORT_OPTIONS: Record<string, { id: string; label: string; icon: any }[]> = {
  movies: [
    { id: "popular", label: "Popular", icon: Flame },
    { id: "top", label: "Top Rated", icon: Star },
    { id: "now", label: "Now Playing", icon: Calendar },
    { id: "upcoming", label: "Upcoming", icon: TrendingUp },
  ],
  tv: [
    { id: "popular", label: "Popular", icon: Flame },
    { id: "top", label: "Top Rated", icon: Star },
    { id: "now", label: "On The Air", icon: Calendar },
    { id: "upcoming", label: "Airing Today", icon: TrendingUp },
  ],
  anime: [
    { id: "popular", label: "Top Anime", icon: Flame },
    { id: "toprated", label: "Top Rated", icon: Star },
    { id: "airing", label: "This Season", icon: Calendar },
    { id: "upcoming", label: "Upcoming", icon: TrendingUp },
  ],
};

const TITLES: Record<string, { title: string; subtitle: string }> = {
  movies: { title: "Movies", subtitle: "Blockbusters, indies & timeless classics" },
  tv: { title: "TV Shows", subtitle: "Binge-worthy series from around the world" },
  anime: { title: "Anime", subtitle: "Top-tier animation from Japan & beyond" },
};

export function BrowseView({ view, onCardClick }: BrowseViewProps) {
  const [sort, setSort] = useState(SORT_OPTIONS[view][0].id);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<(MediaItem | AnimeItem)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setSort(SORT_OPTIONS[view][0].id);
    setPage(1);
  }, [view]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setItems([]);

    (async () => {
      try {
        const isAnime = view === "anime";
        const url = isAnime
          ? `/api/anilist?category=${sort}&page=${page}&limit=24`
          : `/api/browse?category=${view}&sort=${sort}&page=${page}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        setItems(data.items || []);
        setTotalPages(Math.min(data.totalPages || 1, 50));
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [view, sort, page]);

  const sortOpts = SORT_OPTIONS[view];
  const meta = TITLES[view];

  return (
    <div className="px-4 lg:px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl md:text-5xl font-black tracking-tight pwr-gradient-text">
          {meta.title}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{meta.subtitle}</p>
      </div>

      {/* Sort tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0">
        {sortOpts.map((opt) => {
          const Icon = opt.icon;
          const active = sort === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => {
                setSort(opt.id);
                setPage(1);
              }}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all border",
                active
                  ? "bg-primary text-primary-foreground border-primary pwr-glow"
                  : "bg-secondary/50 text-foreground/70 hover:text-foreground border-border/60 hover:border-primary/40"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <ContentRow title="" loading />
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <AlertTriangle className="w-12 h-12 text-destructive" />
          <p className="text-lg font-bold mt-3">Failed to load</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
          <button
            onClick={() => setPage((p) => p)}
            className="mt-5 px-4 py-2 rounded-full bg-primary text-primary-foreground font-semibold text-sm"
          >
            Retry
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="py-24 text-center text-muted-foreground">
          No results on this page.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
            {items.map((item, i) => (
              <ContentCard
                key={item.id + i}
                item={item}
                index={i}
                onClick={onCardClick}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-10 h-10 rounded-full border border-border/60 flex items-center justify-center hover:border-primary/60 hover:text-primary disabled:opacity-30 disabled:hover:border-border/60 disabled:hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-4 py-2 rounded-full bg-secondary/60 border border-border/60 text-sm font-semibold">
                Page {page} <span className="text-muted-foreground">/ {totalPages}</span>
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-10 h-10 rounded-full border border-border/60 flex items-center justify-center hover:border-primary/60 hover:text-primary disabled:opacity-30 disabled:hover:border-border/60 disabled:hover:text-foreground transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
