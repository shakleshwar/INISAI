import { useState } from 'react';
import { Play, Pause, Loader2, ArrowRight, Radio, LayoutGrid, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAudioStore } from '../../store/useAudioStore';
import { ArtImage } from '../ui/ArtImage';

interface StationConfig {
  id: string;
  title: string;
  curator: string;
  description: string;
  query: string;
  artist: string;
  album: string;
}

const CURATED_STATIONS: StationConfig[] = [
  {
    id: 'late-night',
    title: 'Late Night Radio',
    curator: 'Nocturnal R&B & Synthwave',
    description: 'The Weeknd, Frank Ocean, Kavinsky',
    query: 'late night synthwave r&b chill',
    artist: 'The Weeknd',
    album: 'After Hours'
  },
  {
    id: 'deep-focus',
    title: 'Focus & Chill Beats',
    curator: 'Lo-Fi Instrumental Study',
    description: 'J Dilla, Nujabes, Chillhop',
    query: 'lofi chill beats study instrumental',
    artist: 'J Dilla',
    album: 'Donuts'
  },
  {
    id: 'electronic-surge',
    title: 'Electronic Pulse',
    curator: 'Cyberpunk & Club Anthems',
    description: 'Daft Punk, Justice, Deadmau5',
    query: 'cyberpunk edm electronic dance hits',
    artist: 'Daft Punk',
    album: 'Discovery'
  },
  {
    id: 'sunset-indie',
    title: 'Golden Hour Sessions',
    curator: 'Indie Folk & Acoustic',
    description: 'Fleet Foxes, Bon Iver, Lord Huron',
    query: 'acoustic indie folk sunset songs',
    artist: 'Fleet Foxes',
    album: 'Helplessness Blues'
  },
  {
    id: 'gym-heavy',
    title: 'Adrenaline Rush',
    curator: 'Hard Trap, Bass & Hip-Hop',
    description: 'Kendrick Lamar, Travis Scott, Metro',
    query: 'gym workout motivation trap bass',
    artist: 'Kendrick Lamar',
    album: 'DAMN.'
  },
  {
    id: 'pop-euphoria',
    title: 'Pop Euphoria',
    curator: 'Global Chart Anthems',
    description: 'Dua Lipa, The Weeknd, Billie Eilish',
    query: 'viral pop hits feel good anthems',
    artist: 'Dua Lipa',
    album: 'Future Nostalgia'
  }
];

export function VibesAndMoods() {
  const navigate = useNavigate();
  const { setQueue, playTrack, isPlaying, togglePlay } = useAudioStore();
  const [loadingStationId, setLoadingStationId] = useState<string | null>(null);
  const [activeStationId, setActiveStationId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const handlePlayStation = async (station: StationConfig) => {
    if (activeStationId === station.id) {
      togglePlay();
      return;
    }

    try {
      setLoadingStationId(station.id);
      const tracks = await api.searchOnlineTracks(station.query);
      if (tracks && tracks.length > 0) {
        setQueue(tracks);
        playTrack(0);
        setActiveStationId(station.id);
      }
    } catch (err) {
      console.error('Failed to load station tracks:', err);
    } finally {
      setLoadingStationId(null);
    }
  };

  return (
    <section className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
          <h2 className="text-[12px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
            Curated Radio Stations
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* View Switcher: List vs Grid */}
          <div className="hidden sm:flex items-center bg-white/[0.04] p-0.5 rounded-lg border border-white/[0.06]">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="List View"
            >
              <List size={13} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Grid View"
            >
              <LayoutGrid size={13} />
            </button>
          </div>

          <button
            onClick={() => navigate('/genres')}
            className="flex items-center gap-1.5 text-[11px] sm:text-[12px] font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-white/[0.04]"
          >
            <span>All Genres</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Content: List Mode (Default, matches TopCharts perfectly) */}
      {viewMode === 'list' ? (
        <div className="space-y-1">
          {CURATED_STATIONS.slice(0, 6).map((station, index) => {
            const isLoading = loadingStationId === station.id;
            const isCurrentActive = activeStationId === station.id;
            const isCurrentPlaying = isCurrentActive && isPlaying;

            return (
              <div
                key={station.id}
                onClick={() => handlePlayStation(station)}
                className={`group flex items-center gap-3.5 px-3 py-2.5 rounded-xl sm:rounded-2xl cursor-pointer select-none transition-all duration-300 active:scale-[0.99] ${
                  isCurrentActive
                    ? 'bg-white/[0.08] border border-white/20 shadow-[0_4px_24px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.15)] ring-1 ring-white/10'
                    : 'hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06]'
                }`}
                style={{ animationDelay: `${index * 25}ms` }}
              >
                {/* Artwork with vinyl/radio feel */}
                <div className="w-[46px] h-[46px] sm:w-[50px] sm:h-[50px] rounded-xl overflow-hidden bg-zinc-900 shrink-0 relative shadow-md ring-1 ring-white/[0.08]">
                  <ArtImage
                    artist={station.artist}
                    album={station.album}
                    type="album"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  />

                  {/* Play overlay / Loading / Active EQ */}
                  <div
                    className={`absolute inset-0 bg-black/45 backdrop-blur-[1px] flex items-center justify-center transition-opacity duration-200 ${
                      isCurrentActive || isLoading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {isLoading ? (
                      <Loader2 size={16} className="animate-spin text-white" />
                    ) : isCurrentPlaying ? (
                      <div className="flex items-end justify-center gap-[2.5px] h-3.5">
                        {[0, 1, 2].map(i => (
                          <div
                            key={i}
                            className="w-[2.5px] rounded-full bg-white eq-bar"
                            style={{ height: '100%' }}
                          />
                        ))}
                      </div>
                    ) : isCurrentActive ? (
                      <Play size={15} fill="white" className="ml-0.5 text-white" />
                    ) : (
                      <Play size={15} fill="white" className="ml-0.5 text-white scale-95 group-hover:scale-100 transition-transform" />
                    )}
                  </div>
                </div>

                {/* Station Info */}
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <h3
                      className={`font-bold text-[13px] sm:text-[14px] tracking-tight truncate leading-snug transition-colors ${
                        isCurrentActive ? 'text-white' : 'text-zinc-200 group-hover:text-white'
                      }`}
                    >
                      {station.title}
                    </h3>
                  </div>
                  <p className="text-[11px] sm:text-[12px] font-medium text-zinc-400 group-hover:text-zinc-300 transition-colors truncate mt-0.5">
                    {station.curator}
                  </p>
                  <p className="text-[10px] text-zinc-600 truncate mt-0.5 hidden sm:block">
                    {station.description}
                  </p>
                </div>

                {/* Right Badge / Radio icon */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-zinc-500 group-hover:text-zinc-400 transition-colors hidden sm:inline-block">
                    Radio
                  </span>
                  <div className="w-7 h-7 rounded-full bg-white/[0.04] group-hover:bg-white text-zinc-400 group-hover:text-black flex items-center justify-center transition-all duration-200">
                    <Radio size={13} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Grid Mode: 2x2 or 2x3 Photographic Tiles with Real Album Art */
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {CURATED_STATIONS.slice(0, 6).map((station) => {
            const isLoading = loadingStationId === station.id;
            const isCurrentActive = activeStationId === station.id;
            const isCurrentPlaying = isCurrentActive && isPlaying;

            return (
              <div
                key={station.id}
                onClick={() => handlePlayStation(station)}
                className="group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer select-none border border-white/[0.06] hover:border-white/[0.2] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(0,0,0,0.6)] active:scale-[0.98] bg-zinc-900"
              >
                {/* Real Background Album Image */}
                <ArtImage
                  artist={station.artist}
                  album={station.album}
                  type="album"
                  className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-75 transition-all duration-500 group-hover:scale-105"
                />

                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/20" />

                {/* Card Content */}
                <div className="absolute inset-0 p-3 flex flex-col justify-between z-10">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                      Radio
                    </span>
                    <div className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center transition-all duration-200 shadow-md transform scale-95 group-hover:scale-100">
                      {isLoading ? (
                        <Loader2 size={12} className="animate-spin text-black" />
                      ) : isCurrentPlaying ? (
                        <Pause size={12} fill="black" />
                      ) : (
                        <Play size={12} fill="black" className="ml-0.5" />
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-[13px] text-white tracking-tight leading-snug group-hover:translate-x-0.5 transition-transform">
                      {station.title}
                    </h3>
                    <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                      {station.curator}
                    </p>
                  </div>
                </div>

                <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/[0.08] pointer-events-none" />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
