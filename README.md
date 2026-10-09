<div align="center">

# 🎵 INISAI

### *High-Fidelity Music Experience & Modern Web Player*

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black&style=for-the-badge)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white&style=for-the-badge)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white&style=for-the-badge)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white&style=for-the-badge)](https://tailwindcss.com/)
[![Zustand](https://img.shields.io/badge/State-Zustand-443e38?style=for-the-badge)](https://zustand-demo.pmnd.rs/)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa&logoColor=white&style=for-the-badge)](https://web.dev/progressive-web-apps/)

<p align="center">
  <b>INISAI</b> (இனிசை) is a modern web music application that combines global online streaming with local library management. Built with synchronized lyrics, rich artist profiles and discographies, offline caching, and responsive controls across desktop and mobile.
</p>

</div>

---

## Features

### Hybrid Audio Playback
- **Online Streaming**: Stream music with low-latency audio delivery and quality switching.
- **Local Audio Vault**: Import local audio files (MP3, FLAC, WAV) with automatic ID3 tag extraction (artist, album, year, embedded cover art) via `jsmediatags`.
- **IndexedDB Persistence**: Save offline tracks, favorites, and custom playlists locally using `localforage`.

### Synchronized Lyrics
- Millisecond-accurate timestamp synchronization powered by LRCLib.
- Active vocal line auto-scrolling with real-time text tracking.
- Docked mini-lyrics bar on the player with one-click full-screen expansion.

### Artist Profiles & Discography
- **Panoramic Imagery**: High-resolution artist banners, concert fanart, and Spotify artist photography.
- **Artist Insights**: Verified badges, listener and follower metrics, genres, formation years, and biographies from TheAudioDB.
- **Complete Discographies**: Studio albums with release years and one-click tracklist navigation.

### Discovery & Curated Hubs
- **3D CoverFlow Carousel**: Interactive carousel with touch-swipe gestures on mobile and keyboard navigation on desktop.
- **Regional Top Charts**: Instant switching across trending charts (Global, US, UK, India, Japan, Australia, Canada).
- **Curated Mixes**: Categorized genre grids, fresh releases, and artist radios.

### Queue & Playlist Management
- Drag-and-drop queue reordering powered by `@hello-pangea/dnd`.
- Shuffle, repeat, liked songs library, and custom playlist creation.

### Progressive Web App (PWA)
- Installable on desktop, iOS, and Android with offline asset caching.
- Native browser MediaSession API integration for lock-screen controls, seek scrubbing, and OS notification artwork.

---

## Tech Stack

### Frontend
| Technology | Role |
| :--- | :--- |
| **React 19** | Component architecture & modern hooks |
| **TypeScript** | Static typing & type safety |
| **Vite 8** | Fast build tooling & LightningCSS bundler |
| **Tailwind CSS v4** | Modern utility-first styling |
| **Zustand** | Centralized playback and queue state management |
| **Framer Motion** | Physics-based spring animations & transitions |
| **localforage** | IndexedDB client-side database |
| **jsmediatags** | Client-side ID3 metadata and APIC artwork parser |
| **Lucide React** | Consistent iconography |

### Backend (`/server`)
| Technology | Role |
| :--- | :--- |
| **Node.js + Express 5** | REST API & proxy server |
| **yt-dlp-exec / play-dl** | Audio stream extraction and proxying |
| **TheAudioDB** | Artist metadata, fanart, biographies, and discographies |
| **LRCLib** | Synchronized real-time lyrics API |
| **iTunes Search API** | New album releases and high-res cover resolution |

---

## Getting Started

### Prerequisites
- **Node.js** (v18.0 or higher)
- **npm** or **pnpm**

### 1. Clone the Repository
```bash
git clone https://github.com/shakleshwar/INISAI.git
cd INISAI
```

### 2. Install Dependencies

Install frontend dependencies:
```bash
npm install
```

Install backend dependencies:
```bash
cd server
npm install
cd ..
```

### 3. Run Development Servers

Start the backend server (runs on `http://localhost:3001`):
```bash
cd server
npm run dev
```

In a separate terminal, start the frontend app (runs on `http://localhost:5173`):
```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Production Build

To build the client application for production:

```bash
# Type-check and build frontend
npm run build

# Preview production build locally
npm run preview
```

The optimized static assets will be output to the `dist/` directory with code splitting and service worker caching configured.

---

## Project Structure

```text
INISAI/
├── public/                 # Static assets, web manifest, and icons
├── server/                 # Express backend API proxy
│   ├── index.ts            # Stream proxy & API route handlers
│   ├── audiodb.ts          # TheAudioDB caching client
│   └── package.json        # Backend dependencies
├── src/
│   ├── components/
│   │   ├── audio/          # LyricsView, MiniLyrics, QueueView
│   │   ├── home/           # Carousel3D, HeroSection, TopArtists, NewReleases
│   │   ├── layout/         # Sidebar, BottomPlayer, MobileNav, Layout
│   │   └── ui/             # ArtImage, ContextMenus, Modals
│   ├── pages/
│   │   ├── Home.tsx        # Discover dashboard & regional charts
│   │   ├── Albums.tsx      # Artist profiles, discographies & radio
│   │   ├── Library.tsx     # Unified search & artist spotlight
│   │   ├── LocalMusic.tsx  # Local file importer & player
│   │   ├── LikedSongs.tsx  # Favorited songs collection
│   │   └── Genres.tsx      # Genre explorer
│   ├── services/
│   │   └── api.ts          # API client for backend endpoints
│   ├── store/
│   │   └── useAudioStore.ts# Core audio playback & queue state (Zustand)
│   ├── types/              # TypeScript interfaces
│   ├── App.tsx             # Application routes
│   ├── index.css           # Design tokens, optical blur & typography
│   └── main.tsx            # Application entry point
├── package.json
├── tsconfig.json
└── vite.config.ts          # Vite build, PWA & chunking configuration
```

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Space</kbd> | Play / Pause current track |
| <kbd>→</kbd> | Seek forward 5 seconds |
| <kbd>←</kbd> | Seek backward 5 seconds |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> / <kbd>⌘</kbd> + <kbd>K</kbd> | Focus search bar |
| <kbd>M</kbd> | Toggle Mute |
| <kbd>L</kbd> | Open Lyrics view |

---

## License

This project is licensed under the [MIT License](LICENSE).
