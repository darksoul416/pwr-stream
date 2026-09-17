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
 * Supports multiple ad networks:
 * - Adsterra (instant approval, accepts streaming sites)
 * - Google AdSense (requires approval)
 *
 * IMPORTANT LEGAL NOTES:
 * - Only renders on ALLOWED pages (home, browse, search, etc.)
 * - NEVER renders on watch pages (where embedded streams are)
 * - This protects you from DMCA/AdSense ban
 *
 * To enable Adsterra:
 * 1. Sign up at https://publishers.adsterra.com/
 * 2. Create a banner ad (728x90 or 300x250)
 * 3. Get your banner key from the ad code
 * 4. Set MONETIZATION.ads.adsterraKey in src/lib/monetization.ts
 *
 * To enable AdSense (after approval):
 * 1. Get AdSense approval (https://adsense.google.com)
 * 2. Set network to "adsense"
 * 3. Set adsenseClient with your publisher ID
 */
export function AdSlot({
  currentView,
  slot = "default",
  format = "auto",
  className,
}: AdSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { ads } = MONETIZATION;
  const allowed = shouldShowAds(currentView);
  const isAdsterraReady =
    ads.network === "adsterra" &&
    ads.adsterraKey &&
    ads.adsterraKey !== "your-adsterra-key-here";
  const isAdsenseReady =
    ads.network === "adsense" && ads.adsenseClient;

  useEffect(() => {
    if (!allowed || !isAdsenseReady) return;
    try {
      if (typeof window !== "undefined" && (window as any).adsbygoogle) {
        (window as any).adsbygoogle.push({});
      }
    } catch {
      // ignore
    }
  }, [allowed, isAdsenseReady]);

  // Don't render if page doesn't allow ads
  if (!allowed) return null;

  // Don't render if ads are completely disabled
  if (!ads.enabled) return null;

  // Dev/placeholder mode — shows a labeled placeholder box
  if (ads.network === "adsterra" && !isAdsterraReady) {
    return (
      <div
        className={cn(
          "rounded-xl border border-dashed border-border/40 bg-secondary/20 flex items-center justify-center text-center p-4",
          className
        )}
      >
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Ad Slot ({format})
          </p>
          <p className="text-[9px] text-muted-foreground/60 mt-0.5">
            {currentView} page · Adsterra ready
          </p>
          <p className="text-[9px] text-muted-foreground/40 mt-1">
            Add your Adsterra key in monetization.ts
          </p>
        </div>
      </div>
    );
  }

  // Adsterra banner ad
  if (ads.network === "adsterra" && isAdsterraReady) {
    const size = format === "horizontal" ? "728x90" : "300x250";
    return (
      <div
        ref={containerRef}
        className={cn("overflow-hidden flex items-center justify-center min-h-[90px]", className)}
      >
        <iframe
          src={`https://www.highperformanceformat.com/${ads.adsterraKey}/${size}`}
          scrolling="no"
          frameBorder="0"
          style={{
            width: format === "horizontal" ? "728px" : "300px",
            height: format === "horizontal" ? "90px" : "250px",
            maxWidth: "100%",
          }}
          title="Advertisement"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </div>
    );
  }

  // AdSense ad (requires approval)
  if (ads.network === "adsense" && isAdsenseReady) {
    return (
      <div className={cn("overflow-hidden", className)}>
        <ins
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

  // Fallback: placeholder
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-border/40 bg-secondary/20 flex items-center justify-center text-center p-4",
        className
      )}
    >
      <p className="text-[10px] text-muted-foreground">
        Configure ads in monetization.ts
      </p>
    </div>
  );
}
