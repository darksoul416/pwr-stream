"use client";

import { useEffect } from "react";

/**
 * Popup/Redirect Blocker
 *
 * Embed providers (vidlove.cc, 2embed.cc, etc.) inject scripts that:
 * 1. Open popup ads via window.open()
 * 2. Redirect the top-level page via window.top.location.href
 * 3. Inject ad scripts into the parent DOM
 *
 * This component blocks those by:
 * 1. Overriding window.open to block popup ads
 * 2. Intercepting beforeunload events caused by redirects
 * 3. Blocking navigation to known ad domains
 *
 * The sandbox attribute on the iframe already prevents top-navigation,
 * but some providers use tricks like form submissions or link clicks
 * that can bypass it. This script catches those edge cases.
 */

const BLOCKED_DOMAINS = [
  "67movies.nl",
  "highperformanceformat.com",
  "streamingnow.mov",
  "multiembed.mov",
  "popads.net",
  "popunder.net",
  "propellerads.com",
  "adsterra.com",
  "exoclick.com",
  "juicyads.com",
  "trafficjunky.com",
  "trafficstars.com",
];

export function PopupBlocker() {
  useEffect(() => {
    // 1. Override window.open — block popups from iframes
    const originalOpen = window.open;
    (window as any).open = function (url?: string | URL, ...args: any[]) {
      if (url) {
        const urlStr = typeof url === "string" ? url : url.toString();
        // Check if URL is a blocked ad domain
        const isBlocked = BLOCKED_DOMAINS.some(
          (d) => urlStr.includes(d) || urlStr.includes(d.replace(".", "\\."))
        );
        if (isBlocked) {
          console.warn("[ad-block] Blocked popup:", urlStr.slice(0, 100));
          return null;
        }
        // Allow same-origin or about:blank
        try {
          const parsed = new URL(urlStr, window.location.origin);
          if (parsed.origin === window.location.origin) {
            return originalOpen.call(window, url, ...args);
          }
        } catch {
          // Invalid URL — block
          return null;
        }
        // Block cross-origin popups from iframes
        console.warn("[ad-block] Blocked cross-origin popup:", urlStr.slice(0, 100));
        return null;
      }
      return null;
    };

    // 2. Block beforeunload caused by ad redirects
    const beforeUnloadHandler = (e: BeforeUnloadEvent) => {
      // Check if the unload was triggered by an ad redirect
      // (we can't easily tell, but we can check if there's a pending navigation)
      const activeElement = document.activeElement;
      if (activeElement && activeElement.tagName === "IFRAME") {
        // An iframe is trying to navigate — block it
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };
    window.addEventListener("beforeunload", beforeUnloadHandler, { capture: true });

    // 3. Block clicks on ad links that escape the iframe
    const clickHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === "A") {
        const href = (target as HTMLAnchorElement).href;
        if (href) {
          const isBlocked = BLOCKED_DOMAINS.some((d) => href.includes(d));
          if (isBlocked) {
            e.preventDefault();
            e.stopPropagation();
            console.warn("[ad-block] Blocked ad link click:", href.slice(0, 100));
          }
        }
      }
    };
    document.addEventListener("click", clickHandler, { capture: true });

    // 4. Periodically remove injected ad elements
    const removeAds = () => {
      // Remove elements with ad-related attributes
      const adSelectors = [
        '[id*="adsterra"]',
        '[class*="adsterra"]',
        '[id*="popunder"]',
        '[class*="popunder"]',
        '[data-ad]',
        'iframe[src*="popads"]',
        'iframe[src*="popunder"]',
        'iframe[src*="highperformanceformat"]',
        'div[style*="position: fixed"][style*="z-index: 2147483647"]',
      ];
      adSelectors.forEach((sel) => {
        try {
          document.querySelectorAll(sel).forEach((el) => {
            el.remove();
            console.warn("[ad-block] Removed ad element:", sel);
          });
        } catch {
          // ignore
        }
      });
    };
    const adInterval = setInterval(removeAds, 2000);

    return () => {
      (window as any).open = originalOpen;
      window.removeEventListener("beforeunload", beforeUnloadHandler, { capture: true } as any);
      document.removeEventListener("click", clickHandler, { capture: true } as any);
      clearInterval(adInterval);
    };
  }, []);

  return null;
}
