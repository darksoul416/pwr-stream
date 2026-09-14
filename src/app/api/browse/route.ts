import { NextRequest, NextResponse } from "next/server";

// Public TMDB demo key — widely used in open source tutorials
const TMDB_API_KEY = "8265bd1679663a7ea12ac168da84d2e8";
const TMDB_BASE = "https://api.themoviedb.org/3";

export interface MediaItem {
  id: string;
  title: string;
  poster: string;
  backdrop: string;
  overview: string;
  year: string;
  rating: number;
  type: "movie" | "tv" | "anime";
  tmdbId: number;
  genreIds?: number[];
}

const IMAGE_BASE = "https://image.tmdb.org/t/p";

function poster(path?: string | null, size = "w342") {
  return path ? `${IMAGE_BASE}/${size}${path}` : "";
}

function mapMedia(item: any, type: "movie" | "tv" | "anime"): MediaItem {
  return {
    id: `${type}-${item.id}`,
    title: item.title || item.name || item.original_name || item.original_title || "Untitled",
    poster: poster(item.poster_path),
    backdrop: poster(item.backdrop_path, "w780"),
    overview: item.overview || "",
    year: (item.release_date || item.first_air_date || "").slice(0, 4),
    rating: Math.round((item.vote_average || 0) * 10) / 10,
    type,
    tmdbId: item.id,
    genreIds: item.genre_ids || [],
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || "trending";
  const sort = searchParams.get("sort") || "popular";
  const page = searchParams.get("page") || "1";

  try {
    let url = "";
    let type: "movie" | "tv" | "anime" = "movie";

    if (category === "trending") {
      url = `${TMDB_BASE}/trending/all/week?api_key=${TMDB_API_KEY}&page=${page}`;
    } else if (category === "movies") {
      type = "movie";
      const sortMap: Record<string, string> = {
        popular: "popular",
        top: "top_rated",
        now: "now_playing",
        upcoming: "upcoming",
      };
      url = `${TMDB_BASE}/movie/${sortMap[sort] || "popular"}?api_key=${TMDB_API_KEY}&page=${page}`;
    } else if (category === "tv") {
      type = "tv";
      const sortMap: Record<string, string> = {
        popular: "popular",
        top: "top_rated",
        now: "on_the_air",
        upcoming: "airing_today",
      };
      url = `${TMDB_BASE}/tv/${sortMap[sort] || "popular"}?api_key=${TMDB_API_KEY}&page=${page}`;
    } else if (category === "anime") {
      type = "anime";
      const sortMap: Record<string, string> = {
        popular: "popularity.desc",
        top: "vote_average.desc",
        now: "first_air_date.desc",
        upcoming: "first_air_date.asc",
      };
      url = `${TMDB_BASE}/discover/tv?api_key=${TMDB_API_KEY}&with_genres=16&with_original_language=ja|ko&sort_by=${
        sortMap[sort] || "popularity.desc"
      }&page=${page}&vote_count.gte=20`;
    } else {
      return NextResponse.json({ error: "Unknown category" }, { status: 400 });
    }

    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream error ${res.status}` },
        { status: res.status }
      );
    }
    const data = await res.json();

    const items: MediaItem[] = (data.results || [])
      .filter((r: any) => r.poster_path)
      .map((r: any) => {
        if (category === "trending") {
          return mapMedia(r, r.media_type === "movie" ? "movie" : "tv");
        }
        return mapMedia(r, type);
      });

    return NextResponse.json({
      items,
      page: data.page,
      totalPages: Math.min(data.total_pages || 1, 500),
      totalResults: data.total_results || 0,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown" }, { status: 500 });
  }
}
