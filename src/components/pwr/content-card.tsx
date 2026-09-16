"use client";

import { useState } from "react";
import { Star, Play, Calendar, Heart, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWatchlist } from "@/hooks/use-watchlist";
import type { MediaItem, AnimeItem } from "@/lib/types";

interface ContentCardProps {
  item: MediaItem | AnimeItem;
  onClick?: (item: MediaItem | AnimeItem) => void;
  index?: number;
}

function isAnimeItem(item: any): item is AnimeItem {
  return item.source === "anilist";
}

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "Airing now";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function ratingOf(item: MediaItem | AnimeItem): number {
  if (isAnimeItem(item)) return item.score;
  return (item as MediaItem).rating;
}

function yearOf(item: MediaItem | AnimeItem): string {
  return (item as any).year || "";
}

function typeLabel(item: MediaItem | AnimeItem): string {
  if (isAnimeItem(item)) {
    return item.format || item.type || "ANIME";
  }
  const t = (item as MediaItem).type;
  return t === "movie" ? "MOVIE" : t === "tv" ? "TV" : "ANIME";
}

export function ContentCard({ item, onClick, index = 0 }: ContentCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const { isInWatchlist, toggle, hydrated } = useWatchlist();
  const title = item.title || "Untitled";
  const poster = (item as any).poster || "";
  const rating = ratingOf(item);
  const year = yearOf(item);
  const typeLabelStr = typeLabel(item);
  const inList = hydrated && isInWatchlist(item.id);
  const airing = isAnimeItem(item) ? item.nextAiringEpisode : null;

  return (
    <div
      onClick={() => onClick?.(item)}
      className="group relative flex flex-col text-left rounded-xl overflow-hidden bg-card/40 border border-border/40 hover:border-primary/60 pwr-card-hover focus:outline-none focus:ring-2 focus:ring-primary/60 transition-all cursor-pointer"
      style={{ animationDelay: `${Math.min(index * 30, 600)}ms` }}
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted/30">
        {!imgLoaded && (
          <div className="absolute inset-0 pwr-shimmer" />
        )}
        {poster && (
           
          <img
            src={poster}
            alt={title}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105",
              imgLoaded ? "opacity-100" : "opacity-0"
            )}
            referrerPolicy="no-referrer"
          />
        )}

        {/* Type chip */}
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide bg-black/70 backdrop-blur-md text-white border border-white/10 uppercase">
          {typeLabelStr}
        </div>

        {/* Watchlist heart button (top-right) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggle(item);
          }}
          aria-label={inList ? "Remove from My List" : "Add to My List"}
          className={cn(
            "absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md border transition-all z-10",
            inList
              ? "bg-primary text-primary-foreground border-primary pwr-glow"
              : "bg-black/70 text-white/80 border-white/10 hover:bg-primary/80 hover:text-primary-foreground opacity-0 group-hover:opacity-100"
          )}
        >
          <Heart className={cn("w-3.5 h-3.5", inList && "fill-current")} />
        </button>

        {/* Airing countdown badge (below type, left) */}
        {airing && (
          <div className="absolute top-10 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary/80 backdrop-blur-md text-primary-foreground border border-primary/40 pwr-glow">
            <Clock className="w-2.5 h-2.5" />
            EP {airing.episode} · {formatCountdown(airing.timeUntilAiring)}
          </div>
        )}

        {/* Rating chip (move to bottom-left if airing, else top-right under heart) */}
        {rating > 0 && (
          <div className={cn(
            "absolute flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/70 backdrop-blur-md text-yellow-300 border border-yellow-400/30",
            airing ? "bottom-11 left-2" : "top-10 left-2"
          )}>
            <Star className="w-2.5 h-2.5 fill-current" />
            {rating.toFixed(1)}
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-100">
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2">
            <span className="flex items-center gap-1 text-[10px] text-white/80 font-medium">
              <Calendar className="w-3 h-3" />
              {year || "—"}
            </span>
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/90 group-hover:bg-primary text-primary-foreground shadow-lg group-hover:scale-110 transition-all pwr-glow">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="p-2.5">
        <h3 className="text-sm font-semibold leading-tight line-clamp-2 text-foreground/90 group-hover:text-primary transition-colors">
          {title}
        </h3>
        {isAnimeItem(item) && item.studios?.length > 0 && (
          <p className="text-[10px] text-muted-foreground mt-1 truncate">
            {item.studios.join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}

export function ContentCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden bg-card/40 border border-border/40">
      <div className="aspect-[2/3] w-full pwr-shimmer" />
      <div className="p-2.5 space-y-2">
        <div className="h-3 w-3/4 rounded pwr-shimmer" />
        <div className="h-2 w-1/2 rounded pwr-shimmer" />
      </div>
    </div>
  );
}
