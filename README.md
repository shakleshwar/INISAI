# INISAI

A modern web-based music player built with React, TypeScript, and Vite. INISAI provides online streaming, local audio playback with metadata extraction, synchronized lyrics, and artist discography exploration in a responsive interface.

## Overview

INISAI combines online music search and streaming with offline local library management in a unified interface. It features real-time synchronized lyrics, rich artist metadata from TheAudioDB and Spotify, and full PWA support with native media session controls.

## Key Features

- **Audio Playback**: Supports online stream playback and local file playback (MP3, FLAC, WAV) with client-side ID3 tag and embedded cover art extraction via `jsmediatags`.
- **Local Storage**: IndexedDB storage using `localforage` for saving playlists, favorites, and imported tracks offline.
- **Synchronized Lyrics**: Millisecond-accurate timestamp syncing powered by LRCLib, with active line tracking and auto-scrolling.
- **Artist Profiles**: Panoramic artist imagery, follower stats, biographies, and discographies fetched from TheAudioDB.
- **Queue & Playlists**: Reorderable playback queue with drag-and-drop support, repeat, shuffle, and custom playlist management.
- **Progressive Web App**: Installable PWA with offline caching and native MediaSession API integration for OS-level media controls.
- **Responsive Layout**: Optimized for desktop and mobile viewports.

## Tech Stack

### Frontend
- **React 19** with **TypeScript**
- **Vite 8** with LightningCSS
- **Tailwind CSS v4**
- **Zustand** for state management
- **Framer Motion** for animations
- **LocalForage** for IndexedDB persistence
- **jsmediatags** for client-side audio metadata parsing
- **Lucide React** for icons

### Backend
- **Node.js** with **Express 5**
- **yt-dlp-exec** / **play-dl** for stream resolution
- **TheAudioDB** for artist and discography metadata
- **LRCLib** for synced lyrics fetching

## Getting Started

### Prerequisites
- Node.js 18 or higher
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/shakleshwar/INISAI.git
   cd INISAI
   ```

2. Install dependencies:
   ```bash
   # Install frontend dependencies
   npm install

   # Install backend dependencies
   cd server
   npm install
   cd ..
   ```

3. Run the development servers:

   In one terminal, start the backend server (runs on port 3001):
   ```bash
   cd server
   npm run dev
   ```

   In another terminal, start the frontend server (runs on port 5173):
   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173` in your browser.

## Building for Production

```bash
# Build frontend
npm run build

# Preview build locally
npm run preview
```

The production output is generated in the `dist/` directory.

## Project Structure

```text
INISAI/
├── public/                # Static assets and PWA manifest
├── server/                # Express backend API proxy
│   ├── index.ts           # Server entry point and API routes
│   ├── audiodb.ts         # TheAudioDB caching client
│   └── package.json
├── src/
│   ├── components/        # UI components (audio player, hero, layout)
│   ├── pages/             # Route pages (Home, Albums, Library, LocalMusic, etc.)
│   ├── services/          # API service client
│   ├── store/             # Zustand store (playback, queue, preferences)
│   ├── types/             # TypeScript definitions
│   ├── App.tsx            # Application routing
│   └── index.css          # Styles and design tokens
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `Space` | Play / Pause |
| `→` | Seek forward 5s |
| `←` | Seek backward 5s |
| `Ctrl + K` / `Cmd + K` | Focus search |
| `M` | Mute / Unmute |
| `L` | Toggle lyrics |

## License

This project is licensed under the MIT License.
