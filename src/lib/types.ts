// Shared types for PWR Stream app

export type MediaType = "movie" | "tv" | "anime";
export type ViewName =
  | "home"
  | "movies"
  | "tv"
  | "anime"
  | "search"
  | "watch";

export interface MediaItem {
  id: string;
  title: string;
  poster: string;
  backdrop: string;
  overview: string;
  year: string;
  rating: number;
  type: MediaType;
  tmdbId: number;
  genreIds?: number[];
}

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
  seasons?: Season[];
  episodes?: Episode[];
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  embedUrl: string;
  embedSources?: EmbedSource[];
  audioTracks?: AudioTrack[];
  subtitleLanguages?: SubtitleLanguage[];
  cast?: { name: string; character: string; avatar: string }[];
}

export interface EmbedSource {
  id: string;
  label: string;
  url: string;
}

export interface AudioTrack {
  id: string;
  label: string;
  lang: string;
}

export interface SubtitleLanguage {
  code: string;
  name: string;
  englishName: string;
}

export interface AnimeDetails {
  id: string;
  anilistId: number;
  malId?: number;
  title: string;
  titleEnglish?: string;
  titleRomaji?: string;
  titleNative?: string;
  synonyms?: string[];
  poster: string;
  banner: string;
  color?: string;
  synopsis: string;
  year: string;
  season?: string;
  score: number;
  meanScore?: number;
  popularity?: number;
  favourites?: number;
  episodes: number;
  duration?: number | null;
  format?: string;
  status: string;
  startDate?: any;
  endDate?: any;
  genres: string[];
  studios: string[];
  allStudios?: string[];
  source?: string;
  countryOfOrigin?: string;
  isAdult?: boolean;
  trailer?: string | null;
  seasons: any[];
  tmdbId: number | null;
  embedBaseUrl: string | null;
  embedSources?: EmbedSource[];
  audioTracks?: AudioTrack[];
  subtitleLanguages?: SubtitleLanguage[];
  recommendations: any[];
  type: "anime";
}

export interface WatchTarget {
  source: "tmdb" | "anilist";
  type: MediaType;
  id: string; // "movie-123", "tv-456", "anilist-789"
  // optional preset for season/episode (TV/anime)
  season?: number;
  episode?: number;
}
