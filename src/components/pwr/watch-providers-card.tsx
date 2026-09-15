"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Tv, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RegionProviders, WatchProvider } from "@/lib/types";

interface WatchProvidersCardProps {
  tmdbId: number;
  type: "movie" | "tv";
}

const REGION_NAMES: Record<string, string> = {
  US: "United States",
  GB: "United Kingdom",
  CA: "Canada",
  AU: "Australia",
  IN: "India",
  JP: "Japan",
};

export function WatchProvidersCard({ tmdbId, type }: WatchProvidersCardProps) {
  const [regions, setRegions] = useState<RegionProviders[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeRegion, setActiveRegion] = useState("US");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setRegions([]);

    (async () => {
      try {
        const res = await fetch(`/api/watch-providers?id=${tmdbId}&type=${type}`);
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        if (cancelled) return;
        setRegions(data.regions || []);
        // Pick first available region, prefer US
        const us = (data.regions || []).find((r: RegionProviders) => r.region === "US");
        setActiveRegion(us ? "US" : data.regions?.[0]?.region || "US");
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tmdbId, type]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card/40 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Tv className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-wider">Where to Watch</h3>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs">Loading providers...</span>
        </div>
      </div>
    );
  }

  if (error || regions.length === 0) {
    return null;
  }

  const active = regions.find((r) => r.region === activeRegion) || regions[0];

  // Collect all providers, prioritized: free > flatrate > rent > buy > ads
  const allProviders: { kind: string; providers: WatchProvider[] }[] = [
    { kind: "Free", providers: active.free },
    { kind: "Subscription", providers: active.flatrate },
    { kind: "Rent", providers: active.rent },
    { kind: "Buy", providers: active.buy },
  ].filter((g) => g.providers && g.providers.length > 0);

  if (allProviders.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border/40 bg-card/40 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Tv className="w-4 h-4 text-primary" />
          Where to Watch
        </h3>
        <span className="text-[10px] text-muted-foreground">Legal options</span>
      </div>

      {/* Region selector */}
      {regions.length > 1 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {regions.map((r) => (
            <button
              key={r.region}
              onClick={() => setActiveRegion(r.region)}
              className={cn(
                "px-2 py-1 rounded-md text-[10px] font-bold border uppercase transition-all",
                r.region === activeRegion
                  ? "bg-primary/20 text-primary border-primary/40"
                  : "bg-secondary/40 text-muted-foreground border-border/40 hover:border-primary/30"
              )}
              title={REGION_NAMES[r.region] || r.region}
            >
              {r.region}
            </button>
          ))}
        </div>
      )}

      {/* Provider groups */}
      <div className="space-y-3">
        {allProviders.map((group) => (
          <div key={group.kind}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
              {group.kind}
            </p>
            <div className="flex flex-wrap gap-2">
              {group.providers.map((p) => (
                <a
                  key={`${group.kind}-${p.id}`}
                  href={active.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 px-2 py-1 rounded-lg bg-secondary/40 border border-border/40 hover:border-primary/60 hover:bg-primary/10 transition-all"
                  title={p.name}
                >
                  {p.logo ? (
                     
                    <img
                      src={p.logo}
                      alt={p.name}
                      className="w-6 h-6 rounded-md object-contain bg-white/90"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-md bg-primary/40 flex items-center justify-center">
                      <Tv className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                  <span className="text-[11px] font-semibold text-foreground/80 group-hover:text-primary transition-colors">
                    {p.name}
                  </span>
                  <ExternalLink className="w-2.5 h-2.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      {active.link && (
        <a
          href={active.link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block text-center text-[10px] text-muted-foreground hover:text-primary transition-colors"
        >
          View all options on JustWatch →
        </a>
      )}
    </div>
  );
}
