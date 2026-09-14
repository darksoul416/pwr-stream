"use client";

import { ContentCard, ContentCardSkeleton } from "./content-card";
import type { MediaItem, AnimeItem } from "@/lib/types";

interface ContentRowProps {
  title: string;
  subtitle?: string;
  items?: (MediaItem | AnimeItem)[];
  loading?: boolean;
  onCardClick?: (item: MediaItem | AnimeItem) => void;
  seeAll?: () => void;
  accent?: "primary" | "cyan" | "pink";
}

const accentMap = {
  primary: "from-primary/60",
  cyan: "from-neon-cyan/60",
  pink: "from-neon-pink/60",
};

export function ContentRow({
  title,
  subtitle,
  items,
  loading,
  onCardClick,
  seeAll,
  accent = "primary",
}: ContentRowProps) {
  return (
    <section className="mb-8">
      <div className="flex items-end justify-between mb-3 px-1">
        <div className="flex items-baseline gap-3">
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <span
              className={`inline-block w-1.5 h-7 rounded-full bg-gradient-to-b ${accentMap[accent]} to-transparent`}
            />
            <span className="pwr-gradient-text">{title}</span>
          </h2>
          {subtitle && (
            <span className="text-xs text-muted-foreground hidden md:inline">
              {subtitle}
            </span>
          )}
        </div>
        {seeAll && (
          <button
            onClick={seeAll}
            className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors px-3 py-1 rounded-full border border-primary/30 hover:border-primary/60 hover:bg-primary/10"
          >
            See all →
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ContentCardSkeleton key={i} />
          ))}
        </div>
      ) : !items || items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/50 py-12 text-center text-muted-foreground text-sm">
          No content available right now.
        </div>
      ) : (
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
      )}
    </section>
  );
}
