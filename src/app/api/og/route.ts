import { NextRequest, NextResponse } from "next/server";

/**
 * Generate a dynamic Open Graph image URL for social sharing.
 *
 * Uses ogimage.website (free OG image generator from FMHY).
 *
 * Usage:
 *   /api/og?title=Spider-Man&poster=https://image.tmdb.org/t/p/w780/xxx.jpg
 *
 * Returns a redirect to the generated OG image.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") || "Netflix Clone";
  const subtitle = searchParams.get("subtitle") || "Watch free movies, TV & anime";
  const poster = searchParams.get("poster");

  // Use ogimage.website's API (free, no key needed)
  const params = new URLSearchParams({
    title,
    subtitle,
    theme: "dark",
    "theme-color": "#7c3aed",
    "bg-image": poster || "",
    font: "Inter",
    "font-size": "48",
    "subtitle-font-size": "20",
    logo: "https://netflix-clone.vercel.app/icons/icon-192.png",
  });

  const ogUrl = `https://www.ogimage.website/api/generate?${params.toString()}`;

  return NextResponse.redirect(ogUrl, {
    status: 302,
    headers: {
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
