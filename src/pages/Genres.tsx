import { useState } from 'react';
import { Play, Pause, Music, ArrowLeft, Disc3, Headphones } from 'lucide-react';
import { api } from '../services/api';
import { useAudioStore } from '../store/useAudioStore';
import type { Track } from '../types';
import { ArtImage } from '../components/ui/ArtImage';

const ALL_GENRES = [
  { name: 'Pop', gradient: 'from-pink-500 to-rose-600', artist: 'Taylor Swift', album: '1989' },
  { name: 'Dance', gradient: 'from-fuchsia-500 to-pink-600', artist: 'Dua Lipa', album: 'Future Nostalgia' },
  { name: 'K-Pop', gradient: 'from-pink-400 to-fuchsia-600', artist: 'BTS', album: 'Map of the Soul 7' },
  { name: 'Latin', gradient: 'from-yellow-500 to-red-500', artist: 'Bad Bunny', album: 'Un Verano Sin Ti' },
  { name: 'Bollywood', gradient: 'from-orange-400 to-pink-500', artist: 'A.R. Rahman', album: 'Rockstar' },
  { name: 'Afrobeats', gradient: 'from-yellow-400 to-orange-500', artist: 'Burna Boy', album: 'African Giant' },
  { name: 'Rock', gradient: 'from-red-600 to-orange-500', artist: 'AC/DC', album: 'Back in Black' },
  { name: 'Metal', gradient: 'from-zinc-600 to-zinc-800', artist: 'Metallica', album: 'Master of Puppets' },
  { name: 'Punk', gradient: 'from-red-500 to-pink-600', artist: 'Green Day', album: 'Dookie' },
  { name: 'Indie', gradient: 'from-lime-500 to-green-600', artist: 'Arctic Monkeys', album: 'AM' },
  { name: 'Country', gradient: 'from-orange-500 to-amber-600', artist: 'Johnny Cash', album: 'At Folsom Prison' },
  { name: 'Folk', gradient: 'from-emerald-600 to-teal-500', artist: 'Bob Dylan', album: 'Highway 61 Revisited' },
  { name: 'Hip-Hop', gradient: 'from-purple-600 to-violet-500', artist: 'Kendrick Lamar', album: 'DAMN.' },
  { name: 'R&B', gradient: 'from-indigo-600 to-blue-500', artist: 'The Weeknd', album: 'After Hours' },
  { name: 'Soul', gradient: 'from-rose-600 to-red-700', artist: 'Aretha Franklin', album: 'Lady Soul' },
  { name: 'Reggae', gradient: 'from-green-500 to-yellow-400', artist: 'Bob Marley', album: 'Legend' },
  { name: 'Blues', gradient: 'from-blue-700 to-indigo-600', artist: 'B.B. King', album: 'Live at the Regal' },
  { name: 'Gospel', gradient: 'from-sky-400 to-blue-500', artist: 'Kirk Franklin', album: 'The Nu Nation Project' },
  { name: 'Electronic', gradient: 'from-cyan-500 to-blue-600', artist: 'Daft Punk', album: 'Discovery' },
  { name: 'Chill', gradient: 'from-teal-500 to-emerald-500', artist: 'Lana Del Rey', album: 'Born to Die' },
  { name: 'Lo-fi', gradient: 'from-violet-500 to-purple-700', artist: 'J Dilla', album: 'Donuts' },
  { name: 'Jazz', gradient: 'from-amber-600 to-yellow-500', artist: 'Miles Davis', album: 'Kind of Blue' },
  { name: 'Classical', gradient: 'from-slate-500 to-zinc-600', artist: 'Ludwig van Beethoven', album: 'Symphony No. 9' },
  { name: 'Anime', gradient: 'from-pink-500 to-purple-500', artist: 'Radwimps', album: 'Your Name' },
];

type GenreItem = typeof ALL_GENRES[number];

// Shuffle once at module load
function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const SHUFFLED_GENRES = shuffleArray(ALL_GENRES);

const ROW_CONFIGS: { speed: number; direction: 'left' | 'right'; genres: GenreItem[] }[] = [
  { speed: 40, direction: 'left',  genres: SHUFFLED_GENRES.slice(0, 6) },
  { speed: 40, direction: 'right', genres: SHUFFLED_GENRES.slice(6, 12) },
  { speed: 40, direction: 'left',  genres: SHUFFLED_GENRES.slice(12, 18) },
  { speed: 40, direction: 'right', genres: SHUFFLED_GENRES.slice(18, 24) },
];

function GravityMarqueeRow({
  genres,
  speed,
  direction,
  onGenreClick,
  globalPaused,
}: {
  genres: GenreItem[];
  speed: number;
  direction: 'left' | 'right';
  onGenreClick: (name: string) => void;
  globalPaused: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const allItems = [...genres, ...genres, ...genres];

  return (
    <div 
      className="relative group/row"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className="relative overflow-hidden w-full py-1"
        style={{
          maskImage: 'linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)',
        }}
      >

        <div
          className="flex gap-4 py-2"
          style={{
            width: 'max-content',
            animation: `genre-marquee-${direction} ${speed}s linear infinite`,
            animationPlayState: globalPaused || isHovered ? 'paused' : 'running',
          }}
        >
          {allItems.map((genre, idx) => (
            <div
              key={`${genre.name}-${idx}`}
              onClick={() => onGenreClick(genre.name)}
              className="genre-marquee-card group relative overflow-hidden rounded-2xl cursor-pointer shrink-0"
              style={{
                width: '240px',
                height: '130px',
                transition: 'transform 0.15s ease-out, filter 0.15s ease-out, opacity 0.15s ease-out',
              }}
            >
              {/* Background Art */}
              <div className="absolute inset-0 z-0">
                <ArtImage
                  artist={genre.artist}
                  album={genre.album}
                  type="genre"
                  fallbackGradient={genre.gradient}
                  className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
                />
                <div className={`absolute inset-0 bg-gradient-to-br ${genre.gradient} opacity-30 mix-blend-multiply transition-opacity duration-300 group-hover:opacity-50`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
              </div>

              {/* Hover border glow */}
              <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-white/20 transition-all duration-300 z-20" />

              {/* Content */}
              <div className="absolute inset-0 p-4 flex flex-col justify-between z-10">
                <h3 className="text-lg font-bold text-white drop-shadow-lg tracking-tight">{genre.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/50 font-medium uppercase tracking-wider">{genre.artist}</span>
                  <div className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300 border border-white/20">
                    <Play size={12} fill="white" className="text-white ml-0.5" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Genres() {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const { setQueue, playTrack, queue, isPlaying, currentIndex, play, pause } = useAudioStore();

  const handleGenreClick = async (genreName: string) => {
    setSelectedGenre(genreName);
    setIsLoading(true);
    try {
      const data = await api.searchOnlineTracks(`${genreName} music hits`);
      setTracks(data);
    } catch (err) {
      console.error('Genre search failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlay = (index: number) => {
    const isSameQueue = queue.length === tracks.length && queue[0]?.id === tracks[0]?.id;
    if (!isSameQueue) {
      setQueue(tracks);
    }
    if (currentIndex === index && isPlaying) {
      pause();
    } else if (currentIndex === index && !isPlaying) {
      play();
    } else {
      playTrack(index);
    }
  };

  const handleBack = () => {
    setSelectedGenre(null);
    setTracks([]);
  };

  // ─── Genre Detail View ───
  if (selectedGenre) {
    const genre = ALL_GENRES.find(g => g.name === selectedGenre);
    return (
      <div className="animate-fade-in pb-32 md:pb-10">
        <div className="relative overflow-hidden pt-12 pb-8">
          <div className={`absolute inset-0 bg-gradient-to-br ${genre?.gradient || 'from-purple-900 to-blue-900'} opacity-20 blur-[80px] pointer-events-none`} />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative px-6 md:px-10 flex flex-col md:flex-row items-center md:items-end gap-8">
            <button onClick={handleBack} className="absolute top-0 left-6 md:left-10 flex items-center gap-2 text-zinc-400 hover:text-white text-sm transition-colors group">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <ArrowLeft size={16} />
              </div>
              <span className="font-medium tracking-wide">Back to Genres</span>
            </button>
            <div className="w-48 h-48 rounded-2xl bg-gradient-to-br shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex items-center justify-center shrink-0 border border-white/20 transform-style-3d hover:[transform:rotateX(10deg)_rotateY(-10deg)_scale(1.02)] transition-all duration-500 overflow-hidden mt-10 md:mt-0 relative group">
              <div className={`absolute inset-0 bg-gradient-to-br ${genre?.gradient || 'from-purple-600 to-blue-600'} opacity-50 mix-blend-multiply z-10`} />
              <ArtImage
                artist={genre?.artist || ''}
                album={genre?.album || ''}
                type="genre"
                fallbackGradient={genre?.gradient || ''}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            </div>
            <div className="text-center md:text-left z-10">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-3 drop-shadow-sm">Genre</p>
              <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/70 tracking-tight mb-4 drop-shadow-xl">{selectedGenre}</h1>
              <p className="text-zinc-400 font-medium">
                {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-[3px] border-zinc-800 border-t-purple-500 rounded-full animate-spin mb-4" />
            <p className="text-sm text-zinc-500">Loading {selectedGenre} tracks…</p>
          </div>
        ) : (
          <div className="px-6 md:px-10">
            {tracks.length > 0 && (
              <div className="py-6 flex items-center gap-6 relative z-10 border-b border-white/[0.02]">
                <button
                  onClick={() => { setQueue(tracks); playTrack(0); }}
                  className={`w-16 h-16 rounded-full bg-gradient-to-br ${genre?.gradient || 'from-blue-400 to-purple-600'} flex items-center justify-center text-white hover:scale-105 transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.1)] group`}
                >
                  <Play size={28} fill="currentColor" className="ml-1.5 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            )}

            <div className="space-y-2 mt-6">
              {tracks.map((track, idx) => {
                const playing = currentIndex === idx && queue[idx]?.id === track.id && isPlaying;
                return (
                  <div
                    key={track.id + idx}
                    onClick={() => handlePlay(idx)}
                    className={`group flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 hover:-translate-y-0.5 library-card-appear ${
                      playing 
                        ? 'bg-blue-500/[0.08] border border-blue-500/20 shadow-[0_4px_20px_rgba(59,130,246,0.1)]' 
                        : 'hover:bg-white/[0.04] border border-transparent hover:shadow-lg'
                    }`}
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    <div className="w-8 text-center shrink-0">
                      {playing ? (
                        <div className="flex items-end justify-center gap-[2px] h-4 mx-auto">
                          {[0,1,2].map(i => (
                            <div key={i} className="w-[2px] rounded-full bg-blue-400 eq-bar" style={{ height: '100%' }} />
                          ))}
                        </div>
                      ) : (
                        <span className={`text-base font-medium tabular-nums ${idx < 3 ? 'text-blue-400' : 'text-zinc-500 group-hover:text-white'} transition-colors`}>{idx + 1}</span>
                      )}
                    </div>
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-800 shrink-0 shadow-md relative border border-white/[0.04]">
                      {track.coverArtUrl ? (
                        <img src={track.coverArtUrl} alt={track.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Music size={20} className="text-zinc-700" /></div>
                      )}
                      <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-300 backdrop-blur-[2px] ${playing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        {playing ? <Pause size={20} fill="white" className="drop-shadow-md" /> : <Play size={20} fill="white" className="ml-1 drop-shadow-md" />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 pr-4">
                      <p className={`font-bold text-base truncate transition-colors ${playing ? 'text-blue-400' : 'text-white group-hover:text-blue-400'}`}>{track.title}</p>
                      <p className="text-sm font-medium text-zinc-400 truncate mt-0.5 group-hover:text-zinc-300 transition-colors">{track.artist}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // GENRE MARQUEE with GRAVITY WELL EFFECT
  // ═══════════════════════════════════════════
  return (
    <div className="animate-fade-in pb-32 md:pb-10 relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-purple-600/6 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/15 to-indigo-900/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#050505]" />

        <div className="relative px-6 md:px-10 pt-12 pb-6">
          <div className="flex items-center justify-between mb-1">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.06] mb-4">
                <Disc3 size={12} className="text-purple-400 animate-spin" style={{ animationDuration: '3s' }} />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{ALL_GENRES.length} Genres</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-zinc-400 leading-tight">
                Genres
              </h1>
              <p className="text-sm text-zinc-500 mt-2 flex items-center gap-2">
                <Headphones size={14} className="text-purple-400" />
                Hover to warp · Click to explore
              </p>
            </div>

            <button
              onClick={() => setIsPaused(!isPaused)}
              className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-all text-zinc-500 hover:text-zinc-300"
            >
              {isPaused ? <Play size={14} /> : <Pause size={14} />}
              <span className="text-xs font-medium hidden sm:inline">{isPaused ? 'Resume' : 'Pause'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Marquee Rows with Gravity */}
      <div className="space-y-4">
        {ROW_CONFIGS.map((config, rowIdx) => (
          <GravityMarqueeRow
            key={rowIdx}
            genres={config.genres}
            speed={config.speed}
            direction={config.direction}
            onGenreClick={handleGenreClick}
            globalPaused={isPaused}
          />
        ))}
      </div>
    </div>
  );
}
