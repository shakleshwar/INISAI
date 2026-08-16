import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { Library } from './pages/Library';
import { LocalMusic } from './pages/LocalMusic';
import { Genres } from './pages/Genres';
import { Albums } from './pages/Albums';
import { RecentSongs } from './pages/RecentSongs';
import { LikedSongs } from './pages/LikedSongs';
import { Playlist } from './pages/Playlist';
import { AudioProvider } from './components/AudioProvider';

function App() {
  return (
    <AudioProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="library" element={<Library />} />
            <Route path="local" element={<LocalMusic />} />
            <Route path="genres" element={<Genres />} />
            <Route path="albums" element={<Albums />} />
            <Route path="recent" element={<RecentSongs />} />
            <Route path="liked" element={<LikedSongs />} />
            <Route path="playlist/:id" element={<Playlist />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AudioProvider>
  );
}

export default App;

