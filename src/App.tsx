import { lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { AudioProvider } from './components/AudioProvider';
import { useSettingsStore, applyThemeTokens } from './store/useSettingsStore';

function lazyRetry(factory: () => Promise<any>, name?: string) {
  return lazy(async () => {
    try {
      const m = await factory();
      const comp = (name && m[name]) || m.default || m;
      return { default: comp };
    } catch (error) {
      console.warn('Chunk import failed, attempting reload for new version...', error);
      const key = 'chunk_reload_' + (name || 'route');
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        window.location.reload();
      }
      throw error;
    }
  });
}

const Library = lazyRetry(() => import('./pages/Library'), 'Library');
const LocalMusic = lazyRetry(() => import('./pages/LocalMusic'), 'LocalMusic');
const Genres = lazyRetry(() => import('./pages/Genres'), 'Genres');
const Albums = lazyRetry(() => import('./pages/Albums'), 'Albums');
const RecentSongs = lazyRetry(() => import('./pages/RecentSongs'), 'RecentSongs');
const LikedSongs = lazyRetry(() => import('./pages/LikedSongs'), 'LikedSongs');
const Playlist = lazyRetry(() => import('./pages/Playlist'), 'Playlist');
const Settings = lazyRetry(() => import('./pages/Settings'), 'Settings');

function App() {
  useEffect(() => {
    const { theme, accentColor } = useSettingsStore.getState();
    applyThemeTokens(theme, accentColor);
  }, []);

  return (
    <AudioProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="library" element={<Library />} />
            <Route path="search" element={<Library />} />
            <Route path="local" element={<LocalMusic />} />
            <Route path="genres" element={<Genres />} />
            <Route path="albums" element={<Albums />} />
            <Route path="recent" element={<RecentSongs />} />
            <Route path="liked" element={<LikedSongs />} />
            <Route path="playlist/:id" element={<Playlist />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AudioProvider>
  );
}

export default App;

