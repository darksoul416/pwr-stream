"use client";

import { useEffect, useState } from "react";
import { Play, Star, Calendar, Info, ChevronLeft, ChevronRight, Flame } from "lucide-react";
import type { MediaItem } from "@/lib/types";

interface HeroBannerProps {
  items: MediaItem[];
  onPlay: (item: MediaItem) => void;
  onInfo?: (item: MediaItem) => void;
}

export function HeroBanner({ items, onPlay, onInfo }: HeroBannerProps) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || items.length <= 1) return;
    const t = setInterval(() => {
      setActive((a) => (a + 1) % items.length);
    }, 7000);
    return () => clearInterval(t);
  }, [paused, items.length]);

  if (!items.length) {
    return (
      <div className="relative h-[44vh] md:h-[60vh] w-full rounded-3xl overflow-hidden pwr-shimmer mb-8" />
    );
  }

  const item = items[active];
  const backdrop = item.backdrop || item.poster;
  const typeLabel = item.type === "movie" ? "Movie" : item.type === "tv" ? "TV Series" : "Anime";

  return (
    <div
      className="relative h-[44vh] md:h-[62vh] w-full rounded-3xl overflow-hidden mb-8 group"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Backdrop */}
      {backdrop && (
         
        <img
          src={backdrop}
          alt={item.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[8000ms] ease-out"
          style={{ transform: paused ? "scale(1.0)" : "scale(1.08)" }}
          referrerPolicy="no-referrer"
        />
      )}

      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/40 to-transparent" />
      <div className="absolute inset-0 pwr-grid-bg opacity-30 mix-blend-overlay" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-10">
        <div className="max-w-2xl space-y-3 md:space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary border border-primary/40 flex items-center gap-1 pwr-glow">
              <Flame className="w-3 h-3" />
              Trending
            </span>
            <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-black/60 backdrop-blur-sm text-white/80 border border-white/10">
              {typeLabel}
            </span>
            {item.rating > 0 && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-400/30">
                <Star className="w-3 h-3 fill-current" />
                {item.rating.toFixed(1)}
              </span>
            )}
            {item.year && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-black/60 backdrop-blur-sm text-white/80 border border-white/10">
                <Calendar className="w-3 h-3" />
                {item.year}
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-6xl font-black leading-[1.05] tracking-tight pwr-text-glow">
            {item.title}
          </h1>

          <p className="text-sm md:text-base text-foreground/80 line-clamp-2 md:line-clamp-3 leading-relaxed">
            {item.overview || "No description available."}
          </p>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => onPlay(item)}
              className="flex items-center gap-2 px-5 md:px-7 py-2.5 md:py-3 rounded-full bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all hover:scale-105 pwr-glow"
            >
              <Play className="w-4 h-4 fill-current" />
              Watch Now
            </button>
            {onInfo && (
              <button
                onClick={() => onInfo(item)}
                className="flex items-center gap-2 px-5 py-2.5 md:py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-foreground font-bold text-sm hover:bg-white/20 transition-all"
              >
                <Info className="w-4 h-4" />
                Details
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dot navigation */}
      {items.length > 1 && (
        <div className="absolute bottom-4 right-5 md:right-8 flex items-center gap-1.5">
          {items.slice(0, 8).map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === active ? "w-7 bg-primary pwr-glow" : "w-2 bg-white/30 hover:bg-white/60"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Arrow controls */}
      {items.length > 1 && (
        <>
          <button
            onClick={() =>
              setActive((a) => (a - 1 + items.length) % items.length)
            }
            className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 md:w-10 md:h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:bg-primary/60 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActive((a) => (a + 1) % items.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 md:w-10 md:h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:bg-primary/60 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
}
