"use client";

import { useState } from "react";
import { Moon, Sun, Palette, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme, type AccentColor } from "@/hooks/use-theme";

const ACCENT_PRESETS: { id: AccentColor; label: string; color: string }[] = [
  { id: "purple", label: "PWR Purple", color: "oklch(0.65 0.28 295)" },
  { id: "cyan", label: "Neon Cyan", color: "oklch(0.78 0.18 195)" },
  { id: "pink", label: "Hot Pink", color: "oklch(0.72 0.27 350)" },
  { id: "green", label: "Toxic Green", color: "oklch(0.70 0.20 150)" },
];

export function ThemeSwitcher() {
  const { mode, accent, setMode, setAccent, toggleMode, hydrated } = useTheme();
  const [open, setOpen] = useState(false);

  if (!hydrated) return null;

  return (
    <div className="relative">
      <div className="flex items-center gap-1.5">
        {/* Mode toggle (sun/moon) */}
        <button
          onClick={toggleMode}
          className="w-9 h-9 rounded-lg bg-secondary/60 border border-border/60 hover:border-primary/60 hover:bg-primary/20 flex items-center justify-center transition-colors"
          title={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
          aria-label={`Toggle ${mode === "dark" ? "light" : "dark"} mode`}
        >
          {mode === "dark" ? (
            <Moon className="w-4 h-4 text-primary" />
          ) : (
            <Sun className="w-4 h-4 text-yellow-500" />
          )}
        </button>

        {/* Accent color picker */}
        <button
          onClick={() => setOpen(!open)}
          className="w-9 h-9 rounded-lg bg-secondary/60 border border-border/60 hover:border-primary/60 hover:bg-primary/20 flex items-center justify-center transition-colors"
          title="Accent color"
          aria-label="Choose accent color"
        >
          <Palette className="w-4 h-4 text-primary" />
        </button>
      </div>

      {/* Accent dropdown */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-border/60 bg-popover/95 backdrop-blur-xl shadow-2xl overflow-hidden z-40 p-2">
            <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Accent Color
            </p>
            {ACCENT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  setAccent(preset.id);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-medium hover:bg-secondary/80 transition-colors",
                  accent === preset.id && "bg-primary/10"
                )}
              >
                <span
                  className="w-5 h-5 rounded-full border border-white/20 shrink-0"
                  style={{ background: preset.color }}
                />
                <span className="flex-1 text-left">{preset.label}</span>
                {accent === preset.id && (
                  <Check className="w-3.5 h-3.5 text-primary" />
                )}
              </button>
            ))}
            <div className="border-t border-border/40 my-1" />
            <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Mode
            </p>
            <button
              onClick={() => {
                setMode("dark");
                setOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-medium hover:bg-secondary/80 transition-colors",
                mode === "dark" && "bg-primary/10"
              )}
            >
              <Moon className="w-4 h-4 text-primary" />
              <span className="flex-1 text-left">Dark</span>
              {mode === "dark" && <Check className="w-3.5 h-3.5 text-primary" />}
            </button>
            <button
              onClick={() => {
                setMode("light");
                setOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-medium hover:bg-secondary/80 transition-colors",
                mode === "light" && "bg-primary/10"
              )}
            >
              <Sun className="w-4 h-4 text-yellow-500" />
              <span className="flex-1 text-left">Light</span>
              {mode === "light" && <Check className="w-3.5 h-3.5 text-primary" />}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
