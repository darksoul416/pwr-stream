import { NextRequest, NextResponse } from "next/server";

const TMDB_API_KEY = "8265bd1679663a7ea12ac168da84d2e8";
const TMDB_BASE = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p";

function logo(path?: string | null, size = "w92") {
  return path ? `${IMAGE_BASE}/${size}${path}` : "";
}

interface WatchProvider {
  id: number;
  name: string;
  logo: string;
  priority: number;
}

interface RegionProviders {
  region: string;
  link: string;
  flatrate: WatchProvider[]; // subscription
  rent: WatchProvider[];
  buy: WatchProvider[];
  free: WatchProvider[]; // free w/ ads
  ads: WatchProvider[];
}

// Common regions to show
const REGIONS = ["US", "GB", "CA", "AU", "IN", "JP"];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const type = searchParams.get("type") as "movie" | "tv";

  if (!id || !type) {
    return NextResponse.json({ error: "Missing id or type" }, { status: 400 });
  }

  try {
    const url = `${TMDB_BASE}/${type}/${id}/watch/providers?api_key=${TMDB_API_KEY}`;
    const res = await fetch(url, { next: { revalidate: 86400 } });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream error ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const results = data.results || {};

    const regions: RegionProviders[] = REGIONS.map((region) => {
      const r = results[region] || {};
      return {
        region,
        link: r.link || "",
        flatrate: (r.flatrate || []).map((p: any) => ({
          id: p.provider_id,
          name: p.provider_name,
          logo: logo(p.logo_path),
          priority: p.display_priority || 0,
        })),
        rent: (r.rent || []).map((p: any) => ({
          id: p.provider_id,
          name: p.provider_name,
          logo: logo(p.logo_path),
          priority: p.display_priority || 0,
        })),
        buy: (r.buy || []).map((p: any) => ({
          id: p.provider_id,
          name: p.provider_name,
          logo: logo(p.logo_path),
          priority: p.display_priority || 0,
        })),
        free: (r.free || []).map((p: any) => ({
          id: p.provider_id,
          name: p.provider_name,
          logo: logo(p.logo_path),
          priority: p.display_priority || 0,
        })),
        ads: (r.ads || []).map((p: any) => ({
          id: p.provider_id,
          name: p.provider_name,
          logo: logo(p.logo_path),
          priority: p.display_priority || 0,
        })),
      };
    }).filter((r: RegionProviders) => 
      r.flatrate.length > 0 || r.free.length > 0 || r.ads.length > 0 || r.rent.length > 0 || r.buy.length > 0
    );

    return NextResponse.json({
      regions,
      allRegions: Object.keys(results),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown" }, { status: 500 });
  }
}
