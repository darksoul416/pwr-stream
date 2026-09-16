"use client";

import { useState, useEffect, useCallback } from "react";

export type ThemeMode = "dark" | "light";
export type AccentColor = "purple" | "cyan" | "pink" | "green";

export interface ThemeSettings {
  mode: ThemeMode;
  accent: AccentColor;
}

const STORAGE_KEY = "pwr-theme";

const ACCENT_COLORS: Record<AccentColor, { primary: string; pink: string; cyan: string }> = {
  purple: { primary: "oklch(0.65 0.28 295)", pink: "oklch(0.72 0.27 350)", cyan: "oklch(0.78 0.18 195)" },
  cyan:   { primary: "oklch(0.78 0.18 195)", pink: "oklch(0.65 0.28 295)", cyan: "oklch(0.78 0.18 195)" },
  pink:   { primary: "oklch(0.72 0.27 350)", pink: "oklch(0.72 0.27 350)", cyan: "oklch(0.78 0.18 195)" },
  green:  { primary: "oklch(0.70 0.20 150)", pink: "oklch(0.72 0.27 350)", cyan: "oklch(0.78 0.18 195)" },
};

function loadSettings(): ThemeSettings {
  if (typeof window === "undefined") return { mode: "dark", accent: "purple" };
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        mode: parsed.mode === "light" ? "light" : "dark",
        accent: ["purple", "cyan", "pink", "green"].includes(parsed.accent)
          ? parsed.accent
          : "purple",
      };
    }
  } catch {
    // ignore
  }
  return { mode: "dark", accent: "purple" };
}

export function useTheme() {
  const [settings, setSettings] = useState<ThemeSettings>({
    mode: "dark",
    accent: "purple",
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      const loaded = loadSettings();
      setSettings(loaded);
      setHydrated(true);
    });
  }, []);

  // Apply theme to document element
  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    const colors = ACCENT_COLORS[settings.accent];

    if (settings.mode === "light") {
      root.classList.remove("dark");
      root.classList.add("light");
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
    }

    // Override CSS variables for accent color
    root.style.setProperty("--primary", colors.primary);
    root.style.setProperty("--ring", colors.primary);
    root.style.setProperty("--accent", colors.primary);
    root.style.setProperty("--neon", colors.primary);
    if (settings.accent === "green") {
      root.style.setProperty("--sidebar-primary", colors.primary);
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings, hydrated]);

  const setMode = useCallback((mode: ThemeMode) => {
    setSettings((s) => ({ ...s, mode }));
  }, []);

  const setAccent = useCallback((accent: AccentColor) => {
    setSettings((s) => ({ ...s, accent }));
  }, []);

  const toggleMode = useCallback(() => {
    setSettings((s) => ({ ...s, mode: s.mode === "dark" ? "light" : "dark" }));
  }, []);

  return {
    mode: settings.mode,
    accent: settings.accent,
    setMode,
    setAccent,
    toggleMode,
    hydrated,
  };
}
