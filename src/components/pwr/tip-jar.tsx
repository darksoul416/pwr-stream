"use client";

import { useState } from "react";
import { Coffee, Heart, X, Bitcoin, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { MONETIZATION } from "@/lib/monetization";

interface TipJarProps {
  variant?: "compact" | "full";
  className?: string;
}

export function TipJar({ variant = "compact", className }: TipJarProps) {
  const [open, setOpen] = useState(false);
  const tips = MONETIZATION.tips;

  if (variant === "compact") {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-primary/20 to-neon-pink/20 border border-primary/30 hover:border-primary/60 hover:from-primary/30 hover:to-neon-pink/30 transition-all",
            className
          )}
        >
          <Heart className="w-3.5 h-3.5 text-primary fill-current" />
          Support PWR Stream
        </button>

        {open && (
          <div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <div
              className="relative w-full max-w-sm rounded-2xl border border-border/60 bg-popover/95 backdrop-blur-xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-border/40">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Heart className="w-4 h-4 text-primary fill-current" />
                  Support PWR Stream
                </h3>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-2">
                <p className="text-xs text-muted-foreground mb-3 text-center">
                  PWR Stream is free &amp; ad-free. If you love it, consider buying us a coffee! ☕
                </p>

                {tips.buyMeCoffee && (
                  <a
                    href={tips.buyMeCoffee}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/20 transition-colors"
                  >
                    <Coffee className="w-5 h-5 text-yellow-500" />
                    <div className="flex-1">
                      <p className="text-sm font-bold">Buy Me a Coffee</p>
                      <p className="text-[10px] text-muted-foreground">$3 one-time</p>
                    </div>
                  </a>
                )}

                {tips.koFi && (
                  <a
                    href={tips.koFi}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 transition-colors"
                  >
                    <span className="text-xl">☕</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold">Ko-fi</p>
                      <p className="text-[10px] text-muted-foreground">Any amount</p>
                    </div>
                  </a>
                )}

                {tips.patreon && (
                  <a
                    href={tips.patreon}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 hover:bg-orange-500/20 transition-colors"
                  >
                    <span className="text-xl">🎨</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold">Patreon</p>
                      <p className="text-[10px] text-muted-foreground">Monthly support</p>
                    </div>
                  </a>
                )}

                {(tips.btc || tips.eth || tips.usdc) && (
                  <div className="pt-2 border-t border-border/40">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Crypto
                    </p>
                    {tips.btc && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/40 mb-1">
                        <Bitcoin className="w-3.5 h-3.5 text-orange-500" />
                        <span className="text-[10px] font-mono">{tips.btc}</span>
                      </div>
                    )}
                    {tips.eth && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/40 mb-1">
                        <DollarSign className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-[10px] font-mono">{tips.eth}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-border/40 p-3 text-center">
                <p className="text-[10px] text-muted-foreground">
                  Donations keep our servers running. Thank you! 💜
                </p>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}
