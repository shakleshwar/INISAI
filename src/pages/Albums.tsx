import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Play, Pause, Music, ArrowLeft, Shuffle, Search, X, Heart } from 'lucide-react';
import { api } from '../services/api';
import type { AudioDBArtist, AudioDBTrack } from '../services/api';
import { useAudioStore } from '../store/useAudioStore';
import type { Track } from '../types';
import { ArtImage } from '../components/ui/ArtImage';

function formatDuration(seconds?: number): string {
 if (!seconds || isNaN(seconds)) return '3:00';
 const m = Math.floor(seconds / 60);
 const s = Math.floor(seconds % 60);
 return `${m}:${s.toString().padStart(2, '0')}`;
}

const hashString = (str: string) => {
 let hash = 0;
 for (let i = 0; i < str.length; i++) {
 hash = str.charCodeAt(i) + ((hash << 5) - hash);
 }
 return Math.abs(hash);
};

interface AlbumCard {
 name: string;
 artist: string;
 query: string;
 gradient: string;
}

const POPULAR_ARTISTS = [
 { name: 'Taylor Swift', query: 'Taylor Swift', gradient: 'from-white/10 to-transparent' },
 { name: 'The Weeknd', query: 'The Weeknd', gradient: 'from-white/10 to-transparent' },
 { name: 'Drake', query: 'Drake', gradient: 'from-white/10 to-transparent' },
 { name: 'Billie Eilish', query: 'Billie Eilish', gradient: 'from-white/10 to-transparent' },
 { name: 'Ed Sheeran', query: 'Ed Sheeran', gradient: 'from-white/10 to-transparent' },
 { name: 'Dua Lipa', query: 'Dua Lipa', gradient: 'from-white/10 to-transparent' },
 { name: 'Bad Bunny', query: 'Bad Bunny', gradient: 'from-white/10 to-transparent' },
 { name: 'BTS', query: 'BTS', gradient: 'from-white/10 to-transparent' },
 { name: 'Ariana Grande', query: 'Ariana Grande', gradient: 'from-white/10 to-transparent' },
 { name: 'Post Malone', query: 'Post Malone', gradient: 'from-white/10 to-transparent' },
 { name: 'Arijit Singh', query: 'Arijit Singh', gradient: 'from-white/10 to-transparent' },
 { name: 'A.R. Rahman', query: 'A.R. Rahman', gradient: 'from-white/10 to-transparent' },
];

const POPULAR_ALBUMS: AlbumCard[] = [
 { name: 'Midnights', artist: 'Taylor Swift', query: 'Taylor Swift Midnights', gradient: 'from-white/10 to-transparent' },
 { name: 'After Hours', artist: 'The Weeknd', query: 'The Weeknd After Hours', gradient: 'from-white/10 to-transparent' },
 { name: 'Future Nostalgia', artist: 'Dua Lipa', query: 'Dua Lipa Future Nostalgia', gradient: 'from-white/10 to-transparent' },
 { name: 'Divide', artist: 'Ed Sheeran', query: 'Ed Sheeran Divide', gradient: 'from-white/10 to-transparent' },
 { name: 'Un Verano Sin Ti', artist: 'Bad Bunny', query: 'Bad Bunny Un Verano Sin Ti', gradient: 'from-white/10 to-transparent' },
 { name: 'WHEN WE ALL FALL ASLEEP', artist: 'Billie Eilish', query: 'Billie Eilish WHEN WE ALL FALL ASLEEP', gradient: 'from-white/10 to-transparent' },
 { name: 'Scorpion', artist: 'Drake', query: 'Drake Scorpion', gradient: 'from-white/10 to-transparent' },
 { name: 'Map of the Soul: 7', artist: 'BTS', query: 'BTS Map of the Soul 7', gradient: 'from-white/10 to-transparent' },
 { name: 'Positions', artist: 'Ariana Grande', query: 'Ariana Grande Positions', gradient: 'from-white/10 to-transparent' },
 { name: 'Hollywood Bleeding', artist: 'Post Malone', query: 'Post Malone Hollywood Bleeding', gradient: 'from-white/10 to-transparent' },
 { name: 'Aashiqui 2', artist: 'Arijit Singh', query: 'Arijit Singh Aashiqui 2', gradient: 'from-white/10 to-transparent' },
 { name: 'Rockstar', artist: 'A.R. Rahman', query: 'A.R. Rahman Rockstar', gradient: 'from-white/10 to-transparent' },
];

const RADIO_STATIONS = [
 { name: 'Pop Hits Radio', desc: 'Today\'s biggest pop songs', query: 'pop hits 2024', gradient: 'from-white/5 to-transparent' },
 { name: 'Chill Beats Radio', desc: 'Relaxing beats and lo-fi', query: 'chill lofi beats', gradient: 'from-white/5 to-transparent' },
 { name: 'Rock Classics Radio', desc: 'Timeless rock anthems', query: 'classic rock greatest hits', gradient: 'from-white/5 to-transparent' },
 { name: 'Hip-Hop Radio', desc: 'Hottest rap and hip-hop', query: 'hip hop hits', gradient: 'from-white/5 to-transparent' },
 { name: 'Bollywood Radio', desc: 'Latest and classic Hindi songs', query: 'bollywood hits songs', gradient: 'from-white/5 to-transparent' },
 { name: 'K-Pop Radio', desc: 'Korean pop hits', query: 'kpop hits', gradient: 'from-white/5 to-transparent' },
];

export function Albums() {
 const [selectedItem, setSelectedItem] = useState<{ name: string; query: string; type: 'artist' | 'album' | 'radio' | 'search' } | null>(null);
 const [tracks, setTracks] = useState<Track[]>([]);
 const [artistMeta, setArtistMeta] = useState<AudioDBArtist | null>(null);
 const [trackMeta, setTrackMeta] = useState<AudioDBTrack | null>(null);
 const [isLoading, setIsLoading] = useState(false);
 const [searchQuery, setSearchQuery] = useState('');
 const [suggestions, setSuggestions] = useState<string[]>([]);
 const [showSuggestions, setShowSuggestions] = useState(false);
 const location = useLocation();

 const { setQueue, playTrack, queue, isPlaying, currentIndex, play, pause, likedSongs, toggleLikedSong } = useAudioStore();

 const playingTrack = queue[currentIndex];
 const isPlayingFromHere = selectedItem && playingTrack && tracks.some(t => t.id === playingTrack.id);
 const activeTrack = isPlayingFromHere ? playingTrack : null;

 useEffect(() => {
 if (activeTrack) {
 api.getAudioDBTrack(activeTrack.artist, activeTrack.title).then(meta => {
 setTrackMeta(meta);
 });
 } else {
 setTrackMeta(null);
 }
 }, [activeTrack]);

 useEffect(() => {
 if (searchQuery.trim().length > 1) {
 const timer = setTimeout(() => {
 api.getSuggestions(searchQuery).then(setSuggestions);
 }, 300);
 return () => clearTimeout(timer);
 } else {
 setSuggestions([]);
 }
 }, [searchQuery]);



 const handleSearchSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (searchQuery.trim()) {
 handleItemClick(searchQuery, searchQuery, 'search');
 setShowSuggestions(false);
 }
 };

 const handleItemClick = async (name: string, query: string, type: 'artist' | 'album' | 'radio' | 'search') => {
 setSelectedItem({ name, query, type });
 setIsLoading(true);
 try {
 // Append ' songs' to artist queries to ensure YouTube returns videos instead of channels/playlists
 const searchQuery = type === 'artist' ? `${query} songs` : query;
 const [tracksData, metaData] = await Promise.all([
 api.searchOnlineTracks(searchQuery),
 type === 'artist' ? api.getAudioDBArtist(name) : Promise.resolve(null)
 ]);
 setTracks(tracksData);
 setArtistMeta(metaData);
 } catch (err) {
 console.error('Albums search failed:', err);
 } finally {
 setIsLoading(false);
 }
 };

 useEffect(() => {
 if (location.state?.artist) {
 handleItemClick(location.state.artist, location.state.artist, 'artist');
 // Clear state to avoid re-triggering if user navigates back and forth
 window.history.replaceState({}, document.title);
 }
 }, [location.state?.artist]);

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
 setSelectedItem(null);
 setTracks([]);
 };

 // Detail view
 if (selectedItem) {
 const isArtist = selectedItem.type === 'artist';
 const isSearch = selectedItem.type === 'search';
 const isListLayout = isArtist || isSearch;
 
 // Generate deterministic mock stats for the artist
 const listeners = Math.floor((hashString(selectedItem.name) % 80) + 20) * 1000000 + (hashString(selectedItem.name + 'x') % 999999);
 
 return (
 <div className="animate-fade-in relative">
 {/* Mobile Back Button */}
 <div className="md:hidden sticky top-0 z-50 bg-[var(--color-bg-panel)] border-b border-white/[0.02] px-4 py-3">
 <button 
 onClick={handleBack} 
 className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
 >
 <ArrowLeft size={24} />
 <span className="font-semibold text-sm">Back</span>
 </button>
 </div>

 <button onClick={handleBack} className="hidden md:flex fixed top-24 left-10 z-[60] items-center gap-2 bg-[var(--color-bg-card)] px-4 py-2 rounded-full text-zinc-300 hover:text-white text-sm font-bold transition-all border border-white/10 hover:bg-white/10 hover:scale-105 shadow-xl">
 <ArrowLeft size={16} /> Back
 </button>

 {isArtist ? (
 <div className="relative overflow-hidden pt-32 pb-10 px-6 md:px-10 min-h-[350px] flex items-end">
 <div className="absolute inset-0 z-0">
 <ArtImage 
 artist={selectedItem.name} 
 type="artist"
 className="w-full h-full object-cover shadow-xl transition-transform duration-700 scale-105"
 />
 <div className="absolute inset-0 bg-gradient-to-t from-[#030304] via-[#030304]/60 to-transparent opacity-90"/>
 </div>
 
 <div className="relative z-20 w-full mt-auto max-w-[1400px] mx-auto px-2">
 {/* Verified badge removed */}
 <h1 className="text-6xl md:text-[7rem] font-black text-white tracking-tighter mb-5 drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)] leading-none">{selectedItem.name}</h1>
 <p className="text-white text-sm md:text-base font-bold uppercase tracking-widest">{listeners.toLocaleString()} monthly listeners</p>
 </div>
 </div>
 ) : isSearch ? (
 <div className="relative overflow-hidden pt-32 pb-10 px-6 md:px-10 min-h-[250px] flex items-end">
 <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-[#030304]"/>
 <div className="relative z-20 w-full mt-auto max-w-[1400px] mx-auto px-2">
 <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">Search Results for"{selectedItem.name}"</h1>
 <p className="text-sm font-bold text-white uppercase tracking-widest mt-3">{tracks.length} tracks found</p>
 </div>
 </div>
 ) : (
 <div className="relative overflow-hidden pt-32 pb-10 px-6 md:px-10 min-h-[250px] flex items-end">
 <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-[#030304]"/>
 <div className="relative z-20 w-full mt-auto max-w-[1400px] mx-auto px-2">
 <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">{selectedItem.name}</h1>
 <p className="text-sm font-bold text-white uppercase tracking-widest mt-3">{tracks.length} tracks</p>
 </div>
 </div>
 )}

 {isLoading ? (
 <div className="flex flex-col items-center justify-center py-32">
 <div className="w-12 h-12 border-[3px] border-white/10 border-t-white rounded-full animate-spin mb-4"/>
 <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Loading tracks…</p>
 </div>
 ) : (
 <div className="px-6 md:px-10 mt-6 max-w-[1400px] mx-auto relative z-20">
 {tracks.length > 0 && (
 <div className="flex items-center gap-6 mb-10 px-2">
 <button 
 onClick={() => { setQueue(tracks); playTrack(0); }}
 className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-zinc-950 hover:scale-105 active:scale-95 hover:shadow-[0_8px_32px_rgba(255,255,255,0.2)] transition-all shadow-xl"
 >
 <Play size={32} fill="currentColor"className="ml-1"/>
 </button>
 {isArtist && (
 <>
 <button className="text-zinc-400 hover:text-white transition-colors">
 <Shuffle size={32} strokeWidth={1.5} />
 </button>
 </>
 )}
 </div>
 )}

 {isListLayout && tracks.length > 0 && (
 <h2 className="text-xl font-black text-white mb-6 px-2 tracking-tight">
 {isSearch ? 'Top Results' : 'Popular'}
 </h2>
 )}

 {isListLayout ? (
 <div className="flex flex-col lg:flex-row gap-10 mb-10 px-2">
 {/* Left Column: Popular Tracks */}
 <div className="flex-1 min-w-0 flex flex-col gap-1">
 {tracks.map((track, idx) => {
 const playing = currentIndex === idx && queue[idx]?.id === track.id && isPlaying;
 const mockStreams = Math.floor((hashString(track.id) % 900) + 100) * 1000000 + (hashString(track.id + 's') % 999999);
 const duration = track.duration || ((hashString(track.id) % 180) + 120);
 
 return (
 <div 
 key={track.id + idx} 
 className={`group flex items-center gap-4 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-300 ${playing ? 'bg-white/[0.06] shadow-sm' : 'hover:bg-white/[0.04]'}`}
 onClick={() => handlePlay(idx)}
 >
 <div className={`w-6 text-right text-base font-bold ${playing ? 'text-white' : 'text-zinc-500 group-hover:hidden'}`}>
 {idx + 1}
 </div>
 <div className={`w-6 text-right hidden ${playing ? 'hidden' : 'group-hover:block'}`}>
 <Play size={18} fill="currentColor"className="text-white"/>
 </div>
 
 <div className="w-12 h-12 bg-zinc-900 rounded-md shrink-0 border border-white/[0.04] overflow-hidden">
 {track.coverArtUrl ? (
 <img src={track.coverArtUrl} alt=""className="w-full h-full object-cover"/>
 ) : (
 <div className="w-full h-full flex items-center justify-center"><Music size={18} className="text-zinc-500"/></div>
 )}
 </div>
 
 <div className="flex-1 min-w-0 flex flex-col justify-center">
 <p className={`text-[15px] font-bold truncate ${playing ? 'text-white' : 'text-zinc-100 group-hover:text-white'}`}>{track.title}</p>
 {idx % 2 === 0 && <span className="inline-flex items-center justify-center bg-zinc-400/20 text-zinc-300 text-[9px] rounded-sm w-4 h-4 mt-0.5">E</span>}
 </div>
 
 <div className="hidden md:block w-32 text-right text-[13px] font-medium text-zinc-400 tabular-nums">
 {mockStreams.toLocaleString()}
 </div>
 
 <div className="w-12 text-right text-[13px] font-medium text-zinc-400 tabular-nums">
 {formatDuration(duration)}
 </div>
 </div>
 );
 })}
 
 {/* About Section */}
 {artistMeta && artistMeta.strBiographyEN && (
 <div className="mt-12 pt-10 border-t border-white/[0.06]">
 <h2 className="text-2xl font-black text-white mb-6 tracking-tight">About</h2>
 <div className="bg-[var(--color-bg-card)] border border-white/[0.04] rounded-3xl p-6 md:p-8 hover:bg-white/[0.02] transition-colors group">
 {artistMeta.strArtistThumb && (
 <div className="w-full h-64 md:h-[400px] rounded-2xl overflow-hidden mb-8 shadow-2xl relative border border-white/[0.04]">
 <div className="absolute inset-0 bg-gradient-to-t from-[#030304] to-transparent z-10 opacity-90"></div>
 <img src={artistMeta.strArtistThumb} alt={artistMeta.strArtist} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"/>
 <div className="absolute bottom-8 left-8 z-20">
 <h3 className="text-4xl md:text-5xl font-black text-white tracking-tighter drop-shadow-xl">{artistMeta.strArtist}</h3>
 <p className="text-white font-bold mt-2 uppercase tracking-widest text-xs">{listeners.toLocaleString()} monthly listeners</p>
 </div>
 </div>
 )}
 <p className="text-zinc-400 text-[15px] leading-relaxed line-clamp-[6] hover:line-clamp-none transition-all cursor-pointer font-medium">
 {artistMeta.strBiographyEN}
 </p>
 <div className="flex flex-wrap gap-3 mt-8">
 {artistMeta.strGenre && (
 <span className="px-4 py-2 bg-white/[0.04] border border-white/[0.06] rounded-full text-[11px] font-black text-white tracking-widest uppercase">{artistMeta.strGenre}</span>
 )}
 {artistMeta.intFormedYear && artistMeta.intFormedYear !== '0' && (
 <span className="px-4 py-2 bg-white/[0.04] border border-white/[0.06] rounded-full text-[11px] font-black text-white tracking-widest uppercase">Formed {artistMeta.intFormedYear}</span>
 )}
 {artistMeta.strWebsite && (
 <a href={artistMeta.strWebsite.startsWith('http') ? artistMeta.strWebsite : `https://${artistMeta.strWebsite}`} target="_blank"rel="noreferrer"className="px-4 py-2 bg-white/10 text-white border border-white/20 rounded-full text-[11px] font-black tracking-widest hover:bg-white/20 transition-colors uppercase">
 Website
 </a>
 )}
 </div>
 </div>
 </div>
 )}
 </div>

 {/* Right Column: Track Details */}
 {activeTrack && (
 <div className="w-full lg:w-[360px] shrink-0 flex flex-col gap-6">
 <div className="bg-[var(--color-bg-card)] rounded-2xl p-6 border border-white/[0.04] shadow-xl animate-fade-in">
 <div className="flex items-center justify-between mb-5">
 <h3 className="font-black text-white text-lg tracking-tight">Track Details</h3>
 </div>
 <div className="flex flex-col gap-5">
 <div className="w-full aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-white/[0.04] shadow-2xl relative group">
 {activeTrack.coverArtUrl ? (
 <img src={activeTrack.coverArtUrl} alt={activeTrack.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"/>
 ) : (
 <div className="w-full h-full flex items-center justify-center"><Music size={32} className="text-zinc-600"/></div>
 )}
 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
 </div>
 <div>
 <h4 className="text-2xl font-black text-white truncate tracking-tight">{activeTrack.title}</h4>
 <p className="text-[15px] text-zinc-400 mt-1 font-bold truncate">{activeTrack.artist}</p>
 <div className="flex flex-wrap gap-2 mt-4">
 <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-[10px] font-black text-zinc-300 uppercase tracking-widest">
 {formatDuration(activeTrack.duration || 180)}
 </span>
 <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
 <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"/> Playing
 </span>
 {trackMeta?.strGenre && (
 <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-bold text-white uppercase tracking-widest">
 {trackMeta.strGenre}
 </span>
 )}
 </div>
 {trackMeta?.strAlbum && (
 <p className="text-[13px] font-medium text-zinc-500 mt-4">
 Album: <span className="text-zinc-300 font-bold">{trackMeta.strAlbum}</span>
 </p>
 )}
 {trackMeta?.strDescriptionEN && (
 <p className="text-[13px] text-zinc-400 mt-3 line-clamp-4 hover:line-clamp-none transition-all cursor-pointer font-medium leading-relaxed">
 {trackMeta.strDescriptionEN}
 </p>
 )}
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 ) : (
 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
 {tracks.map((track, idx) => {
 const isCurrentlyPlaying = currentIndex === idx && queue[idx]?.id === track.id && isPlaying;
 const isLiked = (likedSongs || []).some(t => t.id === track.id);
 
 return (
 <div 
 key={track.id + idx} 
 className="group cursor-pointer transform-style-3d hover:[transform:rotateX(5deg)_rotateY(-5deg)_scale(1.02)] transition-all duration-500 animate-fade-in"
 style={{ animationDelay: `${idx * 40}ms` }}
 onClick={() => handlePlay(idx)}
 >
 <div className={`relative aspect-square rounded-2xl overflow-hidden shadow-xl mb-3 border transition-all duration-500 ${isCurrentlyPlaying ? 'border-white/50 shadow-[0_10px_30px_rgba(255,255,255,0.2)]' : 'border-white/[0.04] group-hover:border-white/[0.1] group-hover:shadow-2xl bg-zinc-900'}`}>
 {track.coverArtUrl ? (
 <img src={track.coverArtUrl} alt={track.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"loading="lazy"/>
 ) : (
 <div className="w-full h-full flex items-center justify-center bg-[#030304]">
 <Music className="text-zinc-700 w-10 h-10"/>
 </div>
 )}
 
 {/* Hover overlay with glassmorphism */}
 <div className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center transition-all duration-300 ${isCurrentlyPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
 {/* Play button */}
 <div className={`w-14 h-14 rounded-full bg-white flex items-center justify-center text-zinc-950 shadow-[0_4px_24px_rgba(255,255,255,0.3)] transition-all duration-300 ${isCurrentlyPlaying ? 'scale-100' : 'scale-75 group-hover:scale-100 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]'}`}>
 {isCurrentlyPlaying ? <Pause size={24} fill="currentColor"/> : <Play size={24} fill="currentColor"className="ml-1"/>}
 </div>
 </div>

 {/* Rank badge for top 3 */}
 {idx < 3 && (
 <div className="absolute top-3 left-3 w-8 h-8 rounded-xl bg-[#030304]/80 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/[0.08] z-10">
 <span className="text-[13px] font-black text-white">{idx + 1}</span>
 </div>
 )}

 {/* Like button */}
 <button
 className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 z-10 ${isLiked ? 'bg-white shadow-md scale-100' : 'bg-black/40 backdrop-blur-md scale-0 group-hover:scale-100 border border-white/10 hover:bg-white/20'}`}
 onClick={(e) => { e.stopPropagation(); toggleLikedSong(track); }}
 >
 <Heart size={14} className={isLiked ? 'text-black fill-black' : 'text-white'} />
 </button>

 {/* Playing indicator */}
 {isCurrentlyPlaying && (
 <div className="absolute bottom-3 left-3 flex items-end gap-[3px] h-5 z-10">
 {[0,1,2].map(i => (
 <div key={i} className="w-[3px] rounded-full bg-white eq-bar"style={{ height: '100%' }} />
 ))}
 </div>
 )}
 </div>
 
 <h3 className={`font-bold truncate text-[15px] transition-colors ${isCurrentlyPlaying ? 'text-white' : 'text-zinc-100 group-hover:text-white'}`} title={track.title}>
 {track.title}
 </h3>
 <p className="text-[13px] text-zinc-400 font-medium truncate mt-0.5 group-hover:text-zinc-300 transition-colors"title={track.artist}>{track.artist}</p>
 </div>
 );
 })}
 </div>
 )}
 </div>
 )}
 </div>
 );
 }

  // Browse view
  return (
    <div className="animate-fade-in">
      <div className="px-6 md:px-10 pt-12 pb-6">
        <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">Albums & Artists</h1>
        <p className="text-[15px] font-medium text-zinc-500 mb-10">Explore popular artists, albums, and radio stations</p>

        {/* Search Bar */}
        <div className="relative max-w-2xl group z-50">
          <div className="absolute inset-0 bg-white/10 rounded-full blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"/>
          <form onSubmit={handleSearchSubmit} className="relative z-20">
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-zinc-500 group-focus-within:text-white transition-colors duration-300"/>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setShowSuggestions(false)}
              className="block w-full pl-14 pr-12 py-5 bg-[var(--color-bg-panel)] border border-white/[0.06] rounded-full text-[15px] font-bold text-white placeholder-zinc-500 focus:outline-none focus:border-white/50 focus:scale-[1.01] transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
              placeholder="Search for artists, albums, or songs..."
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => { setSearchQuery(''); setSuggestions([]); }} 
                className="absolute inset-y-0 right-0 pr-6 flex items-center text-zinc-500 hover:text-white transition-colors"
              >
                <X className="h-5 w-5"/>
              </button>
            )}
          </form>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-3 bg-[var(--color-bg-panel)] border border-white/[0.08] rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.6)] overflow-hidden animate-fade-in p-2">
              <ul className="max-h-[300px] overflow-y-auto custom-scrollbar">
                {suggestions.map((suggestion, idx) => (
                  <li key={idx}>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSearchQuery(suggestion);
                        handleItemClick(suggestion, suggestion, 'search');
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/[0.04] text-[15px] font-bold text-zinc-300 hover:text-white transition-colors flex items-center gap-4 group"
                    >
                      <Search className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors"/>
                      <span className="truncate">{suggestion}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 md:px-10 space-y-16 mt-4">
        {/* Popular Artists — Circular */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1.5 h-6 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.6)]"/>
            <h2 className="text-2xl font-black text-white tracking-tight">Top Artists</h2>
          </div>
          <div className="flex gap-4 md:gap-8 overflow-x-auto custom-scrollbar pb-6 pt-4 px-2 -mx-2">
            {POPULAR_ARTISTS.map((artist) => (
              <button
                key={artist.name}
                onClick={() => handleItemClick(artist.name, artist.query, 'artist')}
                className="flex flex-col items-center gap-3 md:gap-5 shrink-0 group w-24 md:w-36 outline-none"
              >
                <div className="relative">
                  <div className={`absolute -inset-4 bg-gradient-to-tr ${artist.gradient} rounded-full opacity-0 group-hover:opacity-20 blur-2xl transition-all duration-700 group-hover:scale-110`} />
                  <div className="w-24 h-24 md:w-36 md:h-36 rounded-full overflow-hidden shadow-2xl border border-white/[0.04] group-hover:border-white/[0.15] transition-all duration-500 relative transform-gpu group-hover:-translate-y-2 group-hover:scale-105 z-10">
                    <ArtImage 
                      artist={artist.name} 
                      type="artist"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end pb-4 items-center">
                      <Play size={24} fill="currentColor" className="text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 w-5 h-5 md:w-6 md:h-6"/>
                    </div>
                  </div>
                </div>
                <div className="text-center w-full">
                  <p className="font-bold text-white text-[13px] md:text-[15px] truncate group-hover:text-white transition-colors duration-300">{artist.name}</p>
                  <p className="text-[9px] md:text-[10px] text-zinc-500 mt-1 md:mt-1.5 tracking-[0.2em] uppercase font-bold">Artist</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Popular Radio — Colorful Cards */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1.5 h-6 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.6)]"/>
            <h2 className="text-2xl font-black text-white tracking-tight">Popular Radio</h2>
          </div>
          <div className="flex gap-4 md:gap-6 overflow-x-auto custom-scrollbar pb-6 pt-2 px-2 -mx-2">
            {RADIO_STATIONS.map((station) => (
              <div key={station.name} className="perspective-1000 shrink-0 cursor-pointer w-[220px] h-32 md:w-[300px] md:h-44">
                <button
                  onClick={() => handleItemClick(station.name, station.query, 'radio')}
                  className="w-full h-full rounded-[20px] md:rounded-[24px] p-4 md:p-6 flex flex-col justify-between text-left transition-all duration-500 shadow-[0_12px_32px_rgba(0,0,0,0.4)] group relative overflow-hidden transform-style-3d hover:[transform:rotateX(5deg)_rotateY(-5deg)_scale(1.02)] border border-white/[0.04] hover:border-white/[0.15]"
                >
                  <div className="absolute inset-0 z-0 bg-[#030304]">
                    <ArtImage 
                      artist={station.query}
                      type="genre"
                      className="w-full h-full object-cover opacity-60 transition-transform duration-1000 group-hover:scale-110 group-hover:opacity-80"
                    />
                  </div>
                  <div className={`absolute inset-0 z-10 bg-gradient-to-br ${station.gradient} opacity-60 mix-blend-overlay group-hover:opacity-80 transition-opacity duration-500`} />
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#030304]/90 via-[#030304]/40 to-transparent"/>
                  
                  <div className="absolute top-3 right-3 md:top-5 md:right-5 bg-black/40 backdrop-blur-md border border-white/[0.08] rounded-full px-2 md:px-3 py-1 md:py-1.5 [transform:translateZ(20px)] shadow-lg flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/>
                    <span className="text-[9px] md:text-[10px] font-black text-white uppercase tracking-widest">Live</span>
                  </div>
                  
                  <div className="relative z-30 mt-auto [transform:translateZ(30px)] pr-10 md:pr-12">
                    <p className="text-[16px] md:text-xl font-black text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] tracking-tight">{station.name}</p>
                    <p className="text-[11px] md:text-[13px] font-medium text-zinc-300 mt-1 line-clamp-1 drop-shadow-md">{station.desc}</p>
                  </div>
                  
                  <div className="absolute bottom-3 right-3 md:bottom-5 md:right-5 z-30 [transform:translateZ(40px)] w-8 h-8 md:w-12 md:h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-white/30 border border-white/20 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
                    <Play size={18} fill="currentColor" className="text-white ml-1 w-3.5 h-3.5 md:w-[18px] md:h-[18px]"/>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Popular Albums — Square Cards */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1.5 h-6 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.6)]"/>
            <h2 className="text-2xl font-black text-white tracking-tight">Trending Albums</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 pb-6">
            {POPULAR_ALBUMS.map((album) => (
              <div key={album.name} className="perspective-1000 cursor-pointer w-full group">
                <button
                  onClick={() => handleItemClick(album.name, `${album.name} full album`, 'album')}
                  className="w-full text-left bg-[#030304]/40 hover:bg-white/[0.02] p-3 md:p-4 rounded-2xl md:rounded-3xl transition-all duration-500 border border-white/[0.04] hover:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_24px_64px_rgba(0,0,0,0.6)] transform-style-3d hover:[transform:translateY(-8px)] relative overflow-hidden"
                >
                  <div className="aspect-square bg-zinc-900 rounded-xl md:rounded-2xl mb-3 md:mb-4 relative shadow-2xl overflow-hidden [transform:translateZ(20px)] transition-transform duration-500 group-hover:scale-105 border border-white/[0.04]">
                    <ArtImage 
                      artist={album.name} 
                      type="album"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                      <div className="w-10 h-10 md:w-14 md:h-14 bg-white rounded-full flex items-center justify-center text-zinc-950 shadow-[0_4px_24px_rgba(255,255,255,0.3)] transform scale-75 group-hover:scale-100 transition-all duration-300 hover:scale-110">
                        <Play size={24} fill="currentColor" className="ml-1 w-4 h-4 md:w-6 md:h-6"/>
                      </div>
                    </div>
                  </div>
                  <div className="[transform:translateZ(10px)] pl-1">
                    <p className="font-bold text-white text-[13px] md:text-[15px] truncate group-hover:text-white transition-colors drop-shadow-md">{album.name}</p>
                    <p className="text-[11px] md:text-[13px] text-zinc-400 truncate mt-0.5 font-medium">{album.artist}</p>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
