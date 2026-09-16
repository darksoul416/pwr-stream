"use client";

import { History, Trash2, Clock } from "lucide-react";
import { ContinueWatchingRow } from "./continue-watching-row";
import { useContinueWatching, continueItemToTarget } from "@/hooks/use-continue-watching";
import type { WatchTarget } from "@/lib/types";

interface HistoryViewProps {
  onResume?: (target: WatchTarget) => void;
}

export function HistoryView({ onResume }: HistoryViewProps) {
  const { items, remove, clear, clearFinished, count, hydrated } = useContinueWatching();

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center pwr-glow">
              <History className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black pwr-gradient-text">
              Watch History
            </h1>
          </div>
          <p className="text-sm text-muted-foreground ml-12">
            {count === 0
              ? "Your watch history will appear here"
              : `${count} ${count === 1 ? "title" : "titles"} in progress`}
          </p>
        </div>
        {count > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={clearFinished}
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-secondary/50 text-foreground/70 border border-border/60 hover:border-primary/40 transition-colors"
            >
              Clear Finished
            </button>
            <button
              onClick={() => {
                if (confirm("Clear all watch history?")) clear();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive/25 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear all
            </button>
          </div>
        )}
      </div>

      {count === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/50 py-24 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary/40 flex items-center justify-center">
            <Clock className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-bold">No watch history yet</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Start watching a movie, TV show, or anime — your progress will be saved here so you can pick up where you left off.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="group relative flex items-center gap-4 p-3 rounded-xl bg-card/40 border border-border/40 hover:border-primary/60 transition-colors">
              <button
                onClick={() => onResume?.(continueItemToTarget(item))}
                className="relative w-24 h-14 rounded-lg overflow-hidden bg-muted shrink-0"
              >
                {item.backdrop ? (
                   
                  <img
                    src={item.backdrop}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : null}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">▶</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60">
                  <div className="h-full bg-primary" style={{ width: `${item.progress}%` }} />
                </div>
              </button>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold truncate">{item.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.season && item.episode
                    ? `S${item.season} · E${item.episode}`
                    : item.type === "movie" ? "Movie" : "TV"}
                  {" · "}
                  {Math.round(item.progress)}% watched
                </p>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                  Last watched {formatRelative(item.updatedAt)}
                </p>
              </div>
              <button
                onClick={() => remove(item.id)}
                aria-label="Remove from history"
                className="w-8 h-8 rounded-lg bg-secondary/40 hover:bg-destructive text-muted-foreground hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}
