import { NextRequest, NextResponse } from "next/server";

const TMDB_API_KEY = "8265bd1679663a7ea12ac168da84d2e8";
const TMDB_BASE = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p";

function poster(path?: string | null, size = "w500") {
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

export interface Season {
  id: number;
  name: string;
  seasonNumber: number;
  episodeCount: number;
  overview: string;
  poster: string;
}

export interface MediaDetails {
  id: string;
  tmdbId: number;
  type: "movie" | "tv";
  title: string;
  originalTitle?: string;
  overview: string;
  poster: string;
  backdrop: string;
  year: string;
  rating: number;
  runtime: number | null;
  genres: string[];
  tagline?: string;
  status: string;
  releaseDate: string;
  // tv
  seasons?: Season[];
  episodes?: Episode[];
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  // streaming
  embedUrl: string;
  // cast
  cast?: { name: string; character: string; avatar: string }[];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const type = searchParams.get("type") as "movie" | "tv";

  if (!id || !type) {
    return NextResponse.json(
      { error: "Missing id or type" },
      { status: 400 }
    );
  }

  try {
    const detailUrl = `${TMDB_BASE}/${type}/${id}?api_key=${TMDB_API_KEY}&append_to_response=credits,content_ratings,release_dates,videos`;
    const res = await fetch(detailUrl, { next: { revalidate: 3600 } });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream error ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Build embed URL for vidsrc.to
    let embedUrl = "";
    if (type === "movie") {
      embedUrl = `https://vidsrc.to/embed/movie/${id}`;
    } else {
      // For TV, default to season 1 episode 1 — caller can override via watch query
      embedUrl = `https://vidsrc.to/embed/tv/${id}/1/1`;
    }

    // For TV, fetch the first season's episodes
    let episodes: Episode[] = [];
    let seasons: Season[] = [];

    if (type === "tv" && data.seasons) {
      seasons = (data.seasons as any[])
        .filter((s) => s.season_number > 0) // skip specials
        .map((s) => ({
          id: s.id,
          name: s.name || `Season ${s.season_number}`,
          seasonNumber: s.season_number,
          episodeCount: s.episode_count || 0,
          overview: s.overview || "",
          poster: poster(s.poster_path),
        }));

      // fetch first season episodes if available
      const firstRealSeason = seasons[0];
      if (firstRealSeason) {
        try {
          const epsUrl = `${TMDB_BASE}/tv/${id}/season/${firstRealSeason.seasonNumber}?api_key=${TMDB_API_KEY}`;
          const epsRes = await fetch(epsUrl, { next: { revalidate: 3600 } });
          if (epsRes.ok) {
            const epsData = await epsRes.json();
            episodes = (epsData.episodes || []).map((e: any) => ({
              id: e.id,
              name: e.name || `Episode ${e.episode_number}`,
              overview: e.overview || "",
              episodeNumber: e.episode_number,
              seasonNumber: firstRealSeason.seasonNumber,
              still: poster(e.still_path),
              runtime: e.runtime || null,
              airDate: e.air_date || "",
            }));
          }
        } catch {
          // ignore
        }
      }
    }

    const cast = (data.credits?.cast || [])
      .slice(0, 12)
      .map((c: any) => ({
        name: c.name,
        character: c.character,
        avatar: poster(c.profile_path, "w185"),
      }));

    const details: MediaDetails = {
      id: `${type}-${id}`,
      tmdbId: Number(id),
      type,
      title: data.title || data.name || "Untitled",
      originalTitle: data.original_title || data.original_name,
      overview: data.overview || "",
      poster: poster(data.poster_path),
      backdrop: poster(data.backdrop_path, "w1280"),
      year: (data.release_date || data.first_air_date || "").slice(0, 4),
      rating: Math.round((data.vote_average || 0) * 10) / 10,
      runtime:
        type === "movie"
          ? data.runtime || null
          : data.episode_run_time?.[0] || null,
      genres: (data.genres || []).map((g: any) => g.name),
      tagline: data.tagline,
      status: data.status || "",
      releaseDate: data.release_date || data.first_air_date || "",
      seasons,
      episodes,
      numberOfSeasons: data.number_of_seasons,
      numberOfEpisodes: data.number_of_episodes,
      embedUrl,
      cast,
    };

    return NextResponse.json(details);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown" }, { status: 500 });
  }
}

// Helper to fetch episodes for a specific season (used by watch view)
export async function fetchSeasonEpisodes(tvId: string, season: number) {
  const url = `${TMDB_BASE}/tv/${tvId}/season/${season}?api_key=${TMDB_API_KEY}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.episodes || []).map((e: any) => ({
    id: e.id,
    name: e.name || `Episode ${e.episode_number}`,
    overview: e.overview || "",
    episodeNumber: e.episode_number,
    seasonNumber: season,
    still: poster(e.still_path),
    runtime: e.runtime || null,
    airDate: e.air_date || "",
  }));
}
