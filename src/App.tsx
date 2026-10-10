import { lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { AudioProvider } from './components/AudioProvider';
import { useSettingsStore, applyThemeTokens } from './store/useSettingsStore';

const Library = lazy(() => import('./pages/Library').then(m => ({ default: m.Library })));
const LocalMusic = lazy(() => import('./pages/LocalMusic').then(m => ({ default: m.LocalMusic })));
const Genres = lazy(() => import('./pages/Genres').then(m => ({ default: m.Genres })));
const Albums = lazy(() => import('./pages/Albums').then(m => ({ default: m.Albums })));
const RecentSongs = lazy(() => import('./pages/RecentSongs').then(m => ({ default: m.RecentSongs })));
const LikedSongs = lazy(() => import('./pages/LikedSongs').then(m => ({ default: m.LikedSongs })));
const Playlist = lazy(() => import('./pages/Playlist').then(m => ({ default: m.Playlist })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));

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

