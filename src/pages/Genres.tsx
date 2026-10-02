import { useState } from 'react';
import { Play, Pause, Music, ArrowLeft, Disc3, Headphones } from 'lucide-react';
import { api } from '../services/api';
import { useAudioStore } from '../store/useAudioStore';
import type { Track } from '../types';
import { ArtImage } from '../components/ui/ArtImage';

const ALL_GENRES = [
 { name: 'Pop', gradient: 'from-white/10 to-transparent', artist: 'Taylor Swift', album: '1989' },
 { name: 'Dance', gradient: 'from-white/10 to-transparent', artist: 'Dua Lipa', album: 'Future Nostalgia' },
 { name: 'K-Pop', gradient: 'from-white/10 to-transparent', artist: 'BTS', album: 'Map of the Soul 7' },
 { name: 'Latin', gradient: 'from-white/10 to-transparent', artist: 'Bad Bunny', album: 'Un Verano Sin Ti' },
 { name: 'Bollywood', gradient: 'from-white/10 to-transparent', artist: 'A.R. Rahman', album: 'Rockstar' },
 { name: 'Afrobeats', gradient: 'from-white/10 to-transparent', artist: 'Burna Boy', album: 'African Giant' },
 { name: 'Rock', gradient: 'from-white/10 to-transparent', artist: 'AC/DC', album: 'Back in Black' },
 { name: 'Metal', gradient: 'from-white/10 to-transparent', artist: 'Metallica', album: 'Master of Puppets' },
 { name: 'Punk', gradient: 'from-white/10 to-transparent', artist: 'Green Day', album: 'Dookie' },
 { name: 'Indie', gradient: 'from-white/10 to-transparent', artist: 'Arctic Monkeys', album: 'AM' },
 { name: 'Country', gradient: 'from-white/10 to-transparent', artist: 'Johnny Cash', album: 'At Folsom Prison' },
 { name: 'Folk', gradient: 'from-white/10 to-transparent', artist: 'Bob Dylan', album: 'Highway 61 Revisited' },
 { name: 'Hip-Hop', gradient: 'from-white/10 to-transparent', artist: 'Kendrick Lamar', album: 'DAMN.' },
 { name: 'R&B', gradient: 'from-white/10 to-transparent', artist: 'The Weeknd', album: 'After Hours' },
 { name: 'Soul', gradient: 'from-white/10 to-transparent', artist: 'Aretha Franklin', album: 'Lady Soul' },
 { name: 'Reggae', gradient: 'from-white/10 to-transparent', artist: 'Bob Marley', album: 'Legend' },
 { name: 'Blues', gradient: 'from-white/10 to-transparent', artist: 'B.B. King', album: 'Live at the Regal' },
 { name: 'Gospel', gradient: 'from-white/10 to-transparent', artist: 'Kirk Franklin', album: 'The Nu Nation Project' },
 { name: 'Electronic', gradient: 'from-white/10 to-transparent', artist: 'Daft Punk', album: 'Discovery' },
 { name: 'Chill', gradient: 'from-white/10 to-transparent', artist: 'Lana Del Rey', album: 'Born to Die' },
 { name: 'Lo-fi', gradient: 'from-white/10 to-transparent', artist: 'J Dilla', album: 'Donuts' },
 { name: 'Jazz', gradient: 'from-white/10 to-transparent', artist: 'Miles Davis', album: 'Kind of Blue' },
 { name: 'Classical', gradient: 'from-white/10 to-transparent', artist: 'Ludwig van Beethoven', album: 'Symphony No. 9' },
 { name: 'Anime', gradient: 'from-white/10 to-transparent', artist: 'Radwimps', album: 'Your Name' },
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
 { speed: 40, direction: 'left', genres: SHUFFLED_GENRES.slice(0, 6) },
 { speed: 40, direction: 'right', genres: SHUFFLED_GENRES.slice(6, 12) },
 { speed: 40, direction: 'left', genres: SHUFFLED_GENRES.slice(12, 18) },
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
 className="relative overflow-hidden w-full py-2"
 style={{
 maskImage: 'linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)',
 WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)',
 }}
 >

 <div
 className="flex gap-5 py-2"
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
 className="genre-marquee-card group relative overflow-hidden rounded-2xl cursor-pointer shrink-0 border border-white/[0.04] hover:border-white/[0.15] w-[180px] h-[100px] md:w-[260px] md:h-[140px]"
 style={{
 transition: 'transform 0.15s ease-out, filter 0.15s ease-out, opacity 0.15s ease-out',
 }}
 >
 {/* Background Art */}
 <div className="absolute inset-0 z-0 bg-[#030304]">
 <ArtImage
 artist={genre.artist}
 album={genre.album}
 type="genre"
 fallbackGradient={genre.gradient}
 className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-90"
 />
 <div className={`absolute inset-0 bg-gradient-to-br ${genre.gradient} opacity-50 mix-blend-overlay transition-opacity duration-300 group-hover:opacity-80`} />
 <div className="absolute inset-0 bg-gradient-to-t from-[#030304]/90 via-[#030304]/40 to-transparent"/>
 <div className="absolute inset-0 bg-gradient-to-r from-[#030304]/40 to-transparent"/>
 </div>

 {/* Hover shadow */}
 <div className="absolute inset-0 rounded-2xl shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] z-20 pointer-events-none"/>

 {/* Content */}
 <div className="absolute inset-0 p-4 md:p-5 flex flex-col justify-between z-10">
 <h3 className="text-[18px] md:text-[22px] font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] tracking-tight">{genre.name}</h3>
 <div className="flex items-center justify-between">
 <span className="text-[9px] md:text-[11px] text-zinc-300 font-bold uppercase tracking-widest truncate mr-2">{genre.artist}</span>
 <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300 shadow-[0_4px_16px_rgba(255,255,255,0.2)] hover:scale-110 shrink-0">
 <Play size={16} fill="currentColor"className="text-zinc-950 ml-0.5 w-3.5 h-3.5 md:w-4 md:h-4"/>
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
 <div className="animate-fade-in min-h-screen bg-[#030304]">
 <div className="relative overflow-hidden pt-16 pb-12">
 <div className={`absolute inset-0 bg-gradient-to-br ${genre?.gradient || 'from-white/[0.05] to-transparent'} opacity-10 pointer-events-none`} />
 
 <div className="relative px-6 md:px-10 flex flex-col md:flex-row items-center md:items-end gap-10 max-w-[1400px] mx-auto">
 <button onClick={handleBack} className="absolute top-0 left-6 md:left-10 flex items-center gap-3 text-zinc-400 hover:text-white text-sm transition-colors group">
 <div className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center group-hover:bg-white/[0.08] group-hover:scale-105 transition-all shadow-lg">
 <ArrowLeft size={18} />
 </div>
 <span className="font-bold tracking-widest uppercase text-xs">Back to Genres</span>
 </button>
 <div className="w-56 h-56 rounded-[32px] bg-zinc-900 shadow-[0_24px_64px_rgba(0,0,0,0.6)] flex items-center justify-center shrink-0 border border-white/[0.08] transform-style-3d hover:[transform:rotateX(5deg)_rotateY(-5deg)_scale(1.02)] transition-all duration-500 overflow-hidden mt-16 md:mt-0 relative group">
 <div className={`absolute inset-0 bg-gradient-to-br ${genre?.gradient || 'from-white/10 to-transparent'} opacity-40 mix-blend-overlay z-10`} />
 <ArtImage
 artist={genre?.artist || ''}
 album={genre?.album || ''}
 type="genre"
 fallbackGradient={genre?.gradient || ''}
 className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:opacity-80"
 />
 </div>
 <div className="text-center md:text-left z-10">
 <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white mb-4 drop-shadow-sm">Genre</p>
 <h1 className="text-6xl md:text-[6.5rem] font-black text-white tracking-tighter mb-4 drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)] leading-none">{selectedGenre}</h1>
 <p className="text-zinc-400 font-bold tracking-widest uppercase text-xs">
 {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}
 </p>
 </div>
 </div>
 </div>

 {isLoading ? (
 <div className="flex flex-col items-center justify-center py-20">
 <div className="w-12 h-12 border-[3px] border-white/10 border-t-white rounded-full animate-spin mb-4"/>
 <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Loading {selectedGenre} tracks…</p>
 </div>
 ) : (
 <div className="px-6 md:px-10 max-w-[1400px] mx-auto">
 {tracks.length > 0 && (
 <div className="py-6 flex items-center gap-6 relative z-10 border-b border-white/[0.04] mb-4">
 <button
 onClick={() => { setQueue(tracks); playTrack(0); }}
 className={`w-16 h-16 rounded-full bg-white flex items-center justify-center text-zinc-950 hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_8px_32px_rgba(255,255,255,0.2)]`}
 >
 <Play size={28} fill="currentColor"className="ml-1.5"/>
 </button>
 </div>
 )}

 <div className="flex flex-col gap-1">
 {tracks.map((track, idx) => {
 const playing = currentIndex === idx && queue[idx]?.id === track.id && isPlaying;
 return (
 <div
 key={track.id + idx}
 onClick={() => handlePlay(idx)}
 className={`group flex items-center gap-4 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-300 library-card-appear ${
 playing 
 ? 'bg-white/[0.06] shadow-sm' 
 : 'hover:bg-white/[0.04]'
 }`}
 style={{ animationDelay: `${idx * 30}ms` }}
 >
 <div className={`w-6 text-right text-base font-bold shrink-0 ${playing ? 'text-white' : 'text-zinc-500 group-hover:hidden'}`}>
 {playing ? (
 <div className="flex items-end justify-center gap-[3px] h-4 mx-auto">
 {[0,1,2].map(i => (
 <div key={i} className="w-[3px] rounded-full bg-white eq-bar"style={{ height: '100%' }} />
 ))}
 </div>
 ) : (
 idx + 1
 )}
 </div>
 <div className={`w-6 text-right hidden shrink-0 ${playing ? 'hidden' : 'group-hover:block'}`}>
 <Play size={18} fill="currentColor"className="text-white"/>
 </div>
 
 <div className="w-12 h-12 rounded-md overflow-hidden bg-zinc-900 shrink-0 border border-white/[0.04]">
 {track.coverArtUrl ? (
 <img src={track.coverArtUrl} alt={track.title} className="w-full h-full object-cover"loading="lazy"/>
 ) : (
 <div className="w-full h-full flex items-center justify-center"><Music size={18} className="text-zinc-600"/></div>
 )}
 </div>
 <div className="flex-1 min-w-0 pr-4">
 <p className={`font-bold text-[15px] truncate transition-colors ${playing ? 'text-white' : 'text-zinc-100 group-hover:text-white'}`}>{track.title}</p>
 <p className="text-[13px] font-medium text-zinc-400 truncate mt-0.5 group-hover:text-zinc-300 transition-colors">{track.artist}</p>
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
 <div className="animate-fade-in relative overflow-hidden bg-[#030304]">
 {/* Ambient Background */}


 {/* Hero Header */}
 <div className="relative overflow-hidden pt-12 pb-8">
 <div className="relative px-6 md:px-10 max-w-[1400px] mx-auto">
 <div className="flex items-center justify-between mb-2">
 <div>
 <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 mb-5">
 <Disc3 size={12} className="text-white animate-spin"style={{ animationDuration: '4s' }} />
 <span className="text-[10px] font-bold text-white uppercase tracking-widest">{ALL_GENRES.length} Genres</span>
 </div>
 <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
 Genres
 </h1>
 <p className="text-[13px] font-bold text-zinc-500 uppercase tracking-widest mt-3 flex items-center gap-2">
 <Headphones size={14} className="text-white"/>
 Hover to warp · Click to explore
 </p>
 </div>

 <button
 onClick={() => setIsPaused(!isPaused)}
 className="group flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.1] active:scale-95 transition-all text-zinc-400 hover:text-white"
 >
 {isPaused ? <Play size={14} fill="currentColor"/> : <Pause size={14} fill="currentColor"/>}
 <span className="text-[11px] font-black uppercase tracking-widest hidden sm:inline">{isPaused ? 'Resume' : 'Pause'}</span>
 </button>
 </div>
 </div>
 </div>

 {/* Marquee Rows with Gravity */}
 <div className="space-y-6">
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
