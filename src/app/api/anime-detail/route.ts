import { NextRequest, NextResponse } from "next/server";

const ANILIST_URL = "https://graphql.anilist.co";
const TMDB_API_KEY = "8265bd1679663a7ea12ac168da84d2e8";
const TMDB_BASE = "https://api.themoviedb.org/3";

const QUERY_DETAIL = `
  query Detail($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      idMal
      title { romaji english native }
      coverImage { large extraLarge color }
      bannerImage
      averageScore
      meanScore
      popularity
      favourites
      episodes
      duration
      format
      status
      season
      seasonYear
      startDate { year month day }
      endDate { year month day }
      genres
      synonyms
      description(asHtml: false)
      source
      countryOfOrigin
      isAdult
      trailer { id site }
      studios { nodes { name isAnimationStudio } }
      externalLinks { id site type url }
      relations {
        edges { relationType node { id title { english romaji } format } }
      }
      recommendations(sort: RATING_DESC, perPage: 6) {
        nodes {
          mediaRecommendation {
            id
            title { english romaji }
            coverImage { large extraLarge color }
            averageScore
            episodes
            seasonYear
          }
        }
      }
    }
  }
`;

function cleanText(s?: string | null): string {
  if (!s) return "";
  return s
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .trim();
}

/**
 * Search TMDB for the anime by name to find a TMDB TV id, so we can embed
 * via vidsrc.to/embed/tv/{tmdb_id}/{season}/{episode}.
 * Returns the first TV match with a poster.
 */
async function findTmdbTvId(title: string, year?: string): Promise<number | null> {
  try {
    const url = `${TMDB_BASE}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
      title
    )}&first_air_date_year=${year || ""}&include_adult=false&page=1`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    const candidates = (data.results || []).filter(
      (r: any) => r.poster_path && (r.original_language === "ja" || r.original_language === "ko" || r.original_language === "en")
    );
    if (candidates.length) return candidates[0].id;
    if ((data.results || []).length) return data.results[0].id;
    return null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const res = await fetch(ANILIST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: QUERY_DETAIL,
        variables: { id },
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `AniList HTTP ${res.status}` },
        { status: 502 }
      );
    }

    const json = await res.json();
    const a = json.data?.Media;

    if (!a) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const title =
      a.title?.english || a.title?.romaji || a.title?.native || "Untitled";
    const year = a.seasonYear || a.startDate?.year;

    // Try to find TMDB TV id for embedding
    const tmdbId = await findTmdbTvId(title, year ? String(year) : undefined);

    // Fetch TMDB TV details to get episode count + seasons
    let seasons: any[] = [];
    let totalEpisodes = a.episodes || 0;
    if (tmdbId) {
      try {
        const tmdbRes = await fetch(
          `${TMDB_BASE}/tv/${tmdbId}?api_key=${TMDB_API_KEY}`,
          { cache: "no-store" }
        );
        if (tmdbRes.ok) {
          const tmdbData = await tmdbRes.json();
          seasons = (tmdbData.seasons || [])
            .filter((s: any) => s.season_number > 0)
            .map((s: any) => ({
              seasonNumber: s.season_number,
              name: s.name,
              episodeCount: s.episode_count,
              poster: s.poster_path
                ? `https://image.tmdb.org/t/p/w342${s.poster_path}`
                : "",
              overview: s.overview || "",
            }));
          totalEpisodes = tmdbData.number_of_episodes || totalEpisodes;
        }
      } catch {
        // ignore
      }
    }

    const studios = (a.studios?.nodes || [])
      .filter((s: any) => s.isAnimationStudio)
      .map((s: any) => s.name);
    const allStudios = (a.studios?.nodes || []).map((s: any) => s.name);

    const recommendations = (a.recommendations?.nodes || [])
      .map((n: any) => n.mediaRecommendation)
      .filter(Boolean)
      .map((r: any) => ({
        id: `anilist-${r.id}`,
        anilistId: r.id,
        title: r.title?.english || r.title?.romaji || "Untitled",
        poster: r.coverImage?.large || "",
        score: Math.round((r.averageScore || 0) / 10),
        year: r.seasonYear ? String(r.seasonYear) : "",
        episodes: r.episodes || null,
      }));

    const trailer =
      a.trailer?.id && a.trailer?.site === "youtube"
        ? `https://www.youtube.com/embed/${a.trailer.id}`
        : null;

    const detail = {
      id: `anilist-${a.id}`,
      anilistId: a.id,
      malId: a.idMal,
      title,
      titleEnglish: a.title?.english,
      titleRomaji: a.title?.romaji,
      titleNative: a.title?.native,
      synonyms: a.synonyms || [],
      poster: a.coverImage?.extraLarge || a.coverImage?.large || "",
      banner: a.bannerImage || a.coverImage?.extraLarge || "",
      color: a.coverImage?.color || "",
      synopsis: cleanText(a.description),
      year: year ? String(year) : "",
      season: a.season || "",
      score: a.averageScore ? Math.round(a.averageScore / 10) : 0,
      meanScore: a.meanScore ? Math.round(a.meanScore / 10) : 0,
      popularity: a.popularity || 0,
      favourites: a.favourites || 0,
      episodes: a.episodes || totalEpisodes || 0,
      duration: a.duration || null,
      format: a.format || "TV",
      status: a.status || "",
      startDate: a.startDate,
      endDate: a.endDate,
      genres: a.genres || [],
      studios,
      allStudios,
      source: a.source || "",
      countryOfOrigin: a.countryOfOrigin || "",
      isAdult: a.isAdult || false,
      trailer,
      seasons,
      tmdbId,
      embedBaseUrl: tmdbId
        ? `https://player.vidlove.cc/embed/tv/${tmdbId}`
        : null,
      embedSources: tmdbId
        ? [
            { id: "vidlove", label: "Server 1 (Vidlove)", url: `https://player.vidlove.cc/embed/tv/${tmdbId}/1/1` },
            { id: "2embed", label: "Server 2 (2Embed)", url: `https://www.2embed.cc/embedtv/${tmdbId}&s=1&e=1` },
            { id: "vidsrc", label: "Server 3 (VidSrc)", url: `https://vidsrc.to/embed/tv/${tmdbId}/1/1` },
            { id: "multiembed", label: "Server 4 (MultiEmbed)", url: `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=1&e=1` },
          ]
        : [],
      recommendations,
      type: "anime" as const,
    };

    return NextResponse.json(detail);
  } catch (e: any) {
    console.error("[anime-detail] error:", e?.message || e);
    return NextResponse.json(
      { error: e?.message || "Unknown" },
      { status: 500 }
    );
  }
}
