"use client";

import { Heart, Trash2, Bookmark } from "lucide-react";
import { ContentCard } from "./content-card";
import { useWatchlist, watchlistItemToMedia } from "@/hooks/use-watchlist";
import type { MediaItem, AnimeItem } from "@/lib/types";

interface MyListViewProps {
  onCardClick: (item: MediaItem | AnimeItem) => void;
}

export function MyListView({ onCardClick }: MyListViewProps) {
  const { items, remove, clear, count, hydrated } = useWatchlist();

  if (!hydrated) {
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center pwr-glow">
              <Heart className="w-4 h-4 text-primary fill-current" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black pwr-gradient-text">
              My List
            </h1>
          </div>
          <p className="text-sm text-muted-foreground ml-12">
            {count === 0
              ? "Your saved titles will appear here"
              : `${count} saved ${count === 1 ? "title" : "titles"}`}
          </p>
        </div>
        {count > 0 && (
          <button
            onClick={() => {
              if (confirm("Remove all titles from My List?")) clear();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive/25 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear all
          </button>
        )}
      </div>

      {count === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/50 py-24 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary/40 flex items-center justify-center">
            <Bookmark className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-bold">Your list is empty</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Hover over any movie, TV show, or anime card and tap the heart icon
            to save it here for later.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
          {items.map((item, i) => (
            <div key={item.id} className="relative group">
              <ContentCard
                item={watchlistItemToMedia(item)}
                index={i}
                onClick={onCardClick}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  remove(item.id);
                }}
                aria-label="Remove from My List"
                className="absolute top-2 right-2 z-20 w-7 h-7 rounded-full bg-destructive text-white border border-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
