"use client";

import { useState } from "react";
import { Crown, X, Cloud, Users, Zap, Shield, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { MONETIZATION } from "@/lib/monetization";

interface PremiumBannerProps {
  variant?: "banner" | "compact";
  className?: string;
}

const FEATURE_ICONS = {
  "Ad-free browsing experience": Shield,
  "Cloud sync across devices": Cloud,
  "Multiple watch profiles (up to 5)": Users,
  "4K streaming quality unlock": Zap,
  "Early access to new features": Crown,
  "Priority server selection": Zap,
};

export function PremiumBanner({ variant = "banner", className }: PremiumBannerProps) {
  const [showModal, setShowModal] = useState(false);
  const premium = MONETIZATION.premium;

  // Don't show if premium is not enabled
  if (!premium.enabled) return null;

  if (variant === "compact") {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-yellow-500/20 to-primary/20 border border-yellow-500/40 hover:border-yellow-500/70 hover:from-yellow-500/30 hover:to-primary/30 transition-all",
            className
          )}
        >
          <Crown className="w-3.5 h-3.5 text-yellow-500" />
          Go Premium
          <span className="ml-auto text-[10px] text-muted-foreground">
            ${premium.price}/mo
          </span>
        </button>
        <PremiumModal open={showModal} onClose={() => setShowModal(false)} />
      </>
    );
  }

  return (
    <>
      <div
        className={cn(
          "relative rounded-2xl overflow-hidden border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 via-primary/10 to-transparent p-4",
          className
        )}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/20 rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            <h3 className="text-sm font-bold">Netflix Clone Premium</h3>
            <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500/20 text-yellow-500 border border-yellow-500/30">
              ${premium.price}/mo
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Unlock the full experience with premium features.
          </p>
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {premium.features.slice(0, 4).map((f) => {
              const Icon = FEATURE_ICONS[f as keyof typeof FEATURE_ICONS] || Check;
              return (
                <div key={f} className="flex items-center gap-1.5 text-[11px]">
                  <Icon className="w-3 h-3 text-yellow-500 shrink-0" />
                  <span className="text-foreground/80 truncate">{f}</span>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="w-full px-3 py-2 rounded-lg bg-gradient-to-r from-yellow-500 to-primary text-white text-xs font-bold hover:opacity-90 transition-opacity"
          >
            Upgrade Now
          </button>
        </div>
      </div>
      <PremiumModal open={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}

function PremiumModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  const premium = MONETIZATION.premium;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-yellow-500/40 bg-popover/95 backdrop-blur-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="relative p-6 pb-4 text-center bg-gradient-to-b from-yellow-500/20 to-transparent">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-yellow-500 to-primary flex items-center justify-center pwr-glow">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-black pwr-gradient-text">Netflix Clone Premium</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Support the project + unlock premium features
          </p>
        </div>

        {/* Features */}
        <div className="p-4 space-y-2">
          {premium.features.map((f) => {
            const Icon = FEATURE_ICONS[f as keyof typeof FEATURE_ICONS] || Check;
            return (
              <div key={f} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/40 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/15 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-yellow-500" />
                </div>
                <span className="text-sm text-foreground/90">{f}</span>
                <Check className="w-4 h-4 text-green-500 ml-auto" />
              </div>
            );
          })}
        </div>

        {/* Price */}
        <div className="px-6 py-4 border-t border-border/40 text-center">
          <div className="flex items-baseline justify-center gap-1 mb-3">
            <span className="text-3xl font-black">${premium.price}</span>
            <span className="text-sm text-muted-foreground">/month</span>
          </div>
          <p className="text-[10px] text-muted-foreground mb-3">
            Cancel anytime. Payment via Stripe.
          </p>
          <button
            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-primary text-white font-bold hover:opacity-90 transition-opacity pwr-glow"
            // In production, this would redirect to Stripe Checkout
            onClick={() => alert("Stripe checkout not configured yet. Set MONETIZATION.premium.stripePriceId in monetization.ts")}
          >
            Upgrade to Premium
          </button>
          <p className="text-[10px] text-muted-foreground mt-2">
            Premium = better features, not better content. All streams remain free.
          </p>
        </div>
      </div>
    </div>
  );
}
