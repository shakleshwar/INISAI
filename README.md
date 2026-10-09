<div align="center">

# 🎵 INISAI

### *High-Fidelity Music Experience & Modern Audiophile Web Player*

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black&style=for-the-badge)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white&style=for-the-badge)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white&style=for-the-badge)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white&style=for-the-badge)](https://tailwindcss.com/)
[![Zustand](https://img.shields.io/badge/State-Zustand-443e38?style=for-the-badge)](https://zustand-demo.pmnd.rs/)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa&logoColor=white&style=for-the-badge)](https://web.dev/progressive-web-apps/)

<p align="center">
  <b>INISAI</b> (இனிசை — <i>Sweet Melody</i>) is a streaming and offline music player that bridges the gap between global online music catalogs and your personal lossless audio vault. Built with an obsidian dark-luxury aesthetic, real-time synchronized lyrics, rich verified artist profiles, and high-fidelity audio playback.
</p>

</div>

---

## ✨ Features

### 🎧 Hybrid Playback Engine
- **Online Streaming**: Stream music with fast proxy routes and low-latency audio delivery.
- **Offline Local Music Vault**: Import personal lossless FLAC, MP3, and WAV files with automatic ID3 tag extraction (artist, album, year, and embedded APIC cover art) via `jsmediatags`.
- **IndexedDB Persistence**: Offline music files and playlists are saved locally in the browser using `localforage`.
- **Audio Quality Switching**: Seamless toggle between Lossless Studio Master and bandwidth-friendly Standard streams.

### 🎤 Synchronized Real-Time Lyrics
- Millisecond-precise timestamped lyrics synced with playback.
- Fluid auto-scrolling that keeps the active vocal line centered in view.
- **Mini-Lyrics Bar**: Compact live lyric strip docked on the desktop player with one-click full-screen expansion.

### 🌟 Verified Artist Profiles & Panoramic Fanart
- **Panoramic Concert Backdrops**: Search for any artist to reveal high-resolution fanart banners, concert backdrops, and Spotify artist photography.
- **Artist Insights**: Verified badges, real follower & listener stats, musical style & genre tags, formation years, band members, and country of origin.
- **Interactive Biography**: Expandable bio cards with official artist websites and social channels.
- **Official Discography**: Discography grid showing complete studio albums with release years and instant playback.

### 🎛️ Dynamic 3D Hero Carousel & Discovery
- **3D CoverFlow Carousel**: Fluid touch-swiping on mobile and keyboard/mouse navigation on desktop.
- **Regional Top Charts**: Instant switching across trending charts (Global, US, UK, India, Japan, Australia, Canada).
- **Curated Radios & Vibes Bento**: Mood-based mixes, fresh new album drops, and 24 categorized musical genres.

### 📱 Progressive Web App (PWA) & MediaSession
- **Installable Application**: Install directly to desktop, iOS, or Android home screen with offline caching.
- **Lock Screen & OS Controls**: Full integration with the native browser MediaSession API (track skips, seek scrubber, artist metadata, high-resolution notification artwork).
- **Drag-and-Drop Queue**: Reorder upcoming tracks seamlessly with `@hello-pangea/dnd`.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Build Tool**: [Vite 8](https://vitejs.dev/) + [LightningCSS](https://lightningcss.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with curated acoustic studio tokens
- **Animations**: [Framer Motion](https://www.framer.com/motion/) for spring physics and transitions
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Local Storage**: [localforage](https://localforage.github.io/localForage/) (IndexedDB engine)
- **Metadata Parser**: [jsmediatags](https://github.com/aadsm/jsmediatags) (Client-side ID3 reader)
- **Icons**: [Lucide React](https://lucide.dev/)

### Backend Server (`/server`)
- **Runtime**: [Node.js](https://nodejs.org/) + [Express 5](https://expressjs.com/) + TypeScript
- **Audio Stream Resolvers**: `yt-dlp-exec`, `play-dl`, `@distube/ytdl-core`
- **Metadata Providers**:
  - [TheAudioDB API](https://www.theaudiodb.com/) (Artist discographies, biographies, fanart, banners)
  - [LRCLib](https://lrclib.net/) (Synchronized real-time lyrics)
  - [iTunes Search API](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iQuery/Index.html) (New releases & global album art)
- **Caching & Rate Limiting**: In-memory cache with TTL headers and rate limiting

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)

### 1. Clone the Repository
```bash
git clone https://github.com/shakleshwar/INISAI.git
cd INISAI
```

### 2. Install Dependencies

**Frontend:**
```bash
npm install
```

**Backend Server:**
```bash
cd server
npm install
cd ..
```

### 3. Run Development Servers

**Start the Backend Server (Port 3001):**
```bash
cd server
npm run dev
```

**Start the Frontend App (Port 5173):**
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to experience INISAI.

---

## 📦 Production Build

To produce an optimized production bundle:

```bash
# Type-check and build the frontend client
npm run build

# Preview the production build locally
npm run preview
```

The output bundle will be placed in the `dist/` directory, configured with service workers and chunk-split vendor caches (`vendor-react`, `vendor-motion`, `vendor-icons`).

---

## 📂 Project Structure

```text
INISAI/
├── public/                 # Static assets, web manifest, and icons
├── server/                 # Express backend API proxy
│   ├── index.ts            # Audio streaming endpoints & proxy routing
│   ├── audiodb.ts          # TheAudioDB integration & caching
│   └── package.json        # Server dependencies
├── src/
│   ├── components/
│   │   ├── audio/          # LyricsView, MiniLyrics, QueueView
│   │   ├── home/           # Carousel3D, HeroSection, TopArtists, NewReleases
│   │   ├── layout/         # Sidebar, BottomPlayer, MobileNav, Layout
│   │   └── ui/             # ArtImage, ContextMenus, Modals
│   ├── pages/
│   │   ├── Home.tsx        # Discover dashboard & charts
│   │   ├── Albums.tsx      # Artist profiles, discographies & radio
│   │   ├── Library.tsx     # Unified search & artist spotlight
│   │   ├── LocalMusic.tsx  # Local file importer & player
│   │   ├── LikedSongs.tsx  # Favorited songs collection
│   │   └── Genres.tsx      # Genre explorer
│   ├── services/
│   │   └── api.ts          # REST client for backend APIs
│   ├── store/
│   │   └── useAudioStore.ts# Core audio playback & queue store (Zustand)
│   ├── types/              # TypeScript models & track definitions
│   ├── App.tsx             # Route declarations
│   ├── index.css           # Design tokens, optical blur & typography
│   └── main.tsx            # React application entry point
├── package.json
├── tsconfig.json
└── vite.config.ts          # Vite build, PWA & chunking configuration
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Space</kbd> | Play / Pause current track |
| <kbd>→</kbd> | Seek forward 5 seconds |
| <kbd>←</kbd> | Seek backward 5 seconds |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> / <kbd>⌘</kbd> + <kbd>K</kbd> | Focus search bar |
| <kbd>M</kbd> | Toggle Mute |
| <kbd>L</kbd> | Open Lyrics view |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
  <sub>Crafted with passion for sound quality and visual design.</sub>
</div>
