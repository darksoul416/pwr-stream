"use client";

import { X, Command, ArrowUp } from "lucide-react";
import { SHORTCUTS } from "@/hooks/use-keyboard-shortcuts";

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsHelp({ open, onClose }: KeyboardShortcutsHelpProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-border/60 bg-popover/95 backdrop-blur-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border/40">
          <h3 className="text-base font-bold flex items-center gap-2">
            <Command className="w-4 h-4 text-primary" />
            Keyboard Shortcuts
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-3 space-y-1">
          {SHORTCUTS.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-secondary/40 transition-colors"
            >
              <span className="text-xs text-foreground/80">{s.description}</span>
              <kbd className="font-mono text-[11px] font-bold px-2 py-1 rounded-md bg-secondary border border-border/60 text-primary">
                {s.keys}
              </kbd>
            </div>
          ))}
        </div>

        <div className="border-t border-border/40 p-3 text-center">
          <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
            <ArrowUp className="w-3 h-3" />
            Press <kbd className="font-mono font-bold">?</kbd> any time to open this
          </p>
        </div>
      </div>
    </div>
  );
}
