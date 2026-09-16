import { NextRequest, NextResponse } from "next/server";

const TMDB_API_KEY = "8265bd1679663a7ea12ac168da84d2e8";
const TMDB_BASE = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p";

function poster(path?: string | null, size = "w342") {
  return path ? `${IMAGE_BASE}/${size}${path}` : "";
}

export interface GenreItem {
  id: string;
  tmdbId: number;
  title: string;
  poster: string;
  backdrop: string;
  overview: string;
  year: string;
  rating: number;
  type: "movie" | "tv";
}

// TMDB genre IDs
export const MOVIE_GENRES: { id: number; name: string }[] = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Science Fiction" },
  { id: 10770, name: "TV Movie" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "War" },
  { id: 37, name: "Western" },
];

export const TV_GENRES: { id: number; name: string }[] = [
  { id: 10759, name: "Action & Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 10762, name: "Kids" },
  { id: 9648, name: "Mystery" },
  { id: 10763, name: "News" },
  { id: 10764, name: "Reality" },
  { id: 10765, name: "Sci-Fi & Fantasy" },
  { id: 10766, name: "Soap" },
  { id: 10767, name: "Talk" },
  { id: 10768, name: "War & Politics" },
  { id: 37, name: "Western" },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as "movie" | "tv" | "list";
  const genreId = searchParams.get("genre");
  const page = searchParams.get("page") || "1";

  // If no type or type=list, return the genre list itself
  if (!type || type === "list") {
    return NextResponse.json({
      movie: MOVIE_GENRES,
      tv: TV_GENRES,
    });
  }

  if (!genreId) {
    return NextResponse.json(
      { error: "Missing genre id" },
      { status: 400 }
    );
  }

  try {
    const url = `${TMDB_BASE}/discover/${type}?api_key=${TMDB_API_KEY}&with_genres=${genreId}&sort_by=popularity.desc&page=${page}&vote_count.gte=20`;
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) {
      return NextResponse.json({ error: `HTTP ${res.status}` }, { status: res.status });
    }
    const data = await res.json();
    const items: GenreItem[] = (data.results || [])
      .filter((r: any) => r.poster_path)
      .map((r: any) => ({
        id: `${type}-${r.id}`,
        tmdbId: r.id,
        title: r.title || r.name || "Untitled",
        poster: poster(r.poster_path),
        backdrop: poster(r.backdrop_path, "w780"),
        overview: r.overview || "",
        year: (r.release_date || r.first_air_date || "").slice(0, 4),
        rating: Math.round((r.vote_average || 0) * 10) / 10,
        type,
      }));

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
