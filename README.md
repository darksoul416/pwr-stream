# 🦸 Mobiman — Watch Anime, Movies & TV

A YouTube-style streaming platform with a dark gaming/streamer aesthetic (PWR style). Stream anime, movies, and TV shows free. No signup required.

![PWR Stream](https://img.shields.io/badge/PWR-Stream-7c3aed?style=for-the-badge&logo=lightning)

## ✨ Features

### 🎬 Streaming
- **Movies, TV Shows, Anime** — all in one place
- **Multi-source playback** — 4 server fallbacks (Vidlove → 2Embed → VidSrc → MultiEmbed)
- **Language dub selector** — Subbed (Japanese) / Dubbed (English) for anime
- **Subtitle selector** — 20+ languages with on/off toggle
- **Quality selector** — Auto / 1080p / 720p / 480p
- **Auto-play next episode** — with "Up Next" preview card

### 🎨 UI/UX
- **PWR dark theme** — electric purple + neon cyan with glow effects
- **Light/Dark mode toggle** — 4 accent color presets (Purple, Cyan, Pink, Green)
- **Keyboard shortcuts** — `G H/M/T/A/S/L` navigation, `?` for help, `T` toggle theme
- **Responsive** — mobile-first with collapsible sidebar
- **PWA installable** — works as a native app on Android/iOS/Desktop

### 📺 Discovery
- **Home page** — Hero carousel + Continue Watching + Coming Soon + Trending
- **Genre browser** — Browse by Action, Comedy, Drama, Sci-Fi, Horror, etc.
- **Universal search** — TMDB + AniList results in one place
- **Coming Soon** — Upcoming movies/TV with countdown badges
- **Anime airing countdowns** — "EP 13 · 5d 0h" badges on currently-airing anime

### 💾 Personalization (localStorage)
- **My List** — Heart any title, dedicated watchlist page
- **Continue Watching** — Progress bars per episode/movie
- **Watch History** — Full history with timestamps
- **Settings persistence** — Audio/subtitle/quality preferences saved

### 🎥 Watch Party
- **Real-time sync** — Watch with friends via WebSocket
- **Chat** — Text chat during playback
- **Room codes** — Share a 6-character code to invite friends

### 💰 Monetization (built-in)
- **Affiliate links** — Amazon Associates + JustWatch partner tags in "Where to Watch"
- **Tip jar** — Buy Me a Coffee + Ko-fi integration
- **Ad slots** — AdSense-ready (safe: never on watch pages)
- **Premium tier** — $4.99/mo upsell (ad-free, cloud sync, profiles)

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Data**: TMDB API (movies/TV) + AniList GraphQL (anime)
- **Streaming**: vidlove.cc (primary), 2embed.cc (fallback)
- **Real-time**: Socket.io (watch party)
- **PWA**: Service Worker + Web App Manifest

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Start dev server
bun run dev

# Open http://localhost:3000
```

### Environment Variables

Create a `.env` file:
```
DATABASE_URL=file:./db/custom.db
```

## 📦 Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import repo
3. Add environment variable: `DATABASE_URL`
4. Deploy → Live in 60 seconds

## ⚙️ Monetization Setup

Edit `src/lib/monetization.ts`:

```typescript
affiliates: {
  amazonTag: "your-amazon-tag-20",    // Amazon Associates
  justWatchPartner: "your-partner",   // JustWatch affiliate
},
tips: {
  buyMeCoffee: "https://buymeacoffee.com/yourname",
  koFi: "https://ko-fi.com/yourname",
},
ads: {
  enabled: true,                       // After AdSense approval
  adsenseClient: "ca-pub-XXXXXXXX",
},
```

## ⚠️ Legal Disclaimer

PWR Stream aggregates publicly available metadata from TMDB and AniList, and embeds video streams from third-party providers. We do not host any content. All trademarks, logos and content belong to their respective owners. For educational/demo purposes only.

## 📄 License

MIT — use it, fork it, ship it.
