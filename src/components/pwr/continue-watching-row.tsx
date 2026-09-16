"use client";

import { useState } from "react";
import { Play, Clock, Trash2, X, History } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ContinueWatchingItem, WatchTarget } from "@/lib/types";

interface ContinueWatchingRowProps {
  items: ContinueWatchingItem[];
  onResume?: (target: WatchTarget) => void;
  onRemove?: (id: string) => void;
  loading?: boolean;
}

function formatTime(seconds: number): string {
  if (!seconds || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ContinueWatchingRow({ items, onResume, onRemove, loading }: ContinueWatchingRowProps) {
  if (loading) {
    return (
      <section className="mb-8">
        <h2 className="text-xl md:text-2xl font-extrabold tracking-tight mb-3 px-1 flex items-center gap-2">
          <span className="inline-block w-1.5 h-7 rounded-full bg-gradient-to-b from-primary/60 to-transparent" />
          <span className="pwr-gradient-text">Continue Watching</span>
        </h2>
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-64 md:w-72 shrink-0 rounded-xl overflow-hidden bg-card/40 border border-border/40">
              <div className="aspect-video w-full pwr-shimmer" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!items || items.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-end justify-between mb-3 px-1">
        <div className="flex items-baseline gap-3">
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <span className="inline-block w-1.5 h-7 rounded-full bg-gradient-to-b from-primary/60 to-transparent" />
            <span className="pwr-gradient-text">Continue Watching</span>
          </h2>
          <span className="text-xs text-muted-foreground hidden md:inline">
            Pick up where you left off
          </span>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0">
        {items.map((item, i) => (
          <ContinueWatchingCard
            key={item.id + i}
            item={item}
            onResume={() =>
              onResume?.({
                source: item.source,
                type: item.type === "anime" ? "anime" : item.type,
                id: item.id,
                season: item.season,
                episode: item.episode,
              })
            }
            onRemove={() => onRemove?.(item.id)}
          />
        ))}
      </div>
    </section>
  );
}

function ContinueWatchingCard({
  item,
  onResume,
  onRemove,
}: {
  item: ContinueWatchingItem;
  onResume: () => void;
  onRemove: () => void;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <button
      onClick={onResume}
      className="group relative w-64 md:w-72 shrink-0 flex flex-col text-left rounded-xl overflow-hidden bg-card/40 border border-border/40 hover:border-primary/60 pwr-card-hover transition-all"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-muted/30">
        {!imgLoaded && <div className="absolute inset-0 pwr-shimmer" />}
        {item.backdrop && (
           
          <img
            src={item.backdrop}
            alt={item.title}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105",
              imgLoaded ? "opacity-100" : "opacity-0"
            )}
            referrerPolicy="no-referrer"
          />
        )}

        {/* Play button overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-100">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-primary/90 group-hover:bg-primary text-primary-foreground shadow-lg group-hover:scale-110 transition-all pwr-glow flex items-center justify-center">
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </div>
          </div>
        </div>

        {/* Episode badge (TV/anime) */}
        {item.season && item.episode && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/70 backdrop-blur-md text-white border border-white/10 uppercase">
            S{item.season} · E{item.episode}
          </div>
        )}

        {/* Remove button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label="Remove from Continue Watching"
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:bg-destructive hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/60">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${item.progress}%` }}
          />
        </div>
      </div>

      <div className="p-3">
        <h3 className="text-sm font-semibold leading-tight line-clamp-1 text-foreground/90 group-hover:text-primary transition-colors">
          {item.title}
        </h3>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            {formatTime(item.position)} / {formatTime(item.duration)}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {Math.round(item.progress)}% done
          </span>
        </div>
      </div>
    </button>
  );
}
