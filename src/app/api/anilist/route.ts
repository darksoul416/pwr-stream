import { NextRequest, NextResponse } from "next/server";

// AniList GraphQL API — free, generous rate limit (~90 req/min), works in Node sandbox
const ANILIST_URL = "https://graphql.anilist.co";

export interface AnimeItem {
  id: string;
  anilistId: number;
  malId?: number;
  title: string;
  titleEnglish?: string;
  titleRomaji?: string;
  poster: string;
  banner?: string;
  color?: string;
  synopsis: string;
  year: string;
  score: number;
  type: string;
  format?: string;
  episodes: number | null;
  status: string;
  season?: string;
  genres: string[];
  studios: string[];
  source: "anilist";
  nextAiringEpisode?: {
    episode: number;
    airingAt: number;
    timeUntilAiring: number;
  } | null;
}

const QUERY_BROWSE = `
  query Browse($page: Int, $perPage: Int, $sort: [MediaSort]) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { currentPage lastPage total perPage }
      media(type: ANIME, sort: $sort, isAdult: false) {
        id
        idMal
        title { romaji english native }
        coverImage { large extraLarge color }
        bannerImage
        averageScore
        meanScore
        episodes
        format
        status
        season
        seasonYear
        startDate { year }
        genres
        description(asHtml: false)
        studios(isMain: true) { nodes { name } }
        nextAiringEpisode { episode airingAt timeUntilAiring }
      }
    }
  }
`;

const QUERY_SEARCH = `
  query Search($search: String!, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { currentPage lastPage total perPage }
      media(type: ANIME, search: $search, isAdult: false, sort: SEARCH_MATCH) {
        id
        idMal
        title { romaji english native }
        coverImage { large extraLarge color }
        bannerImage
        averageScore
        episodes
        format
        status
        seasonYear
        startDate { year }
        genres
        description(asHtml: false)
        studios(isMain: true) { nodes { name } }
        nextAiringEpisode { episode airingAt timeUntilAiring }
      }
    }
  }
`;

const QUERY_SEASON = `
  query Season($season: MediaSeason!, $year: Int!, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { currentPage lastPage total perPage }
      media(type: ANIME, season: $season, seasonYear: $year, isAdult: false, sort: POPULARITY_DESC) {
        id
        idMal
        title { romaji english native }
        coverImage { large extraLarge color }
        bannerImage
        averageScore
        episodes
        format
        status
        seasonYear
        startDate { year }
        genres
        description(asHtml: false)
        studios(isMain: true) { nodes { name } }
        nextAiringEpisode { episode airingAt timeUntilAiring }
      }
    }
  }
`;

function cleanText(s?: string | null): string {
  if (!s) return "";
  return s.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ").trim();
}

function mapAnime(a: any): AnimeItem {
  const year = a.seasonYear || a.startDate?.year || "";
  return {
    id: `anilist-${a.id}`,
    anilistId: a.id,
    malId: a.idMal,
    title: a.title?.english || a.title?.romaji || a.title?.native || "Untitled",
    titleEnglish: a.title?.english,
    titleRomaji: a.title?.romaji,
    poster: a.coverImage?.extraLarge || a.coverImage?.large || "",
    banner: a.bannerImage || a.coverImage?.extraLarge || "",
    color: a.coverImage?.color || "",
    synopsis: cleanText(a.description),
    year: year ? String(year) : "",
    score: Math.round((a.averageScore || 0) / 10) / 1,
    type: "anime",
    format: a.format || "TV",
    episodes: a.episodes || null,
    status: a.status || "",
    season: a.season || "",
    genres: a.genres || [],
    studios: (a.studios?.nodes || []).map((s: any) => s.name).filter(Boolean),
    source: "anilist" as const,
    nextAiringEpisode: a.nextAiringEpisode
      ? {
          episode: a.nextAiringEpisode.episode,
          airingAt: a.nextAiringEpisode.airingAt,
          timeUntilAiring: a.nextAiringEpisode.timeUntilAiring,
        }
      : null,
  };
}

async function gql(query: string, variables: Record<string, any>) {
  const res = await fetch(ANILIST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`AniList HTTP ${res.status}`);
  }
  return res.json();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || "top";
  const q = searchParams.get("q");
  const page = Number(searchParams.get("page") || "1");
  const perPage = Number(searchParams.get("limit") || "24");

  try {
    let data: any;

    if (q) {
      data = await gql(QUERY_SEARCH, {
        search: q,
        page,
        perPage,
      });
    } else if (category === "airing") {
      // current season
      const now = new Date();
      const month = now.getUTCMonth();
      const season = ["WINTER", "SPRING", "SUMMER", "FALL"][Math.floor(month / 3)];
      const year = now.getUTCFullYear();
      data = await gql(QUERY_SEASON, {
        season,
        year,
        page,
        perPage,
      });
    } else if (category === "upcoming") {
      // next season
      const now = new Date();
      const month = now.getUTCMonth();
      const nextMonth = month + 3;
      const nextYear = now.getUTCFullYear() + (nextMonth >= 12 ? 1 : 0);
      const seasonIdx = Math.floor((nextMonth % 12) / 3);
      const season = ["WINTER", "SPRING", "SUMMER", "FALL"][seasonIdx];
      data = await gql(QUERY_SEASON, {
        season,
        year: nextYear,
        page,
        perPage,
      });
    } else {
      // top (by popularity) or top-rated
      const sort =
        category === "toprated"
          ? ["SCORE_DESC", "POPULARITY_DESC"]
          : ["POPULARITY_DESC", "SCORE_DESC"];
      data = await gql(QUERY_BROWSE, { page, perPage, sort });
    }

    const pageData = data.data?.Page;
    if (!pageData) {
      return NextResponse.json({ items: [], error: "no data" }, { status: 502 });
    }

    const items: AnimeItem[] = (pageData.media || []).map(mapAnime);

    return NextResponse.json({
      items,
      page: pageData.pageInfo?.currentPage || 1,
      totalPages: pageData.pageInfo?.lastPage || 1,
      totalResults: pageData.pageInfo?.total || items.length,
    });
  } catch (e: any) {
    console.error("[anilist] error:", e?.message || e);
    return NextResponse.json(
      { items: [], error: e?.message || "Unknown" },
      { status: 500 }
    );
  }
}
