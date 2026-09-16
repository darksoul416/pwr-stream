"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { MONETIZATION, shouldShowAds } from "@/lib/monetization";

interface AdSlotProps {
  currentView: string;
  slot?: string;
  format?: "auto" | "horizontal" | "vertical" | "rectangle";
  className?: string;
}

/**
 * AdSlot component for display ads.
 *
 * IMPORTANT LEGAL NOTES:
 * - Only renders on ALLOWED pages (home, browse, search, etc.)
 * - NEVER renders on watch pages (where embedded streams are)
 * - Uses Google AdSense when enabled in monetization config
 * - Shows a placeholder when ads are disabled (dev mode)
 *
 * To enable:
 * 1. Get AdSense approval (https://adsense.google.com)
 * 2. Set MONETIZATION.ads.enabled = true in src/lib/monetization.ts
 * 3. Replace adsenseClient with your publisher ID
 * 4. Add the AdSense script to layout.tsx <head>
 */
export function AdSlot({
  currentView,
  slot = "0000000000",
  format = "auto",
  className,
}: AdSlotProps) {
  const insRef = useRef<HTMLModElement>(null);
  const { ads } = MONETIZATION;
  const shouldRender = shouldShowAds(currentView) && ads.enabled && ads.network === "adsense";

  useEffect(() => {
    if (!shouldRender) return;
    // Push ad to AdSense queue
    try {
      if (typeof window !== "undefined" && (window as any).adsbygoogle) {
        (window as any).adsbygoogle.push({});
      }
    } catch {
      // ignore
    }
  }, [shouldRender]);

  // Don't render if ads are disabled or on blocked pages
  if (!shouldShowAds(currentView)) return null;

  // Dev/placeholder mode — shows a labeled placeholder box
  if (!ads.enabled) {
    return (
      <div
        className={cn(
          "rounded-xl border border-dashed border-border/40 bg-secondary/20 flex items-center justify-center text-center p-4",
          className
        )}
      >
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Ad Slot
          </p>
          <p className="text-[9px] text-muted-foreground/60 mt-0.5">
            {format} · {currentView} page
          </p>
          <p className="text-[9px] text-muted-foreground/40 mt-1">
            Enable in monetization.ts
          </p>
        </div>
      </div>
    );
  }

  if (ads.network !== "adsense") return null;

  // Production mode — render AdSense ad unit
  return (
    <div className={cn("overflow-hidden", className)}>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "block", minHeight: format === "horizontal" ? 90 : 250 }}
        data-ad-client={ads.adsenseClient}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
