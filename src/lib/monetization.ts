/**
 * PWR Stream Monetization Configuration
 *
 * LEGAL DISCLAIMER:
 * This platform embeds streams from third-party providers (vidlove.cc).
 * We do NOT host any content. Monetization is applied ONLY to:
 *   1. Legal affiliate links (directing users to paid streaming services)
 *   2. Voluntary donations (tip jar)
 *   3. Display ads on browse/discovery pages (NO ads on watch/embed pages)
 *   4. Premium UI features (NOT premium content access)
 *
 * We NEVER monetize the embedded streams directly. All affiliate links
 * point to LEGAL streaming providers (Netflix, Amazon, Hulu, etc.).
 */

export const MONETIZATION = {
  // Affiliate program IDs
  affiliates: {
    // Amazon Associates — replace with your tag
    amazonTag: "pwrstream-20",
    // JustWatch affiliate (if enrolled)
    justWatchPartner: "pwrstream",
  },

  // Tip jar / donation links
  tips: {
    buyMeCoffee: "https://www.buymeacoffee.com/pwrstream",
    koFi: "https://ko-fi.com/pwrstream",
    patreon: "https://www.patreon.com/pwrstream",
    // Crypto wallets (optional)
    btc: "",
    eth: "",
    usdc: "",
  },

  // Ad configuration (AdSense / Ezoic)
  ads: {
    enabled: false, // Set to true after AdSense approval
    network: "adsense", // "adsense" | "ezoic" | "mediavine"
    adsenseClient: "ca-pub-XXXXXXXXXXXXXXXX", // Replace with your AdSense ID
    // ONLY show ads on these pages (never on watch/embed pages)
    allowedPages: ["home", "movies", "tv", "anime", "search", "genres", "mylist", "history"],
    blockedPages: ["watch"], // NEVER show ads on watch pages (legal protection)
  },

  // Premium subscription
  premium: {
    enabled: false, // Set to true after Stripe setup
    price: 4.99, // per month
    currency: "USD",
    stripePriceId: "", // Replace with your Stripe Price ID
    features: [
      "Ad-free browsing experience",
      "Cloud sync across devices",
      "Multiple watch profiles (up to 5)",
      "4K streaming quality unlock",
      "Early access to new features",
      "Priority server selection",
    ],
  },

  // Sponsored content row (curated, clearly labeled)
  sponsored: {
    enabled: true,
    // These are TMDB IDs of content you want to feature
    // (e.g., indie films, partner content, trending picks)
    tmdbIds: {
      movie: [299534, 19995, 597, 603, 155], // Avengers, Avatar, Titanic, Matrix, Dark Knight
      tv: [1396, 1399, 60625, 60735, 66732], // Breaking Bad, GoT, Mr Robot, Flash, Stranger Things
    },
  },
} as const;

/**
 * Append Amazon affiliate tag to a URL
 */
export function addAmazonAffiliate(url: string): string {
  if (!url || !url.includes("amazon.")) return url;
  const sep = url.includes("?") ? "&" : "?";
  return url + sep + `tag=${MONETIZATION.affiliates.amazonTag}`;
}

/**
 * Append JustWatch partner tag to a URL
 */
export function addJustWatchAffiliate(url: string): string {
  if (!url) return url;
  const sep = url.includes("?") ? "&" : "?";
  return url + sep + `partner=${MONETIZATION.affiliates.justWatchPartner}`;
}

/**
 * Check if ads should be shown on the current page.
 * Returns true only when:
 *   1. Page is in allowedPages list
 *   2. Page is NOT in blockedPages list (watch pages)
 * Note: This does NOT check ads.enabled — the AdSlot component handles that
 * so it can show a placeholder in dev mode even when ads are disabled.
 */
export function shouldShowAds(currentView: string): boolean {
  if (MONETIZATION.ads.blockedPages.includes(currentView)) return false;
  return MONETIZATION.ads.allowedPages.includes(currentView);
}
