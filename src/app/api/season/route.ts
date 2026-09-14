import { NextRequest, NextResponse } from "next/server";

const TMDB_API_KEY = "8265bd1679663a7ea12ac168da84d2e8";
const TMDB_BASE = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p";

function poster(path?: string | null, size = "w342") {
  return path ? `${IMAGE_BASE}/${size}${path}` : "";
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  episodeNumber: number;
  seasonNumber: number;
  still: string;
  runtime: number | null;
  airDate: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const season = searchParams.get("season") || "1";

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const url = `${TMDB_BASE}/tv/${id}/season/${season}?api_key=${TMDB_API_KEY}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream error ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const episodes: Episode[] = (data.episodes || []).map((e: any) => ({
      id: e.id,
      name: e.name || `Episode ${e.episode_number}`,
      overview: e.overview || "",
      episodeNumber: e.episode_number,
      seasonNumber: Number(season),
      still: poster(e.still_path),
      runtime: e.runtime || null,
      airDate: e.air_date || "",
    }));

    return NextResponse.json({ episodes, season: Number(season) });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown" }, { status: 500 });
  }
}
