import { useState, useEffect } from 'react';
import { Play, Pause, Music, ArrowLeft, BadgeCheck, MoreHorizontal, Shuffle, Search, X, Heart } from 'lucide-react';
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
  { name: 'Taylor Swift', query: 'Taylor Swift', gradient: 'from-purple-500 to-pink-500' },
  { name: 'The Weeknd', query: 'The Weeknd', gradient: 'from-red-600 to-rose-500' },
  { name: 'Drake', query: 'Drake', gradient: 'from-amber-500 to-yellow-400' },
  { name: 'Billie Eilish', query: 'Billie Eilish', gradient: 'from-green-600 to-lime-500' },
  { name: 'Ed Sheeran', query: 'Ed Sheeran', gradient: 'from-sky-500 to-blue-600' },
  { name: 'Dua Lipa', query: 'Dua Lipa', gradient: 'from-fuchsia-500 to-pink-600' },
  { name: 'Bad Bunny', query: 'Bad Bunny', gradient: 'from-yellow-400 to-orange-500' },
  { name: 'BTS', query: 'BTS', gradient: 'from-violet-500 to-purple-600' },
  { name: 'Ariana Grande', query: 'Ariana Grande', gradient: 'from-pink-400 to-rose-500' },
  { name: 'Post Malone', query: 'Post Malone', gradient: 'from-zinc-500 to-zinc-700' },
  { name: 'Arijit Singh', query: 'Arijit Singh', gradient: 'from-orange-400 to-red-500' },
  { name: 'A.R. Rahman', query: 'A.R. Rahman', gradient: 'from-teal-400 to-cyan-600' },
];

const POPULAR_ALBUMS: AlbumCard[] = [
  { name: 'Midnights', artist: 'Taylor Swift', query: 'Taylor Swift Midnights', gradient: 'from-indigo-700 to-blue-800' },
  { name: 'After Hours', artist: 'The Weeknd', query: 'The Weeknd After Hours', gradient: 'from-red-800 to-red-600' },
  { name: 'Future Nostalgia', artist: 'Dua Lipa', query: 'Dua Lipa Future Nostalgia', gradient: 'from-fuchsia-600 to-pink-500' },
  { name: 'Divide', artist: 'Ed Sheeran', query: 'Ed Sheeran Divide', gradient: 'from-sky-600 to-blue-700' },
  { name: 'Un Verano Sin Ti', artist: 'Bad Bunny', query: 'Bad Bunny Un Verano Sin Ti', gradient: 'from-yellow-500 to-orange-600' },
  { name: 'WHEN WE ALL FALL ASLEEP', artist: 'Billie Eilish', query: 'Billie Eilish WHEN WE ALL FALL ASLEEP', gradient: 'from-green-700 to-lime-600' },
  { name: 'Scorpion', artist: 'Drake', query: 'Drake Scorpion', gradient: 'from-amber-600 to-yellow-500' },
  { name: 'Map of the Soul: 7', artist: 'BTS', query: 'BTS Map of the Soul 7', gradient: 'from-purple-600 to-violet-500' },
  { name: 'Positions', artist: 'Ariana Grande', query: 'Ariana Grande Positions', gradient: 'from-pink-500 to-rose-600' },
  { name: 'Hollywood Bleeding', artist: 'Post Malone', query: 'Post Malone Hollywood Bleeding', gradient: 'from-zinc-600 to-zinc-800' },
  { name: 'Aashiqui 2', artist: 'Arijit Singh', query: 'Arijit Singh Aashiqui 2', gradient: 'from-rose-600 to-red-700' },
  { name: 'Rockstar', artist: 'A.R. Rahman', query: 'A.R. Rahman Rockstar', gradient: 'from-orange-500 to-amber-600' },
];

const RADIO_STATIONS = [
  { name: 'Pop Hits Radio', desc: 'Today\'s biggest pop songs', query: 'pop hits 2024', gradient: 'from-pink-500 to-violet-500' },
  { name: 'Chill Beats Radio', desc: 'Relaxing beats and lo-fi', query: 'chill lofi beats', gradient: 'from-teal-500 to-emerald-400' },
  { name: 'Rock Classics Radio', desc: 'Timeless rock anthems', query: 'classic rock greatest hits', gradient: 'from-red-600 to-orange-500' },
  { name: 'Hip-Hop Radio', desc: 'Hottest rap and hip-hop', query: 'hip hop hits', gradient: 'from-purple-600 to-indigo-500' },
  { name: 'Bollywood Radio', desc: 'Latest and classic Hindi songs', query: 'bollywood hits songs', gradient: 'from-orange-400 to-pink-500' },
  { name: 'K-Pop Radio', desc: 'Korean pop hits', query: 'kpop hits', gradient: 'from-pink-400 to-fuchsia-600' },
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
  }, [activeTrack?.id, activeTrack?.artist, activeTrack?.title]);

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
      const [tracksData, metaData] = await Promise.all([
        api.searchOnlineTracks(query),
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
      <div className="animate-fade-in pb-32 md:pb-10 relative">
        {/* Mobile Back Button */}
        <div className="md:hidden sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-white/[0.02] px-4 py-3">
          <button 
            onClick={handleBack} 
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={24} />
            <span className="font-semibold text-sm">Back</span>
          </button>
        </div>

        <button onClick={handleBack} className="hidden md:flex fixed top-20 left-10 z-50 items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-zinc-300 hover:text-white text-sm transition-colors border border-white/10 hover:bg-black/60 shadow-xl">
          <ArrowLeft size={16} /> Back
        </button>

        {isArtist ? (
          <div className="relative overflow-hidden pt-32 pb-10 px-6 md:px-10 min-h-[300px] flex items-end">
            <div className="absolute inset-0 z-0">
              <ArtImage 
                artist={selectedItem.name} 
                type="artist" 
                className="w-full h-full object-cover rounded-xl shadow-xl transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent opacity-60" />
            </div>
            
            <div className="relative z-20 w-full mt-auto max-w-[1400px] mx-auto px-2">
              <div className="flex items-center gap-2 text-white mb-2">
                <BadgeCheck className="w-5 h-5 text-blue-400 fill-blue-400/20" />
                <span className="text-sm font-medium tracking-wide">Verified by Spotify</span>
              </div>
              <h1 className="text-6xl md:text-[6.5rem] font-black text-white tracking-tighter mb-5 drop-shadow-xl leading-none">{selectedItem.name}</h1>
              <p className="text-zinc-200 text-base md:text-lg font-medium">{listeners.toLocaleString()} monthly listeners</p>
            </div>
          </div>
        ) : isSearch ? (
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-[#050505]" />
            <div className="relative px-6 md:px-10 pt-20 pb-8">
              <h1 className="text-3xl md:text-4xl font-black text-white">Search Results for "{selectedItem.name}"</h1>
              <p className="text-sm text-zinc-400 mt-1">{tracks.length} tracks found</p>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-[#050505]" />
            <div className="relative px-6 md:px-10 pt-20 pb-8">
              <h1 className="text-3xl md:text-4xl font-black text-white">{selectedItem.name}</h1>
              <p className="text-sm text-zinc-400 mt-1">{tracks.length} tracks</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-[3px] border-zinc-800 border-t-emerald-500 rounded-full animate-spin mb-4" />
            <p className="text-sm text-zinc-500">Loading tracks…</p>
          </div>
        ) : (
          <div className="px-6 md:px-10 mt-6 max-w-[1400px] mx-auto">
            {tracks.length > 0 && (
              <div className="flex items-center gap-6 mb-8 px-2">
                <button 
                  onClick={() => { setQueue(tracks); playTrack(0); }}
                  className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white hover:scale-105 hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all shadow-xl"
                >
                  <Play size={32} fill="currentColor" className="ml-1" />
                </button>
                {isArtist && (
                  <>
                    <button className="text-zinc-400 hover:text-white transition-colors">
                      <Shuffle size={32} strokeWidth={1.5} />
                    </button>
                    <button className="px-5 py-1.5 border border-zinc-500 rounded-full text-sm font-bold text-white hover:border-white hover:scale-105 transition-all">
                      Follow
                    </button>
                    <button className="text-zinc-400 hover:text-white transition-colors">
                      <MoreHorizontal size={32} />
                    </button>
                  </>
                )}
              </div>
            )}

            {isListLayout && tracks.length > 0 && (
              <h2 className="text-2xl font-bold text-white mb-5 px-2">
                {isSearch ? 'Top Results' : 'Popular'}
              </h2>
            )}

            {isListLayout ? (
              <div className="flex flex-col lg:flex-row gap-10 mb-10 px-2">
                {/* Left Column: Popular Tracks */}
                <div className="flex-1 min-w-0 space-y-2">
                  {tracks.map((track, idx) => {
                    const playing = currentIndex === idx && queue[idx]?.id === track.id && isPlaying;
                    const mockStreams = Math.floor((hashString(track.id) % 900) + 100) * 1000000 + (hashString(track.id + 's') % 999999);
                    const duration = track.duration || ((hashString(track.id) % 180) + 120);
                    
                    return (
                      <div 
                        key={track.id + idx} 
                        className={`group flex items-center gap-4 px-3 py-2 rounded-xl cursor-pointer transition-all duration-300 ${playing ? 'bg-white/[0.08] shadow-sm' : 'hover:bg-white/[0.04]'}`}
                        onClick={() => handlePlay(idx)}
                      >
                        <div className={`w-6 text-right text-base font-bold ${playing ? 'text-blue-400' : 'text-zinc-500 group-hover:hidden'}`}>
                          {idx + 1}
                        </div>
                        <div className={`w-6 text-right hidden ${playing ? 'hidden' : 'group-hover:block'}`}>
                          <Play size={18} fill="currentColor" className="text-white" />
                        </div>
                        
                        <div className="w-12 h-12 bg-zinc-800/50 rounded-md shrink-0 border border-white/5 overflow-hidden">
                          {track.coverArtUrl ? (
                            <img src={track.coverArtUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Music size={18} className="text-zinc-500" /></div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <p className={`text-base font-semibold truncate ${playing ? 'text-blue-400' : 'text-zinc-100 group-hover:text-white'}`}>{track.title}</p>
                          {idx % 2 === 0 && <span className="inline-flex items-center justify-center bg-zinc-400/20 text-zinc-300 text-[9px] rounded-sm w-4 h-4 mt-0.5">E</span>}
                        </div>
                        
                        <div className="hidden md:block w-32 text-right text-sm text-zinc-400 tabular-nums">
                          {mockStreams.toLocaleString()}
                        </div>
                        
                        <div className="w-12 text-right text-sm text-zinc-400 tabular-nums">
                          {formatDuration(duration)}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* About Section */}
                  {artistMeta && artistMeta.strBiographyEN && (
                    <div className="mt-12 pt-8 border-t border-white/10">
                      <h2 className="text-2xl font-bold text-white mb-6">About</h2>
                      <div className="bg-zinc-900/40 rounded-2xl p-6 md:p-8 hover:bg-zinc-900/60 transition-colors">
                        {artistMeta.strArtistThumb && (
                          <div className="w-full h-64 md:h-80 rounded-xl overflow-hidden mb-6 shadow-2xl relative">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                            <img src={artistMeta.strArtistThumb} alt={artistMeta.strArtist} className="w-full h-full object-cover" />
                            <div className="absolute bottom-6 left-6 z-20">
                              <h3 className="text-3xl font-black text-white drop-shadow-lg">{artistMeta.strArtist}</h3>
                              <p className="text-zinc-300 font-medium mt-1">{listeners.toLocaleString()} monthly listeners</p>
                            </div>
                          </div>
                        )}
                        <p className="text-zinc-300 text-sm md:text-base leading-relaxed line-clamp-[8] hover:line-clamp-none transition-all cursor-pointer">
                          {artistMeta.strBiographyEN}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-6">
                          {artistMeta.strGenre && (
                            <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-white tracking-wider uppercase">{artistMeta.strGenre}</span>
                          )}
                          {artistMeta.intFormedYear && artistMeta.intFormedYear !== '0' && (
                            <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-white tracking-wider uppercase">Formed {artistMeta.intFormedYear}</span>
                          )}
                          {artistMeta.strWebsite && (
                            <a href={artistMeta.strWebsite.startsWith('http') ? artistMeta.strWebsite : `https://${artistMeta.strWebsite}`} target="_blank" rel="noreferrer" className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold tracking-wider hover:bg-emerald-500/20 transition-colors uppercase">
                              Website
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Credits & Tour */}
                <div className="w-full lg:w-[340px] shrink-0 flex flex-col gap-6">
                  
                  {/* Dynamic Track Details (Only shown if a track from this list is active) */}
                  {activeTrack && (
                    <div className="bg-zinc-900/60 rounded-xl p-5 border border-zinc-800/50 hover:bg-zinc-800/60 transition-colors animate-fade-in">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-white text-base">Track Details</h3>
                      </div>
                      <div className="flex flex-col gap-4">
                        <div className="w-full aspect-square rounded-lg overflow-hidden bg-zinc-800 shadow-lg">
                          {activeTrack.coverArtUrl ? (
                            <img src={activeTrack.coverArtUrl} alt={activeTrack.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Music size={32} className="text-zinc-600" /></div>
                          )}
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-white truncate">{activeTrack.title}</h4>
                          <p className="text-sm text-zinc-400 mt-1 truncate">{activeTrack.artist}</p>
                          <div className="flex gap-2 mt-3">
                            <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-300 uppercase tracking-wider">
                              {formatDuration(activeTrack.duration || 180)}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                              Playing
                            </span>
                            {trackMeta?.strGenre && (
                              <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                                {trackMeta.strGenre}
                              </span>
                            )}
                          </div>
                          {trackMeta?.strAlbum && (
                            <p className="text-xs text-zinc-500 mt-2">
                              Album: <span className="text-zinc-300">{trackMeta.strAlbum}</span>
                            </p>
                          )}
                          {trackMeta?.strDescriptionEN && (
                            <p className="text-xs text-zinc-400 mt-3 line-clamp-4 hover:line-clamp-none transition-all cursor-pointer">
                              {trackMeta.strDescriptionEN}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Credits Widget */}
                  <div className="bg-zinc-900/60 rounded-xl p-5 border border-zinc-800/50 hover:bg-zinc-800/60 transition-colors">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="font-bold text-white text-base">{activeTrack ? 'Track Credits' : 'Credits'}</h3>
                      <button className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors">Show all</button>
                    </div>
                    
                    <div className="space-y-5">
                      <div className="flex justify-between items-center group cursor-pointer">
                        <div>
                          <p className="text-base font-medium text-white group-hover:underline">
                            {activeTrack ? activeTrack.artist : selectedItem.name}
                          </p>
                          <p className="text-sm text-zinc-400">Main Artist</p>
                        </div>
                        <button className="px-4 py-1.5 border border-zinc-500 rounded-full text-sm font-bold text-white hover:border-white hover:scale-105 transition-all">
                          Follow
                        </button>
                      </div>
                      <div className="flex justify-between items-center group cursor-pointer">
                        <div>
                          <p className="text-base font-medium text-white group-hover:underline">
                            {activeTrack ? "Producer / Co-writer" : "Daft Punk"}
                          </p>
                          <p className="text-sm text-zinc-400">
                            {activeTrack ? "Producer" : "Featured Artist"}
                          </p>
                        </div>
                        <button className="px-4 py-1.5 border border-zinc-500 rounded-full text-sm font-bold text-white hover:border-white hover:scale-105 transition-all">
                          Follow
                        </button>
                      </div>
                      <div className="flex justify-between items-center group cursor-pointer">
                        <div>
                          <p className="text-base font-medium text-white group-hover:underline">Abel Tesfaye</p>
                          <p className="text-sm text-zinc-400">Composer • Lyricist</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* On tour Widget (Only show if no track is active, to keep sidebar clean) */}
                  {!activeTrack && (
                    <div className="bg-zinc-900/60 rounded-xl p-5 border border-zinc-800/50 hover:bg-zinc-800/60 transition-colors animate-fade-in">
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="font-bold text-white text-base">On tour</h3>
                        <button className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors">Show all</button>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex gap-4 items-center group cursor-pointer hover:bg-zinc-800/50 p-2 -mx-2 rounded-lg transition-colors">
                          <div className="bg-zinc-800 rounded-md w-14 h-16 flex flex-col items-center justify-center shrink-0 border border-zinc-700/50 shadow-md group-hover:bg-zinc-700 transition-colors">
                            <span className="text-xs font-bold text-zinc-400 uppercase">Aug</span>
                            <span className="text-xl font-black text-white leading-tight">16</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-base font-medium text-white truncate">London</p>
                            <p className="text-sm text-zinc-400 truncate">{selectedItem.name}, Playboi Carti...</p>
                            <p className="text-sm text-zinc-500 truncate mt-0.5">Sun 4:30 PM</p>
                          </div>
                        </div>
                        
                        <div className="flex gap-4 items-center group cursor-pointer hover:bg-zinc-800/50 p-2 -mx-2 rounded-lg transition-colors">
                          <div className="bg-zinc-800 rounded-md w-14 h-16 flex flex-col items-center justify-center shrink-0 border border-zinc-700/50 shadow-md group-hover:bg-zinc-700 transition-colors">
                            <span className="text-xs font-bold text-zinc-400 uppercase">Aug</span>
                            <span className="text-xl font-black text-white leading-tight">18</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-base font-medium text-white truncate">London</p>
                            <p className="text-sm text-zinc-400 truncate">{selectedItem.name}, Playboi Carti...</p>
                            <p className="text-sm text-zinc-500 truncate mt-0.5">Tue 5:00 PM</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
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
                      <div className={`relative aspect-square rounded-2xl overflow-hidden shadow-lg mb-3 border transition-all duration-500 ${isCurrentlyPlaying ? 'border-blue-500/50 shadow-[0_10px_30px_rgba(59,130,246,0.3)]' : 'border-white/[0.04] group-hover:border-white/[0.1] group-hover:shadow-2xl bg-zinc-800/50'}`}>
                        {track.coverArtUrl ? (
                          <img src={track.coverArtUrl} alt={track.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                            <Music className="text-zinc-700 w-10 h-10" />
                          </div>
                        )}
                        
                        {/* Hover overlay with glassmorphism */}
                        <div className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center transition-all duration-300 ${isCurrentlyPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                          {/* Play button */}
                          <div className={`w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white shadow-[0_4px_24px_rgba(99,102,241,0.5)] transition-all duration-300 ${isCurrentlyPlaying ? 'scale-100' : 'scale-75 group-hover:scale-100 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.6)]'}`}>
                            {isCurrentlyPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                          </div>
                        </div>

                        {/* Rank badge for top 3 */}
                        {idx < 3 && (
                          <div className="absolute top-3 left-3 w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg border border-white/20 z-10">
                            <span className="text-xs font-black text-white">{idx + 1}</span>
                          </div>
                        )}

                        {/* Like button */}
                        <button
                          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 z-10 ${isLiked ? 'bg-blue-500 shadow-md scale-100' : 'bg-black/40 backdrop-blur-md scale-0 group-hover:scale-100 border border-white/10 hover:bg-white/20'}`}
                          onClick={(e) => { e.stopPropagation(); toggleLikedSong(track); }}
                        >
                          <Heart size={14} className={isLiked ? 'text-white fill-white' : 'text-white'} />
                        </button>

                        {/* Playing indicator */}
                        {isCurrentlyPlaying && (
                          <div className="absolute bottom-3 left-3 flex items-end gap-[3px] h-5 z-10">
                            {[0,1,2].map(i => (
                              <div key={i} className="w-[3px] rounded-full bg-blue-400 eq-bar" style={{ height: '100%' }} />
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <h3 className={`font-bold truncate text-base transition-colors ${isCurrentlyPlaying ? 'text-blue-400' : 'text-white group-hover:text-blue-400'}`} title={track.title}>
                        {track.title}
                      </h3>
                      <p className="text-sm text-zinc-400 font-medium truncate mt-0.5 group-hover:text-zinc-300 transition-colors" title={track.artist}>{track.artist}</p>
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
    <div className="animate-fade-in pb-32 md:pb-10">
      <div className="px-6 md:px-10 pt-10 pb-6">
        <h1 className="text-3xl md:text-4xl font-black text-white mb-1">Albums & Artists</h1>
        <p className="text-sm text-zinc-500 mb-8">Explore popular artists, albums, and radio stations</p>
        
        {/* Search Bar */}
        <div className="relative max-w-xl group z-50">
          <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
          <form onSubmit={handleSearchSubmit} className="relative z-20">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-zinc-400 group-focus-within:text-blue-400 transition-colors duration-300" />
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
              className="block w-full pl-12 pr-10 py-4 bg-zinc-900/40 backdrop-blur-md border border-white/[0.05] rounded-full text-white placeholder-zinc-500 focus:outline-none focus:bg-zinc-900/80 focus:border-blue-500/50 focus:scale-[1.02] transition-all duration-300 shadow-xl"
              placeholder="Search for artists, albums, or songs..."
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => { setSearchQuery(''); setSuggestions([]); }} 
                className="absolute inset-y-0 right-0 pr-5 flex items-center text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </form>
          
          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
              <ul className="max-h-[300px] overflow-y-auto custom-scrollbar py-2">
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
                      className="w-full text-left px-5 py-3 hover:bg-zinc-800/80 text-zinc-300 hover:text-white transition-colors flex items-center gap-3"
                    >
                      <Search className="w-4 h-4 text-zinc-500" />
                      <span className="truncate">{suggestion}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 md:px-10 space-y-12 pb-24">
        {/* Popular Artists — Circular */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-blue-500 to-purple-500" />
            <h2 className="text-2xl font-black text-white tracking-tight">Top Artists</h2>
          </div>
          <div className="flex gap-8 overflow-x-auto custom-scrollbar pb-6 pt-4 px-2 -mx-2">
            {POPULAR_ARTISTS.map((artist) => (
              <button
                key={artist.name}
                onClick={() => handleItemClick(artist.name, artist.query, 'artist')}
                className="flex flex-col items-center gap-4 shrink-0 group w-36 outline-none"
              >
                <div className="relative">
                  <div className={`absolute -inset-2 bg-gradient-to-tr ${artist.gradient} rounded-full opacity-0 group-hover:opacity-30 blur-xl transition-all duration-500 group-hover:scale-110`} />
                  <div className="w-36 h-36 rounded-full overflow-hidden shadow-2xl shadow-black/50 border border-white/10 group-hover:border-white/30 transition-all duration-500 relative transform-gpu group-hover:-translate-y-2 group-hover:scale-105 z-10">
                    <ArtImage 
                      artist={artist.name} 
                      type="artist" 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end pb-4 items-center">
                      <Play size={24} fill="white" className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
                <div className="text-center w-full">
                  <p className="font-bold text-white text-[15px] truncate group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/50 transition-all duration-300">{artist.name}</p>
                  <p className="text-[11px] text-zinc-500 mt-1 tracking-[0.2em] uppercase font-bold">Artist</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Popular Radio — Colorful Cards */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-rose-500 to-orange-500" />
            <h2 className="text-2xl font-black text-white tracking-tight">Popular Radio</h2>
          </div>
          <div className="flex gap-5 overflow-x-auto custom-scrollbar pb-6 pt-2 px-2 -mx-2">
            {RADIO_STATIONS.map((station) => (
              <div key={station.name} className="perspective-1000 shrink-0 cursor-pointer w-[280px] h-40">
                <button
                  onClick={() => handleItemClick(station.name, station.query, 'radio')}
                  className="w-full h-full rounded-2xl p-5 flex flex-col justify-between text-left transition-all duration-500 shadow-[0_10px_20px_rgba(0,0,0,0.4)] group relative overflow-hidden transform-style-3d hover:[transform:rotateX(5deg)_rotateY(-5deg)_scale(1.02)] border border-white/5 hover:border-white/20"
                >
                  <div className="absolute inset-0 z-0">
                    <ArtImage 
                      artist={station.query}
                      type="genre"
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 group-hover:brightness-110"
                    />
                  </div>
                  <div className={`absolute inset-0 z-10 bg-gradient-to-br ${station.gradient} opacity-80 mix-blend-multiply group-hover:opacity-60 transition-opacity duration-500`} />
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-0 z-20 pointer-events-none glare-effect opacity-0 group-hover:opacity-100" />
                  
                  <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md border border-white/10 rounded-full px-3 py-1 [transform:translateZ(20px)] shadow-lg flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[9px] font-bold text-white uppercase tracking-widest">Live Radio</span>
                  </div>
                  
                  <div className="relative z-30 mt-auto [transform:translateZ(30px)] pr-8">
                    <p className="text-xl font-black text-white leading-tight drop-shadow-xl">{station.name}</p>
                    <p className="text-xs text-white/70 mt-2 line-clamp-1 drop-shadow-md font-medium">{station.desc}</p>
                  </div>
                  
                  <div className="absolute bottom-4 right-4 z-30 [transform:translateZ(40px)] w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-white/30 border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                    <Play size={16} fill="white" className="text-white ml-1" />
                  </div>
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Popular Albums — Square Cards */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-teal-400 to-emerald-500" />
            <h2 className="text-2xl font-black text-white tracking-tight">Trending Albums</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 pb-6">
            {POPULAR_ALBUMS.map((album) => (
              <div key={album.name} className="perspective-1000 cursor-pointer w-full group">
                <button
                  onClick={() => handleItemClick(album.name, `${album.name} full album`, 'album')}
                  className="w-full text-left bg-zinc-900/40 hover:bg-zinc-800/80 p-4 rounded-3xl transition-all duration-500 border border-white/5 hover:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] transform-style-3d hover:[transform:translateY(-8px)] relative overflow-hidden"
                >
                  <div className="absolute inset-0 z-20 pointer-events-none glare-effect opacity-0 group-hover:opacity-100" />
                  <div className="aspect-square bg-zinc-800 rounded-2xl mb-4 relative shadow-2xl overflow-hidden [transform:translateZ(20px)] transition-transform duration-500 group-hover:scale-105">
                    <ArtImage 
                      artist={album.name} 
                      type="album" 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:brightness-110"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                      <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(16,185,129,0.5)] transform scale-75 group-hover:scale-100 transition-all duration-300 hover:from-emerald-400 hover:to-teal-500 border border-white/20">
                        <Play size={24} fill="currentColor" className="ml-1" />
                      </div>
                    </div>
                  </div>
                  <div className="[transform:translateZ(10px)] pl-1">
                    <p className="font-bold text-white text-[15px] truncate group-hover:text-emerald-400 transition-colors drop-shadow-md">{album.name}</p>
                    <p className="text-xs text-zinc-400 truncate mt-1.5 font-medium">{album.artist}</p>
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
