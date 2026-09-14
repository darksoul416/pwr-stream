import { NextRequest, NextResponse } from "next/server";

const TMDB_API_KEY = "8265bd1679663a7ea12ac168da84d2e8";
const TMDB_BASE = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p";

export interface SearchResult {
  id: string;
  title: string;
  poster: string;
  backdrop: string;
  overview: string;
  year: string;
  rating: number;
  type: "movie" | "tv";
  tmdbId: number;
  genres?: string[];
}

function poster(path?: string | null, size = "w342") {
  return path ? `${IMAGE_BASE}/${size}${path}` : "";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const page = searchParams.get("page") || "1";

  if (!q.trim()) {
    return NextResponse.json({ items: [], page: 1, totalPages: 0 });
  }

  try {
    const url = `${TMDB_BASE}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
      q
    )}&page=${page}&include_adult=false`;
    const res = await fetch(url, { next: { revalidate: 300 } });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream error ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    const items: SearchResult[] = (data.results || [])
      .filter(
        (r: any) =>
          (r.media_type === "movie" || r.media_type === "tv") && r.poster_path
      )
      .map((r: any) => ({
        id: `${r.media_type}-${r.id}`,
        title:
          r.title || r.name || r.original_name || r.original_title || "Untitled",
        poster: poster(r.poster_path),
        backdrop: poster(r.backdrop_path, "w780"),
        overview: r.overview || "",
        year: (r.release_date || r.first_air_date || "").slice(0, 4),
        rating: Math.round((r.vote_average || 0) * 10) / 10,
        type: r.media_type as "movie" | "tv",
        tmdbId: r.id,
      }));

    return NextResponse.json({
      items,
      page: data.page,
      totalPages: Math.min(data.total_pages || 1, 20),
      totalResults: data.total_results || 0,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown" }, { status: 500 });
  }
}
