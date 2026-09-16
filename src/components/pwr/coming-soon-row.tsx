"use client";

import { useState } from "react";
import { Calendar, Star, Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComingSoonItem, WatchTarget } from "@/lib/types";

interface ComingSoonRowProps {
  items: ComingSoonItem[];
  loading?: boolean;
  onCardClick?: (target: WatchTarget) => void;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "TBA";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function daysLabel(days: number): { text: string; tone: "soon" | "near" | "far" } {
  if (days === 0) return { text: "Today", tone: "soon" };
  if (days === 1) return { text: "Tomorrow", tone: "soon" };
  if (days <= 7) return { text: `In ${days} days`, tone: "soon" };
  if (days <= 30) return { text: `In ${days} days`, tone: "near" };
  return { text: `In ${Math.floor(days / 7)} weeks`, tone: "far" };
}

export function ComingSoonRow({ items, loading, onCardClick }: ComingSoonRowProps) {
  if (loading) {
    return (
      <section className="mb-8">
        <h2 className="text-xl md:text-2xl font-extrabold tracking-tight mb-3 px-1 flex items-center gap-2">
          <span className="inline-block w-1.5 h-7 rounded-full bg-gradient-to-b from-neon-cyan/60 to-transparent" />
          <span className="pwr-gradient-text">Coming Soon</span>
        </h2>
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-40 md:w-48 shrink-0 rounded-xl overflow-hidden bg-card/40 border border-border/40">
              <div className="aspect-[2/3] w-full pwr-shimmer" />
              <div className="p-2.5 space-y-2">
                <div className="h-3 w-3/4 rounded pwr-shimmer" />
                <div className="h-2 w-1/2 rounded pwr-shimmer" />
              </div>
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
            <span className="inline-block w-1.5 h-7 rounded-full bg-gradient-to-b from-neon-cyan/60 to-transparent" />
            <span className="pwr-gradient-text">Coming Soon</span>
          </h2>
          <span className="text-xs text-muted-foreground hidden md:inline">
            Upcoming releases in the next 90 days
          </span>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-thin">
        {items.map((item, i) => {
          const dlabel = daysLabel(item.daysUntil);
          return (
            <ComingSoonCard
              key={item.id + i}
              item={item}
              daysLabel={dlabel}
              onClick={() =>
                onCardClick?.({
                  source: "tmdb",
                  type: item.type,
                  id: item.id,
                })
              }
            />
          );
        })}
      </div>
    </section>
  );
}

function ComingSoonCard({
  item,
  daysLabel,
  onClick,
}: {
  item: ComingSoonItem;
  daysLabel: { text: string; tone: "soon" | "near" | "far" };
  onClick: () => void;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);

  const toneClass = {
    soon: "bg-primary text-primary-foreground pwr-glow",
    near: "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40",
    far: "bg-secondary/60 text-foreground/80 border border-border/60",
  }[daysLabel.tone];

  return (
    <button
      onClick={onClick}
      className="group relative w-40 md:w-48 shrink-0 flex flex-col text-left rounded-xl overflow-hidden bg-card/40 border border-border/40 hover:border-primary/60 pwr-card-hover transition-all"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted/30">
        {!imgLoaded && <div className="absolute inset-0 pwr-shimmer" />}
        {item.poster && (
           
          <img
            src={item.poster}
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

        {/* Type chip */}
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide bg-black/70 backdrop-blur-md text-white border border-white/10 uppercase flex items-center gap-1">
          {item.type === "movie" ? <Sparkles className="w-2.5 h-2.5" /> : <Calendar className="w-2.5 h-2.5" />}
          {item.type === "movie" ? "Movie" : "TV"}
        </div>

        {/* Days-until countdown badge */}
        <div className={cn(
          "absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold backdrop-blur-md border border-white/10 flex items-center gap-1",
          toneClass
        )}>
          <Clock className="w-2.5 h-2.5" />
          {daysLabel.text}
        </div>

        {/* Rating */}
        {item.rating > 0 && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/70 backdrop-blur-md text-yellow-300 border border-yellow-400/30">
            <Star className="w-2.5 h-2.5 fill-current" />
            {item.rating.toFixed(1)}
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-100">
          <div className="absolute bottom-2 right-2 text-[10px] text-white/70 font-medium">
            {formatDate(item.releaseDate)}
          </div>
        </div>
      </div>

      <div className="p-2.5">
        <h3 className="text-sm font-semibold leading-tight line-clamp-2 text-foreground/90 group-hover:text-primary transition-colors">
          {item.title}
        </h3>
        <p className="text-[10px] text-muted-foreground mt-1">
          {item.releaseDate ? formatDate(item.releaseDate) : "Release TBA"}
        </p>
      </div>
    </button>
  );
}
