"use client";

import { useEffect } from "react";

/**
 * Registers the service worker for PWA installability + offline app shell.
 * Only runs in production to avoid caching dev assets.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // Skip in dev to avoid caching issues
    if (process.env.NODE_ENV === "development") return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => {
          console.warn("[PWA] SW registration failed:", err);
        });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register);
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
