"use client";

import { useState, useEffect, useCallback } from "react";
import type { WatchlistItem, MediaItem, AnimeItem } from "@/lib/types";

const STORAGE_KEY = "pwr-watchlist";

function loadWatchlist(): WatchlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveWatchlist(items: WatchlistItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export function mediaToWatchlistItem(item: MediaItem | AnimeItem): WatchlistItem {
  if ((item as AnimeItem).source === "anilist") {
    const a = item as AnimeItem;
    return {
      id: a.id,
      title: a.title,
      poster: a.poster,
      backdrop: a.banner || a.poster,
      year: a.year,
      rating: a.score,
      type: "anime",
      source: "anilist",
      anilistId: a.anilistId,
      addedAt: Date.now(),
    };
  }
  const m = item as MediaItem;
  return {
    id: m.id,
    title: m.title,
    poster: m.poster,
    backdrop: m.backdrop || m.poster,
    year: m.year,
    rating: m.rating,
    type: m.type,
    source: "tmdb",
    tmdbId: m.tmdbId,
    addedAt: Date.now(),
  };
}

export function watchlistItemToMedia(item: WatchlistItem): MediaItem | AnimeItem {
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
      score: item.rating,
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
    rating: item.rating,
    type: item.type,
    tmdbId: item.tmdbId!,
    source: "tmdb" as any,
  } as MediaItem;
}

export function useWatchlist() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load on mount only (client-side) — defer setState via queueMicrotask
  // to avoid React's "setState in effect" warning while keeping SSR-safe.
  useEffect(() => {
    queueMicrotask(() => {
      setItems(loadWatchlist());
      setHydrated(true);
    });
  }, []);

  // Listen for cross-tab updates
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) {
        setItems(loadWatchlist());
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const isInWatchlist = useCallback(
    (id: string) => items.some((i) => i.id === id),
    [items]
  );

  const toggle = useCallback(
    (item: MediaItem | AnimeItem) => {
      const wli = mediaToWatchlistItem(item);
      setItems((prev) => {
        const exists = prev.some((i) => i.id === wli.id);
        const next = exists
          ? prev.filter((i) => i.id !== wli.id)
          : [wli, ...prev];
        saveWatchlist(next);
        return next;
      });
    },
    []
  );

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      saveWatchlist(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    saveWatchlist([]);
  }, []);

  return {
    items,
    count: items.length,
    isInWatchlist,
    toggle,
    remove,
    clear,
    hydrated,
  };
}
