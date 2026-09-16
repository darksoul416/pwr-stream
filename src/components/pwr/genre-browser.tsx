"use client";

import { useEffect, useState } from "react";
import { Tag, Loader2, AlertTriangle, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ContentCard } from "./content-card";
import type { GenreItem, WatchTarget } from "@/lib/types";

interface GenreBrowserProps {
  type: "movie" | "tv";
  onCardClick?: (item: any, target: WatchTarget) => void;
}

interface Genre {
  id: number;
  name: string;
}

const POPULAR_GENRES: Record<"movie" | "tv", number[]> = {
  movie: [28, 35, 18, 878, 27, 10749, 53, 16, 12, 14],
  tv: [10759, 18, 35, 16, 10765, 9648, 80, 10766, 99, 10762],
};

export function GenreBrowser({ type, onCardClick }: GenreBrowserProps) {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [activeGenre, setActiveGenre] = useState<number | null>(null);
  const [items, setItems] = useState<GenreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsLoading, setItemsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/genre?type=list`);
        const data = await res.json();
        if (cancelled) return;
        const all = type === "movie" ? data.movie : data.tv;
        // Filter to popular genres only
        const popular = POPULAR_GENRES[type]
          .map((id) => all.find((g: Genre) => g.id === id))
          .filter(Boolean) as Genre[];
        setGenres(popular);
        if (popular[0]) {
          setActiveGenre(popular[0].id);
        }
      } catch {
        if (!cancelled) setGenres([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [type]);

  useEffect(() => {
    if (!activeGenre) return;
    let cancelled = false;
    setItemsLoading(true);
    setItems([]);
    (async () => {
      try {
        const res = await fetch(
          `/api/genre?type=${type}&genre=${activeGenre}&page=${page}`
        );
        const data = await res.json();
        if (cancelled) return;
        setItems(data.items || []);
        setTotalPages(Math.min(data.totalPages || 1, 50));
      } catch {
        // ignore
      } finally {
        if (!cancelled) setItemsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [type, activeGenre, page]);

  function selectGenre(id: number) {
    setActiveGenre(id);
    setPage(1);
  }

  function handleClick(item: GenreItem) {
    onCardClick?.(item, {
      source: "tmdb",
      type: item.type,
      id: item.id,
    });
  }

  if (loading) {
    return (
      <div className="px-4 lg:px-6 py-6">
        <div className="h-10 w-48 pwr-shimmer rounded-lg mb-6" />
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden bg-card/40 border border-border/40">
              <div className="aspect-[2/3] w-full pwr-shimmer" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-3xl md:text-5xl font-black tracking-tight pwr-gradient-text flex items-center gap-3">
          <Tag className="w-8 h-8 text-primary" />
          Browse by Genre
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {type === "movie" ? "Movies" : "TV Shows"} sorted by popularity within each genre
        </p>
      </div>

      {/* Genre chips */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0">
        {genres.map((g) => {
          const active = g.id === activeGenre;
          return (
            <button
              key={g.id}
              onClick={() => selectGenre(g.id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap border transition-all flex items-center gap-1.5",
                active
                  ? "bg-primary text-primary-foreground border-primary pwr-glow"
                  : "bg-secondary/50 text-foreground/70 hover:text-foreground border-border/60 hover:border-primary/40"
              )}
            >
              <Tag className="w-3 h-3" />
              {g.name}
            </button>
          );
        })}
      </div>

      {/* Items grid */}
      {itemsLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="py-24 text-center text-muted-foreground">
          No items found in this genre.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
            {items.map((item, i) => (
              <ContentCard
                key={item.id + i}
                item={{
                  id: item.id,
                  title: item.title,
                  poster: item.poster,
                  backdrop: item.backdrop,
                  overview: item.overview,
                  year: item.year,
                  rating: item.rating,
                  type: item.type,
                  tmdbId: item.tmdbId,
                } as any}
                index={i}
                onClick={() => handleClick(item)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-10 h-10 rounded-full border border-border/60 flex items-center justify-center hover:border-primary/60 hover:text-primary disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-4 py-2 rounded-full bg-secondary/60 border border-border/60 text-sm font-semibold">
                Page {page} <span className="text-muted-foreground">/ {totalPages}</span>
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-10 h-10 rounded-full border border-border/60 flex items-center justify-center hover:border-primary/60 hover:text-primary disabled:opacity-30 transition-colors"
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
