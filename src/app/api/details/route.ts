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
  originalLanguage?: string;
  isAnime?: boolean;
  // tv
  seasons?: Season[];
  episodes?: Episode[];
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  // streaming
  embedUrl: string;
  embedSources?: { id: string; label: string; url: string }[];
  audioTracks?: { id: string; label: string; lang: string }[];
  subtitleLanguages?: { code: string; name: string; englishName: string }[];
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

    // Build embed URLs from multiple providers.
    // Primary: vidlove.cc — discovered via FMHY (fmhy.net/video).
    //   - No X-Frame-Options header (embeddable from any origin)
    //   - Returns a proper video player with auto-play
    //   - URL format: /embed/movie/{tmdb} | /embed/tv/{tmdb}/{season}/{episode}
    // Fallbacks:
    //   - 2embed.cc: /embed/{tmdb} | /embedtv/{tmdb}&s={s}&e={e} (also works in iframe)
    //   - vidsrc.to: requires Cloudflare Turnstile verification, may fail in iframes
    //   - multiembed.mov: redirects through streamingnow.mov
    let embedUrl = "";
    let embedSources: { id: string; label: string; url: string }[] = [];
    if (type === "movie") {
      embedUrl = `https://player.vidlove.cc/embed/movie/${id}`;
      embedSources = [
        { id: "vidlove", label: "Server 1 (Vidlove)", url: `https://player.vidlove.cc/embed/movie/${id}` },
        { id: "2embed", label: "Server 2 (2Embed)", url: `https://www.2embed.cc/embed/${id}` },
        { id: "vidsrc", label: "Server 3 (VidSrc)", url: `https://vidsrc.to/embed/movie/${id}` },
        { id: "multiembed", label: "Server 4 (MultiEmbed)", url: `https://multiembed.mov/?video_id=${id}&tmdb=1` },
      ];
    } else {
      // For TV, default to season 1 episode 1 — caller can override via watch query
      embedUrl = `https://player.vidlove.cc/embed/tv/${id}/1/1`;
      embedSources = [
        { id: "vidlove", label: "Server 1 (Vidlove)", url: `https://player.vidlove.cc/embed/tv/${id}/1/1` },
        { id: "2embed", label: "Server 2 (2Embed)", url: `https://www.2embed.cc/embedtv/${id}&s=1&e=1` },
        { id: "vidsrc", label: "Server 3 (VidSrc)", url: `https://vidsrc.to/embed/tv/${id}/1/1` },
        { id: "multiembed", label: "Server 4 (MultiEmbed)", url: `https://multiembed.mov/?video_id=${id}&tmdb=1&s=1&e=1` },
      ];
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

    // Fetch available translations to determine audio/subtitle languages
    let languages: { code: string; name: string; englishName: string }[] = [];
    try {
      const transRes = await fetch(
        `${TMDB_BASE}/${type}/${id}/translations?api_key=${TMDB_API_KEY}`,
        { next: { revalidate: 3600 } }
      );
      if (transRes.ok) {
        const transData = await transRes.json();
        const seen = new Set<string>();
        languages = (transData.translations || [])
          .filter((t: any) => {
            const code = t.iso_639_1;
            if (!code || seen.has(code)) return false;
            seen.add(code);
            return true;
          })
          .slice(0, 30)
          .map((t: any) => ({
            code: t.iso_639_1,
            name: t.name || t.english_name || t.iso_639_1,
            englishName: t.english_name || t.name || t.iso_639_1,
          }));
      }
    } catch {
      // ignore
    }

    // For anime (TV with animation genre), default subbed = original language, dub = en
    const isAnime = type === "tv" &&
      (data.genres || []).some((g: any) => g.id === 16) &&
      ["ja", "ko"].includes(data.original_language || "");

    // Build audio track options
    const audioTracks: { id: string; label: string; lang: string }[] = [];
    if (isAnime) {
      audioTracks.push(
        { id: "sub", label: "Japanese (Sub)", lang: "ja" },
        { id: "dub", label: "English (Dub)", lang: "en" }
      );
    } else {
      // Movies/TV: use original language + English
      const origLang = data.original_language || "en";
      if (origLang !== "en") {
        audioTracks.push(
          { id: "orig", label: `Original (${origLang.toUpperCase()})`, lang: origLang },
          { id: "en", label: "English", lang: "en" }
        );
      } else {
        audioTracks.push({ id: "en", label: "English", lang: "en" });
      }
      // Add a few common dubs based on available translations
      for (const lang of ["es", "fr", "de", "pt", "it", "ja", "ko"]) {
        if (languages.some((l) => l.code === lang) && lang !== origLang) {
          audioTracks.push({
            id: lang,
            label: new Intl.DisplayNames(["en"], { type: "language" }).of(lang) || lang.toUpperCase(),
            lang,
          });
        }
      }
    }

    // Available subtitle languages (subset of translations)
    const subtitleLanguages = languages.slice(0, 20);

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
      originalLanguage: data.original_language || "",
      isAnime,
      seasons,
      episodes,
      numberOfSeasons: data.number_of_seasons,
      numberOfEpisodes: data.number_of_episodes,
      embedUrl,
      embedSources,
      audioTracks,
      subtitleLanguages,
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
