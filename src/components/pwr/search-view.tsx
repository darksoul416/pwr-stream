"use client";

import { useEffect, useState, useRef } from "react";
import { Search, AlertTriangle, Loader2, X, Sparkles, Film, Tv } from "lucide-react";
import { ContentCard, ContentCardSkeleton } from "./content-card";
import type { MediaItem, AnimeItem, ViewName } from "@/lib/types";

interface SearchViewProps {
  query: string;
  onCardClick: (item: MediaItem | AnimeItem) => void;
  onClear: () => void;
}

export function SearchView({ query, onCardClick, onClear }: SearchViewProps) {
  const [results, setResults] = useState<(MediaItem | AnimeItem)[]>([]);
  const [animeResults, setAnimeResults] = useState<AnimeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<"all" | "movies" | "tv" | "anime">("all");

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setAnimeResults([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);
    setResults([]);
    setAnimeResults([]);

    (async () => {
      try {
        const [tmdbRes, anilistRes] = await Promise.all([
          fetch(`/api/search?q=${encodeURIComponent(query)}&page=1`).then((r) =>
            r.json()
          ),
          fetch(`/api/anilist?q=${encodeURIComponent(query)}&limit=12`).then(
            (r) => r.json()
          ),
        ]);

        if (cancelled) return;
        setResults(tmdbRes.items || []);
        setAnimeResults(anilistRes.items || []);
      } catch (e) {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [query]);

  const movies = results.filter((r) => (r as MediaItem).type === "movie");
  const tv = results.filter((r) => (r as MediaItem).type === "tv");

  let visible: (MediaItem | AnimeItem)[] = [];
  if (tab === "all") visible = [...results, ...animeResults];
  else if (tab === "movies") visible = movies;
  else if (tab === "tv") visible = tv;
  else if (tab === "anime") visible = animeResults;

  return (
    <div className="px-4 lg:px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center pwr-glow">
            <Search className="w-4 h-4 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black pwr-gradient-text">
            Search Results
          </h1>
        </div>
        <p className="text-sm text-muted-foreground ml-12">
          for{" "}
          <span className="text-foreground font-semibold">&quot;{query}&quot;</span>
          <button
            onClick={onClear}
            className="ml-2 inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80"
          >
            <X className="w-3 h-3" />
            clear
          </button>
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0">
        <Tab
          active={tab === "all"}
          onClick={() => setTab("all")}
          label="All"
          count={results.length + animeResults.length}
        />
        <Tab
          active={tab === "movies"}
          onClick={() => setTab("movies")}
          label="Movies"
          icon={Film}
          count={movies.length}
        />
        <Tab
          active={tab === "tv"}
          onClick={() => setTab("tv")}
          label="TV"
          icon={Tv}
          count={tv.length}
        />
        <Tab
          active={tab === "anime"}
          onClick={() => setTab("anime")}
          label="Anime"
          icon={Sparkles}
          count={animeResults.length}
        />
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
          {Array.from({ length: 16 }).map((_, i) => (
            <ContentCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-24">
          <AlertTriangle className="w-12 h-12 text-destructive" />
          <p className="text-lg font-bold mt-3">Search failed</p>
          <p className="text-sm text-muted-foreground mt-1">
            Try a different query.
          </p>
        </div>
      ) : visible.length === 0 ? (
        <div className="py-24 text-center">
          <Search className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-lg font-bold">No results found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Try different keywords or browse the catalog.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
          {visible.map((item, i) => (
            <ContentCard
              key={item.id + i}
              item={item}
              index={i}
              onClick={onCardClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Tab({
  active,
  onClick,
  label,
  count,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  icon?: any;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap border transition-all ${
        active
          ? "bg-primary/15 text-primary border-primary/40 pwr-border-glow"
          : "bg-secondary/50 text-foreground/70 hover:text-foreground border-border/60"
      }`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {label}
      <span
        className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
          active ? "bg-primary/30" : "bg-secondary"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
