"use client";

import { useState, useEffect, useCallback } from "react";
import type { MediaItem, AnimeItem, WatchTarget } from "@/lib/types";

export interface ContinueWatchingItem {
  id: string;
  title: string;
  poster: string;
  backdrop: string;
  year: string;
  type: "movie" | "tv" | "anime";
  source: "tmdb" | "anilist";
  tmdbId?: number;
  anilistId?: number;
  // current progress
  season?: number;
  episode?: number;
  progress: number; // 0-100 (percentage)
  duration: number; // seconds
  position: number; // seconds
  updatedAt: number;
}

const STORAGE_KEY = "pwr-continue-watching";
const MAX_ITEMS = 20;

function load(): ContinueWatchingItem[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function save(items: ContinueWatchingItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export function mediaToContinueItem(
  item: MediaItem | AnimeItem,
  opts: {
    season?: number;
    episode?: number;
    progress: number;
    duration: number;
    position: number;
  }
): ContinueWatchingItem {
  const isAnime = (item as AnimeItem).source === "anilist";
  return {
    id: item.id,
    title: item.title,
    poster: (item as any).poster || "",
    backdrop: (item as any).backdrop || (item as any).banner || (item as any).poster || "",
    year: (item as any).year || "",
    type: isAnime ? "anime" : (item as MediaItem).type,
    source: isAnime ? "anilist" : "tmdb",
    tmdbId: isAnime ? undefined : (item as MediaItem).tmdbId,
    anilistId: isAnime ? (item as AnimeItem).anilistId : undefined,
    season: opts.season,
    episode: opts.episode,
    progress: opts.progress,
    duration: opts.duration,
    position: opts.position,
    updatedAt: Date.now(),
  };
}

export function continueItemToTarget(item: ContinueWatchingItem): WatchTarget {
  return {
    source: item.source,
    type: item.type === "anime" ? "anime" : item.type,
    id: item.id,
    season: item.season,
    episode: item.episode,
  };
}

export function continueItemToMedia(item: ContinueWatchingItem): MediaItem | AnimeItem {
  if (item.source === "anilist") {
    return {
      id: item.id,
      anilistId: item.anilistId!,
      title: item.title,
      titleEnglish: item.title,
      poster: item.poster,
      banner: item.backdrop,
      synopsis: "",
      year: item.year,
      score: 0,
      type: "anime",
      format: "TV",
      episodes: null,
      status: "",
      genres: [],
      studios: [],
      source: "anilist",
    } as AnimeItem;
  }
  return {
    id: item.id,
    title: item.title,
    poster: item.poster,
    backdrop: item.backdrop,
    overview: "",
    year: item.year,
    rating: 0,
    type: item.type as any,
    tmdbId: item.tmdbId!,
  } as MediaItem;
}

export function useContinueWatching() {
  const [items, setItems] = useState<ContinueWatchingItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setItems(load());
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) setItems(load());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const track = useCallback(
    (
      item: MediaItem | AnimeItem,
      progress: { season?: number; episode?: number; position: number; duration: number }
    ) => {
      if (progress.duration < 10) return; // ignore very short
      const pct = Math.min(
        100,
        Math.max(0, (progress.position / progress.duration) * 100)
      );
      // Ignore if barely started (<5%) or basically done (>95% still counts)
      if (pct < 2) return;
      const newItem = mediaToContinueItem(item, {
        season: progress.season,
        episode: progress.episode,
        progress: pct,
        duration: progress.duration,
        position: progress.position,
      });
      setItems((prev) => {
        const filtered = prev.filter((i) => i.id !== newItem.id);
        const next = [newItem, ...filtered].slice(0, MAX_ITEMS);
        save(next);
        return next;
      });
    },
    []
  );

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      save(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    save([]);
  }, []);

  const clearFinished = useCallback(() => {
    setItems((prev) => {
      const next = prev.filter((i) => i.progress < 90);
      save(next);
      return next;
    });
  }, []);

  return {
    items,
    count: items.length,
    track,
    remove,
    clear,
    clearFinished,
    hydrated,
  };
}
