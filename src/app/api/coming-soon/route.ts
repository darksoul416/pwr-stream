import { NextRequest, NextResponse } from "next/server";

const TMDB_API_KEY = "8265bd1679663a7ea12ac168da84d2e8";
const TMDB_BASE = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p";

function poster(path?: string | null, size = "w342") {
  return path ? `${IMAGE_BASE}/${size}${path}` : "";
}

interface ComingSoonItem {
  id: string;
  tmdbId: number;
  title: string;
  poster: string;
  backdrop: string;
  overview: string;
  releaseDate: string;
  daysUntil: number;
  type: "movie" | "tv";
  rating: number;
}

function daysUntil(dateStr: string): number {
  if (!dateStr) return 0;
  const target = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((target - now) / (1000 * 60 * 60 * 24)));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "all"; // all | movies | tv
  const page = searchParams.get("page") || "1";

  try {
    const promises: Promise<any>[] = [];

    if (type === "all" || type === "movies") {
      promises.push(
        fetch(
          `${TMDB_BASE}/movie/upcoming?api_key=${TMDB_API_KEY}&page=${page}`
        ).then((r) => r.json())
      );
    } else {
      promises.push(Promise.resolve({ results: [] }));
    }

    if (type === "all" || type === "tv") {
      promises.push(
        fetch(
          `${TMDB_BASE}/tv/airing_today?api_key=${TMDB_API_KEY}&page=${page}`
        ).then((r) => r.json())
      );
    } else {
      promises.push(Promise.resolve({ results: [] }));
    }

    const [moviesData, tvData] = await Promise.all(promises);

    const movieItems: ComingSoonItem[] = (moviesData.results || [])
      .filter((m: any) => m.poster_path && m.release_date)
      .map((m: any) => ({
        id: `movie-${m.id}`,
        tmdbId: m.id,
        title: m.title || m.original_title || "Untitled",
        poster: poster(m.poster_path),
        backdrop: poster(m.backdrop_path, "w780"),
        overview: m.overview || "",
        releaseDate: m.release_date,
        daysUntil: daysUntil(m.release_date),
        type: "movie" as const,
        rating: Math.round((m.vote_average || 0) * 10) / 10,
      }))
      .filter((m: ComingSoonItem) => m.daysUntil >= 0 && m.daysUntil <= 90); // next 90 days

    const tvItems: ComingSoonItem[] = (tvData.results || [])
      .filter((s: any) => s.poster_path)
      .slice(0, 20)
      .map((s: any) => ({
        id: `tv-${s.id}`,
        tmdbId: s.id,
        title: s.name || s.original_name || "Untitled",
        poster: poster(s.poster_path),
        backdrop: poster(s.backdrop_path, "w780"),
        overview: s.overview || "",
        releaseDate: s.first_air_date || "",
        daysUntil: s.first_air_date ? daysUntil(s.first_air_date) : 0,
        type: "tv" as const,
        rating: Math.round((s.vote_average || 0) * 10) / 10,
      }));

    // Sort by soonest
    const all = [...movieItems, ...tvItems].sort((a, b) => a.daysUntil - b.daysUntil);

    return NextResponse.json({
      items: all,
      movies: movieItems,
      tv: tvItems,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown" }, { status: 500 });
  }
}
