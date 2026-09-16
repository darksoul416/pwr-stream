"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { HeroBanner } from "./hero-banner";
import { ContentRow } from "./content-row";
import { ComingSoonRow } from "./coming-soon-row";
import { ContinueWatchingRow } from "./continue-watching-row";
import { AdSlot } from "./ad-slot";
import { useContinueWatching, continueItemToTarget } from "@/hooks/use-continue-watching";
import type { MediaItem, AnimeItem, ComingSoonItem, WatchTarget, ViewName } from "@/lib/types";

interface HomeViewProps {
  onCardClick: (item: MediaItem | AnimeItem) => void;
  onSeeAll: (view: Exclude<ViewName, "home" | "search" | "watch" | "mylist" | "history" | "genres">) => void;
  onWatchTarget?: (target: WatchTarget) => void;
}

export function HomeView({ onCardClick, onSeeAll, onWatchTarget }: HomeViewProps) {
  const [trending, setTrending] = useState<MediaItem[]>([]);
  const [movies, setMovies] = useState<MediaItem[]>([]);
  const [tv, setTv] = useState<MediaItem[]>([]);
  const [anime, setAnime] = useState<AnimeItem[]>([]);
  const [comingSoon, setComingSoon] = useState<ComingSoonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { items: continueItems, remove: removeContinue, hydrated: continueHydrated } = useContinueWatching();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    (async () => {
      try {
        const [t, m, tv2, a, cs] = await Promise.all([
          fetch("/api/browse?category=trending&page=1").then((r) => r.json()),
          fetch("/api/browse?category=movies&sort=popular&page=1").then((r) => r.json()),
          fetch("/api/browse?category=tv&sort=popular&page=1").then((r) => r.json()),
          fetch("/api/anilist?category=top&limit=18").then((r) => r.json()),
          fetch("/api/coming-soon?type=all").then((r) => r.json()),
        ]);

        if (cancelled) return;
        setTrending(t.items || []);
        setMovies(m.items || []);
        setTv(tv2.items || []);
        setAnime(a.items || []);
        setComingSoon(cs.items || []);
      } catch (e) {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="px-4 lg:px-6 py-6">
        <div className="h-[44vh] md:h-[62vh] w-full rounded-3xl pwr-shimmer mb-8" />
        {[1, 2, 3, 4].map((i) => (
          <ContentRow key={i} title="" loading />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <AlertTriangle className="w-12 h-12 text-destructive" />
        <p className="text-lg font-bold mt-3">Connection issue</p>
        <p className="text-sm text-muted-foreground mt-1">
          Could not reach streaming sources. Try again in a moment.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-5 px-4 py-2 rounded-full bg-primary text-primary-foreground font-semibold text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  // Top 6 trending for hero
  const heroItems = trending.slice(0, 6);

  function handleCardClick(item: MediaItem | AnimeItem) {
    onCardClick(item);
  }

  function handleComingSoonClick(target: WatchTarget) {
    onWatchTarget?.(target);
  }

  return (
    <div className="px-4 lg:px-6 py-6">
      <HeroBanner
        items={heroItems}
        onPlay={(item) => handleCardClick(item)}
        onInfo={(item) => handleCardClick(item)}
      />

      {/* Continue Watching row (only shows if there's history) */}
      <ContinueWatchingRow
        items={continueItems.slice(0, 10)}
        onResume={(target) => onWatchTarget?.(target)}
        onRemove={removeContinue}
        loading={!continueHydrated}
      />

      <ComingSoonRow
        items={comingSoon.slice(0, 18)}
        onCardClick={handleComingSoonClick}
      />

      {/* Ad slot (only shows when ads are enabled in monetization config) */}
      <AdSlot currentView="home" format="horizontal" className="mb-8" />

      <ContentRow
        title="Trending Now"
        subtitle="What everyone is watching this week"
        items={trending.slice(0, 18)}
        onCardClick={onCardClick}
        accent="primary"
        seeAll={() => {}}
      />

      <ContentRow
        title="Popular Anime"
        subtitle="Top anime by popularity"
        items={anime}
        onCardClick={onCardClick}
        accent="cyan"
        seeAll={() => onSeeAll("anime")}
      />

      <ContentRow
        title="Popular Movies"
        subtitle="Blockbusters & recent releases"
        items={movies}
        onCardClick={onCardClick}
        accent="pink"
        seeAll={() => onSeeAll("movies")}
      />

      <ContentRow
        title="Popular TV Shows"
        subtitle="Most-watched series right now"
        items={tv}
        onCardClick={onCardClick}
        accent="primary"
        seeAll={() => onSeeAll("tv")}
      />
    </div>
  );
}
