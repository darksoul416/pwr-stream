"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { ArrowLeft, Play, Star, Calendar, Clock, Tv, Film, Sparkles, ChevronDown, Loader2, AlertTriangle, Heart, Share2, Plus, Server, Languages, Subtitles, Settings, SkipForward, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MediaDetails, AnimeDetails, Episode, Season, WatchTarget, MediaItem, AnimeItem, EmbedSource, AudioTrack, SubtitleLanguage } from "@/lib/types";
import { WatchProvidersCard } from "./watch-providers-card";

interface WatchViewProps {
  target: WatchTarget;
  onBack: () => void;
  onPlayItem?: (item: MediaItem | AnimeItem) => void;
}

function isAnimeDetails(d: any): d is AnimeDetails {
  return d && d.type === "anime" && d.anilistId !== undefined;
}

/**
 * Build the embed URL for a given source/season/episode.
 * Different providers have different URL formats:
 *  - vidlove.cc: /embed/movie/{tmdb} or /embed/tv/{tmdb}/{s}/{e} (PRIMARY)
 *  - 2embed.cc: /embed/{tmdb} or /embedtv/{tmdb}&s={s}&e={e}
 *  - vidsrc.to: /embed/movie/{tmdb} or /embed/tv/{tmdb}/{s}/{e}
 *  - multiembed.mov: /?video_id={tmdb}&tmdb=1[&s={s}&e={e}]
 */
function buildEmbedUrl(
  source: EmbedSource,
  isMovie: boolean,
  tmdbId: number,
  season: number,
  episode: number
): string {
  if (isMovie) {
    return source.url;
  }
  // For TV/anime — replace season/episode in URL
  const url = source.url;
  if (source.id === "vidlove") {
    // vidlove uses /tv/{id}/{s}/{e} path format
    return url.replace(/\/tv\/\d+\/\d+\/\d+/, `/tv/${tmdbId}/${season}/${episode}`);
  }
  if (source.id === "2embed") {
    // 2embed uses &s=1&e=1 query string format
    return url.replace(/&s=\d+&e=\d+/, `&s=${season}&e=${episode}`);
  }
  if (source.id === "multiembed") {
    return url.replace(/&s=\d+&e=\d+/, `&s=${season}&e=${episode}`);
  }
  // vidsrc.to / vidsrc.cc use /tv/{id}/{s}/{e} path
  return url.replace(/\/tv\/\d+\/\d+\/\d+/, `/tv/${tmdbId}/${season}/${episode}`);
}

export function WatchView({ target, onBack, onPlayItem }: WatchViewProps) {
  const [details, setDetails] = useState<MediaDetails | AnimeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [season, setSeason] = useState(target.season || 1);
  const [episode, setEpisode] = useState(target.episode || 1);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [seasonsList, setSeasonsList] = useState<Season[]>([]);
  const [showSeasons, setShowSeasons] = useState(false);
  const [showServers, setShowServers] = useState(false);
  const [showAudio, setShowAudio] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [activeSourceId, setActiveSourceId] = useState<string>("vidlove");

  // Language & playback settings (persisted to localStorage)
  const [audioTrackId, setAudioTrackId] = useState<string>("");
  const [subtitleLang, setSubtitleLang] = useState<string>("en");
  const [subtitlesOn, setSubtitlesOn] = useState<boolean>(true);
  const [autoNext, setAutoNext] = useState<boolean>(true);
  const [quality, setQuality] = useState<string>("auto");

  const isMovie = target.type === "movie";
  const isAnime = target.source === "anilist";

  // Load saved settings from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pwr-watch-settings");
      if (saved) {
        const s = JSON.parse(saved);
        if (s.audioTrackId) setAudioTrackId(s.audioTrackId);
        if (s.subtitleLang) setSubtitleLang(s.subtitleLang);
        if (typeof s.subtitlesOn === "boolean") setSubtitlesOn(s.subtitlesOn);
        if (typeof s.autoNext === "boolean") setAutoNext(s.autoNext);
        if (s.quality) setQuality(s.quality);
      }
    } catch {
      // ignore
    }
  }, []);

  // Save settings to localStorage whenever they change
  const saveSettings = useCallback(() => {
    try {
      localStorage.setItem(
        "pwr-watch-settings",
        JSON.stringify({
          audioTrackId,
          subtitleLang,
          subtitlesOn,
          autoNext,
          quality,
        })
      );
    } catch {
      // ignore
    }
  }, [audioTrackId, subtitleLang, subtitlesOn, autoNext, quality]);

  useEffect(() => {
    saveSettings();
  }, [saveSettings]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setDetails(null);

    (async () => {
      try {
        let url = "";
        if (isAnime) {
          const anilistId = target.id.replace(/^anilist-/, "");
          url = `/api/anime-detail?id=${anilistId}`;
        } else {
          const [type, id] = target.id.split("-");
          url = `/api/details?id=${id}&type=${type}`;
        }
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        setDetails(data);
        if (data.seasons?.length) {
          setSeasonsList(data.seasons);
          const targetSeason =
            data.seasons.find((s: Season) => s.seasonNumber === (target.season || 1)) ||
            data.seasons[0];
          setSeason(targetSeason.seasonNumber);
        }
        if (data.episodes?.length) {
          setEpisodes(data.episodes);
        }
        // default episode
        if (target.episode) setEpisode(target.episode);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Failed to load");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [target.id, target.source, target.type]);

  // Load episodes when season changes (for TV and anime with TMDB match)
  useEffect(() => {
    if (isMovie) return;
    if (!details || !seasonsList.length) return;
    if (episodes.length && episodes[0]?.seasonNumber === season) return;

    setEpisodesLoading(true);
    setEpisodes([]);
    (async () => {
      try {
        // For anime, use the TMDB id from the details
        const idToUse = isAnime
          ? (details as AnimeDetails).tmdbId
          : target.id.split("-")[1];
        if (!idToUse) {
          setEpisodesLoading(false);
          return;
        }
        const res = await fetch(`/api/season?id=${idToUse}&season=${season}`);
        if (res.ok) {
          const data = await res.json();
          setEpisodes(data.episodes || []);
        }
      } catch {
        // ignore
      } finally {
        setEpisodesLoading(false);
      }
    })();
  }, [season, isMovie, isAnime, details, seasonsList, episodes, target.id]);

  // Build the list of available embed sources
  const embedSources: EmbedSource[] = useMemo(() => {
    if (!details) return [];
    const all = (details as any).embedSources as EmbedSource[] | undefined;
    if (all && all.length) return all;
    // Fallback: single source from embedUrl
    if ((details as any).embedUrl) {
      return [{ id: "primary", label: "Server 1", url: (details as any).embedUrl }];
    }
    return [];
  }, [details]);

  // Currently active source object
  const activeSource = embedSources.find((s) => s.id === activeSourceId) || embedSources[0];

  // Get the tmdbId for URL building
  const tmdbId = isAnime
    ? (details as AnimeDetails)?.tmdbId || 0
    : (details as MediaDetails)?.tmdbId || 0;

  // Build the final embed URL for the active source + current season/episode
  const embedUrl = useMemo(() => {
    if (!activeSource) return "";
    const base = buildEmbedUrl(activeSource, isMovie, tmdbId, season, episode);
    // Append vidlove query params for additional controls (only vidlove supports these)
    if (activeSource.id === "vidlove") {
      const params = new URLSearchParams({
        autoplay: "true",
        showNextEpisode: autoNext ? "true" : "false",
      });
      if (quality && quality !== "auto") params.set("q", quality);
      return base + (base.includes("?") ? "&" : "?") + params.toString();
    }
    return base;
  }, [activeSource, isMovie, tmdbId, season, episode, autoNext, quality]);

  // Get audio tracks and subtitle languages from details
  const audioTracks: AudioTrack[] = useMemo(() => {
    return (details as any)?.audioTracks || [];
  }, [details]);

  const subtitleLanguages: SubtitleLanguage[] = useMemo(() => {
    return (details as any)?.subtitleLanguages || [];
  }, [details]);

  // Set default audio track when details load
  useEffect(() => {
    if (audioTracks.length && !audioTrackId) {
      setAudioTrackId(audioTracks[0].id);
    }
  }, [audioTracks, audioTrackId]);

  // Find next episode info (for auto-play next)
  const nextEpisodeInfo = useMemo(() => {
    if (isMovie || !episodes.length) return null;
    const currentIdx = episodes.findIndex(
      (e) => e.seasonNumber === season && e.episodeNumber === episode
    );
    if (currentIdx === -1 || currentIdx === episodes.length - 1) return null;
    return episodes[currentIdx + 1];
  }, [episodes, season, episode, isMovie]);

  function selectSeason(s: Season) {
    setSeason(s.seasonNumber);
    setEpisode(1);
    setShowSeasons(false);
  }

  function selectEpisode(ep: Episode) {
    setSeason(ep.seasonNumber);
    setEpisode(ep.episodeNumber);
  }

  const title = details?.title || "Loading...";
  const overview = details?.synopsis || (details as MediaDetails)?.overview || "";
  const year = details?.year || "";
  const rating =
    (details as any)?.score || (details as any)?.rating || 0;
  const poster = details?.poster || "";
  const genres = (details as any)?.genres || [];

  return (
    <div className="min-h-screen pb-16">
      {/* Back bar */}
      <div className="sticky top-16 z-20 bg-background/80 backdrop-blur-xl border-b border-border/40 px-4 lg:px-6 py-3 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-foreground/80 hover:text-foreground transition-colors px-3 py-1.5 rounded-full hover:bg-secondary/60"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 rounded-full bg-secondary/60 border border-border/60 hover:bg-primary/20 hover:border-primary/60 flex items-center justify-center transition-colors" aria-label="Add to library">
            <Plus className="w-4 h-4" />
          </button>
          <button className="w-9 h-9 rounded-full bg-secondary/60 border border-border/60 hover:bg-primary/20 hover:border-primary/60 flex items-center justify-center transition-colors" aria-label="Like">
            <Heart className="w-4 h-4" />
          </button>
          <button className="w-9 h-9 rounded-full bg-secondary/60 border border-border/60 hover:bg-primary/20 hover:border-primary/60 flex items-center justify-center transition-colors" aria-label="Share">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="w-10 h-10 text-primary animate-spin pwr-glow" />
          <p className="text-sm text-muted-foreground mt-4">Loading player...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-32 px-4">
          <AlertTriangle className="w-12 h-12 text-destructive" />
          <p className="text-lg font-bold mt-4">Failed to load content</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
          <button
            onClick={onBack}
            className="mt-6 px-4 py-2 rounded-full bg-primary text-primary-foreground font-semibold text-sm"
          >
            Go back
          </button>
        </div>
      ) : details ? (
        <div className="px-4 lg:px-6 py-4 lg:py-6 space-y-6">
          {/* Title row */}
          <div className="flex items-start gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                {isAnime ? (
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                ) : isMovie ? (
                  <Film className="w-3.5 h-3.5 text-primary" />
                ) : (
                  <Tv className="w-3.5 h-3.5 text-primary" />
                )}
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  {isAnime ? "Anime" : isMovie ? "Movie" : "TV Series"}
                </span>
              </div>
              <h1 className="text-2xl md:text-4xl font-black leading-tight pwr-text-glow">
                {title}
              </h1>
            </div>
          </div>

          {/* Player */}
          <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-border/40 shadow-2xl pwr-border-glow">
            {embedUrl ? (
              <iframe
                key={embedUrl}
                src={embedUrl}
                title={title}
                className="absolute inset-0 w-full h-full"
                allowFullScreen
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-center px-4">
                <div>
                  <AlertTriangle className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
                  <p className="text-sm text-foreground/80">
                    No streaming source available for this title.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try another title — some content isn&apos;t available on 2embed.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Player controls bar — server, audio, subtitles, settings */}
          <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-3 space-y-3">
            {/* Row 1: Server selector + settings dropdowns */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Server selector */}
              {embedSources.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowServers((s) => !s);
                      setShowAudio(false);
                      setShowSubtitles(false);
                      setShowSettings(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border bg-secondary/50 hover:border-primary/60 transition-colors"
                  >
                    <Server className="w-3.5 h-3.5 text-primary" />
                    Server
                    <span className="text-primary/80">·</span>
                    <span className="text-foreground/80">
                      {activeSource?.label?.split(" ")[0] || "Auto"}
                    </span>
                    <ChevronDown className={cn("w-3 h-3 transition-transform", showServers && "rotate-180")} />
                  </button>
                  {showServers && (
                    <div className="absolute left-0 top-full mt-2 w-56 rounded-xl border border-border/60 bg-popover/95 backdrop-blur-xl shadow-2xl overflow-hidden z-30 max-h-72 overflow-y-auto">
                      {embedSources.map((src) => (
                        <button
                          key={src.id}
                          onClick={() => {
                            setActiveSourceId(src.id);
                            setShowServers(false);
                          }}
                          className={cn(
                            "w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium hover:bg-secondary/80 transition-colors text-left",
                            src.id === activeSource?.id && "bg-primary/15 text-primary"
                          )}
                        >
                          <span className="truncate">{src.label}</span>
                          {src.id === activeSource?.id && (
                            <span className="text-primary text-[10px]">●</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Audio language / dub selector */}
              {audioTracks.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowAudio((s) => !s);
                      setShowServers(false);
                      setShowSubtitles(false);
                      setShowSettings(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border bg-secondary/50 hover:border-primary/60 transition-colors"
                  >
                    <Languages className="w-3.5 h-3.5 text-primary" />
                    Audio
                    <span className="text-primary/80">·</span>
                    <span className="text-foreground/80">
                      {audioTracks.find((t) => t.id === audioTrackId)?.label?.split(" ")[0] || audioTracks[0]?.label?.split(" ")[0] || "Auto"}
                    </span>
                    <ChevronDown className={cn("w-3 h-3 transition-transform", showAudio && "rotate-180")} />
                  </button>
                  {showAudio && (
                    <div className="absolute left-0 top-full mt-2 w-56 rounded-xl border border-border/60 bg-popover/95 backdrop-blur-xl shadow-2xl overflow-hidden z-30 max-h-72 overflow-y-auto">
                      {audioTracks.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            setAudioTrackId(t.id);
                            setShowAudio(false);
                          }}
                          className={cn(
                            "w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium hover:bg-secondary/80 transition-colors text-left",
                            t.id === audioTrackId && "bg-primary/15 text-primary"
                          )}
                        >
                          <span className="truncate">{t.label}</span>
                          {t.id === audioTrackId && (
                            <span className="text-primary text-[10px]">●</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Subtitle selector */}
              {subtitleLanguages.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowSubtitles((s) => !s);
                      setShowServers(false);
                      setShowAudio(false);
                      setShowSettings(false);
                    }}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                      subtitlesOn
                        ? "bg-secondary/50 hover:border-primary/60"
                        : "bg-secondary/30 text-muted-foreground border-border/40"
                    )}
                  >
                    <Subtitles className="w-3.5 h-3.5 text-primary" />
                    CC
                    {subtitlesOn && (
                      <>
                        <span className="text-primary/80">·</span>
                        <span className="text-foreground/80 uppercase">{subtitleLang}</span>
                      </>
                    )}
                    <ChevronDown className={cn("w-3 h-3 transition-transform", showSubtitles && "rotate-180")} />
                  </button>
                  {showSubtitles && (
                    <div className="absolute left-0 top-full mt-2 w-56 rounded-xl border border-border/60 bg-popover/95 backdrop-blur-xl shadow-2xl overflow-hidden z-30 max-h-72 overflow-y-auto">
                      <button
                        onClick={() => {
                          setSubtitlesOn(!subtitlesOn);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium hover:bg-secondary/80 transition-colors text-left",
                          !subtitlesOn && "bg-primary/15 text-primary"
                        )}
                      >
                        <span>{subtitlesOn ? "Subtitles On" : "Subtitles Off"}</span>
                        <span className="text-primary text-[10px]">{subtitlesOn ? "ON" : "OFF"}</span>
                      </button>
                      <div className="border-t border-border/40 my-1" />
                      {subtitleLanguages.map((l) => (
                        <button
                          key={l.code}
                          onClick={() => {
                            setSubtitleLang(l.code);
                            setSubtitlesOn(true);
                            setShowSubtitles(false);
                          }}
                          className={cn(
                            "w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium hover:bg-secondary/80 transition-colors text-left",
                            l.code === subtitleLang && subtitlesOn && "bg-primary/15 text-primary"
                          )}
                        >
                          <span className="truncate">{l.englishName}</span>
                          <span className="text-muted-foreground text-[10px] uppercase">{l.code}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Settings (quality + auto-next) */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowSettings((s) => !s);
                    setShowServers(false);
                    setShowAudio(false);
                    setShowSubtitles(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border bg-secondary/50 hover:border-primary/60 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-primary" />
                  <span className="text-foreground/80 uppercase">{quality}</span>
                  <ChevronDown className={cn("w-3 h-3 transition-transform", showSettings && "rotate-180")} />
                </button>
                {showSettings && (
                  <div className="absolute left-0 top-full mt-2 w-64 rounded-xl border border-border/60 bg-popover/95 backdrop-blur-xl shadow-2xl overflow-hidden z-30">
                    {/* Quality */}
                    <div className="px-4 py-2.5 border-b border-border/40">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        Quality
                      </p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {["auto", "1080", "720", "480"].map((q) => (
                          <button
                            key={q}
                            onClick={() => setQuality(q)}
                            className={cn(
                              "px-2 py-1.5 rounded-md text-[11px] font-semibold border transition-all uppercase",
                              quality === q
                                ? "bg-primary/20 text-primary border-primary/50"
                                : "bg-secondary/40 text-foreground/70 border-border/40 hover:border-primary/40"
                            )}
                          >
                            {q === "auto" ? "Auto" : `${q}p`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Auto-play next */}
                    <div className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold flex items-center gap-1.5">
                          <SkipForward className="w-3.5 h-3.5 text-primary" />
                          Auto-play next
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Automatically play next episode
                        </p>
                      </div>
                      <button
                        onClick={() => setAutoNext(!autoNext)}
                        className={cn(
                          "relative w-10 h-6 rounded-full transition-colors",
                          autoNext ? "bg-primary" : "bg-secondary"
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-md",
                            autoNext ? "translate-x-4" : "translate-x-0.5"
                          )}
                        />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <span className="text-[10px] text-muted-foreground/70 ml-auto">
                {activeSource?.id === "vidlove" ? "Plays instantly" : "If a server fails, switch ↑"}
              </span>
            </div>

            {/* Audio track info banner (when dub/sub selected for anime) */}
            {isAnime && audioTracks.find((t) => t.id === audioTrackId) && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/30">
                <Volume2 className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-xs font-semibold text-primary">
                  {audioTracks.find((t) => t.id === audioTrackId)?.label}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  · Audio language preference saved. Stream source may vary based on availability.
                </span>
                {subtitlesOn && (
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    Subs: <span className="uppercase text-foreground/80">{subtitleLang}</span>
                  </span>
                )}
              </div>
            )}

            {/* Next episode preview */}
            {nextEpisodeInfo && autoNext && (
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-secondary/40 border border-border/40">
                <SkipForward className="w-3.5 h-3.5 text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Up Next
                  </p>
                  <p className="text-xs font-semibold truncate">
                    S{nextEpisodeInfo.seasonNumber}·E{nextEpisodeInfo.episodeNumber}: {nextEpisodeInfo.name}
                  </p>
                </div>
                <button
                  onClick={() => selectEpisode(nextEpisodeInfo)}
                  className="px-3 py-1.5 rounded-full bg-primary/20 text-primary border border-primary/40 text-[11px] font-semibold hover:bg-primary/30 transition-colors whitespace-nowrap"
                >
                  Play Now
                </button>
              </div>
            )}
          </div>

          {/* Season/Episode selector for TV */}
          {!isMovie && seasonsList.length > 0 && (
            <div className="rounded-2xl border border-border/40 bg-card/40 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-border/40">
                <h2 className="font-bold flex items-center gap-2">
                  <Tv className="w-4 h-4 text-primary" />
                  Episodes
                </h2>
                {/* Season selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowSeasons((s) => !s)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold bg-secondary/60 border border-border/60 hover:border-primary/60 transition-colors"
                  >
                    Season {season}
                    <ChevronDown
                      className={cn(
                        "w-3.5 h-3.5 transition-transform",
                        showSeasons && "rotate-180"
                      )}
                    />
                  </button>
                  {showSeasons && (
                    <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border/60 bg-popover/95 backdrop-blur-xl shadow-2xl overflow-hidden z-30 max-h-72 overflow-y-auto">
                      {seasonsList.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => selectSeason(s)}
                          className={cn(
                            "w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium hover:bg-secondary/80 transition-colors text-left",
                            s.seasonNumber === season && "bg-primary/15 text-primary"
                          )}
                        >
                          <span className="truncate">{s.name}</span>
                          <span className="text-[10px] text-muted-foreground ml-2">
                            {s.episodeCount} eps
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Episode list */}
              <div className="max-h-96 overflow-y-auto">
                {episodesLoading ? (
                  <div className="p-6 flex justify-center">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  </div>
                ) : (
                  <div className="divide-y divide-border/30">
                    {episodes.map((ep) => {
                      const isActive =
                        ep.seasonNumber === season &&
                        ep.episodeNumber === episode;
                      return (
                        <button
                          key={ep.id}
                          onClick={() => selectEpisode(ep)}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 hover:bg-secondary/40 transition-colors text-left",
                            isActive && "bg-primary/10"
                          )}
                        >
                          <div className="relative w-24 h-14 rounded-md overflow-hidden bg-muted shrink-0">
                            {ep.still ? (
                               
                              <img
                                src={ep.still}
                                alt={ep.name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-primary/30 to-muted flex items-center justify-center text-xs text-muted-foreground">
                                {ep.episodeNumber}
                              </div>
                            )}
                            {isActive && (
                              <div className="absolute inset-0 bg-primary/40 flex items-center justify-center">
                                <Play className="w-5 h-5 text-white fill-current" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-muted-foreground">
                                E{ep.episodeNumber}
                              </span>
                              <h3 className="text-sm font-semibold truncate">
                                {ep.name}
                              </h3>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                              {ep.overview || "No description available."}
                            </p>
                          </div>
                          {ep.runtime && (
                            <span className="text-[10px] text-muted-foreground shrink-0 hidden sm:inline">
                              {ep.runtime}m
                            </span>
                          )}
                        </button>
                      );
                    })}
                    {!episodesLoading && episodes.length === 0 && (
                      <div className="p-6 text-center text-sm text-muted-foreground">
                        No episode list available. Use the player controls to navigate episodes.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* For anime with episodes count but no seasons list */}
          {isAnime && !seasonsList.length && (details as AnimeDetails).episodes > 0 && (
            <div className="rounded-2xl border border-border/40 bg-card/40 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <h2 className="font-bold">Episodes</h2>
                <span className="text-xs text-muted-foreground">
                  ({(details as AnimeDetails).episodes} total)
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Select an episode to play. The video player supports full episode navigation.
              </p>
              <div className="grid grid-cols-6 md:grid-cols-10 gap-2">
                {Array.from({
                  length: Math.min((details as AnimeDetails).episodes, 60),
                }).map((_, i) => {
                  const ep = i + 1;
                  const isActive = ep === episode;
                  return (
                    <button
                      key={ep}
                      onClick={() => setEpisode(ep)}
                      className={cn(
                        "aspect-square rounded-lg text-xs font-bold border transition-all",
                        isActive
                          ? "bg-primary text-primary-foreground border-primary pwr-glow"
                          : "bg-secondary/60 border-border/60 hover:border-primary/60 hover:text-primary"
                      )}
                    >
                      {ep}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="grid md:grid-cols-[1fr_280px] gap-6">
            <div className="space-y-4">
              {/* Quick stats */}
              <div className="flex items-center gap-2 flex-wrap">
                {rating > 0 && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-500/15 text-yellow-300 border border-yellow-400/30">
                    <Star className="w-3 h-3 fill-current" />
                    {rating.toFixed(1)}
                  </span>
                )}
                {year && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-secondary/60 border border-border/60">
                    <Calendar className="w-3 h-3" />
                    {year}
                  </span>
                )}
                {(details as MediaDetails).runtime && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-secondary/60 border border-border/60">
                    <Clock className="w-3 h-3" />
                    {(details as MediaDetails).runtime}m
                  </span>
                )}
                {genres.slice(0, 4).map((g: string) => (
                  <span
                    key={g}
                    className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/30"
                  >
                    {g}
                  </span>
                ))}
              </div>

              {/* Overview */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Synopsis
                </h3>
                <p className="text-sm md:text-base text-foreground/85 leading-relaxed">
                  {overview || "No synopsis available."}
                </p>
              </div>

              {/* Cast */}
              {(details as MediaDetails).cast && (details as MediaDetails).cast!.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    Cast
                  </h3>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {(details as MediaDetails).cast!.map((c, i) => (
                      <div key={i} className="flex flex-col items-center w-20 shrink-0">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-muted border border-border/60">
                          {c.avatar ? (
                             
                            <img
                              src={c.avatar}
                              alt={c.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              loading="lazy"
                            />
                          ) : null}
                        </div>
                        <p className="text-[11px] font-semibold text-center mt-1.5 line-clamp-1">
                          {c.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground text-center line-clamp-1">
                          {c.character}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Studios for anime */}
              {isAnime && (details as AnimeDetails).studios?.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Studios
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(details as AnimeDetails).studios.map((s) => (
                      <span
                        key={s}
                        className="px-3 py-1 rounded-full text-xs font-semibold bg-secondary/60 border border-border/60"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar poster */}
            <aside className="space-y-4">
              {poster && (
                <div className="rounded-2xl overflow-hidden border border-border/40 shadow-xl">
                  { }
                  <img
                    src={poster}
                    alt={title}
                    className="w-full"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              {/* Where to Watch (TMDB watch providers) */}
              {!isAnime && tmdbId > 0 && (
                <WatchProvidersCard tmdbId={tmdbId} type={(details as MediaDetails).type} />
              )}
              {isAnime && tmdbId > 0 && (
                <WatchProvidersCard tmdbId={tmdbId} type="tv" />
              )}

              {/* Recommendations */}
              {(details as AnimeDetails).recommendations?.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    More like this
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {(details as AnimeDetails).recommendations.slice(0, 6).map((r: any) => (
                      <button
                        key={r.id}
                        onClick={() => {
                          if (onPlayItem) {
                            onPlayItem({
                              id: r.id,
                              anilistId: r.anilistId,
                              title: r.title,
                              poster: r.poster,
                              backdrop: r.poster,
                              overview: "",
                              year: r.year,
                              rating: r.score || 0,
                              type: "anime",
                              tmdbId: 0,
                              source: "anilist",
                              format: "TV",
                              episodes: r.episodes,
                              status: "",
                              genres: [],
                              studios: [],
                            } as any);
                          }
                        }}
                        className="group rounded-lg overflow-hidden border border-border/40 hover:border-primary/60 transition-colors text-left pwr-card-hover"
                      >
                        <div className="aspect-[2/3] bg-muted">
                          {r.poster && (
                             
                            <img
                              src={r.poster}
                              alt={r.title}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              loading="lazy"
                            />
                          )}
                        </div>
                        <p className="text-[11px] font-semibold p-1.5 line-clamp-1 group-hover:text-primary transition-colors">
                          {r.title}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      ) : null}
    </div>
  );
}
