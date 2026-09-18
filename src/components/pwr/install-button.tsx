"use client";

import { useEffect, useState } from "react";
import { Download, X, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallAppButton({
  variant = "compact",
  className,
}: {
  variant?: "compact" | "full" | "banner";
  className?: string;
}) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [iosPrompt, setIosPrompt] = useState(false);

  useEffect(() => {
    // Defer all setState calls via microtask to comply with
    // react-hooks/set-state-in-effect rule.
    queueMicrotask(() => {
      // Check if already installed (standalone mode)
      const isStandalone =
        typeof window !== "undefined" &&
        (window.matchMedia("(display-mode: standalone)").matches ||
          (window.navigator as any).standalone === true);
      if (isStandalone) {
        setInstalled(true);
        return;
      }

      // Check if user previously dismissed
      try {
        const dismissedAt = localStorage.getItem("pwr-install-dismissed");
        if (dismissedAt) {
          const age = Date.now() - parseInt(dismissedAt, 10);
          if (age < 7 * 24 * 60 * 60 * 1000) {
            setDismissed(true);
            return;
          }
        }
      } catch {
        // ignore
      }

      // Detect iOS Safari (no beforeinstallprompt — show instructions)
      const ua = window.navigator.userAgent;
      const isIos =
        /iPad|iPhone|iPod/.test(ua) ||
        (ua.includes("Mac") && "ontouchend" in document);
      const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);
      if (isIos && isSafari) {
        setIosPrompt(true);
      }
    });

    // Listen for beforeinstallprompt (Chrome/Android/Edge desktop)
    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    function onAppInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
    }
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "dismissed") {
      try {
        localStorage.setItem(
          "pwr-install-dismissed",
          Date.now().toString()
        );
      } catch {
        // ignore
      }
      setDismissed(true);
    }
    setDeferredPrompt(null);
  }

  function dismissBanner() {
    try {
      localStorage.setItem("pwr-install-dismissed", Date.now().toString());
    } catch {
      // ignore
    }
    setDismissed(true);
  }

  // Don't render anything if already installed or dismissed
  if (installed || dismissed) return null;

  // Banner variant (top of page on mobile)
  if (variant === "banner") {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm rounded-2xl border border-primary/40 bg-popover/95 backdrop-blur-xl shadow-2xl p-4 pwr-border-glow">
        <button
          onClick={dismissBanner}
          className="absolute top-2 right-2 w-6 h-6 rounded-full hover:bg-secondary flex items-center justify-center"
          aria-label="Dismiss"
        >
          <X className="w-3 h-3" />
        </button>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-neon-pink flex items-center justify-center shrink-0 pwr-glow">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold mb-0.5">Install Netflix Clone</h3>
            <p className="text-xs text-muted-foreground mb-3">
              {iosPrompt
                ? "Tap the Share button, then 'Add to Home Screen' for the full app experience."
                : "Add to your home screen for offline access and faster loading."}
            </p>
            {deferredPrompt ? (
              <button
                onClick={handleInstall}
                className="w-full px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Install App
              </button>
            ) : iosPrompt ? (
              <div className="text-[10px] text-muted-foreground bg-secondary/50 px-2 py-1.5 rounded-lg">
                📱 iOS: Share → Add to Home Screen
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  // Full button variant
  if (variant === "full") {
    if (!deferredPrompt && !iosPrompt) return null;
    return (
      <button
        onClick={handleInstall}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30 transition-all",
          className
        )}
      >
        <Download className="w-4 h-4" />
        Install Netflix Clone App
      </button>
    );
  }

  // Compact icon button (default)
  if (!deferredPrompt && !iosPrompt) return null;
  return (
    <button
      onClick={handleInstall}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30 transition-all",
        className
      )}
      title="Install Netflix Clone as an app"
    >
      <Download className="w-3.5 h-3.5" />
      Install App
    </button>
  );
}
