import { useState, useEffect, useRef } from 'react';
import { Search, Play, Pause, Loader2, Music, History, X, Sparkles, Zap, Headphones, Radio, Heart, LayoutGrid, List } from 'lucide-react';
import { api } from '../services/api';
import { useAudioStore } from '../store/useAudioStore';
import type { Track } from '../types';
import { ArtImage } from '../components/ui/ArtImage';
import { TrackContextMenu } from '../components/ui/TrackContextMenu';

const QUICK_SEARCHES = [
  { label: 'Trending', query: 'trending hits 2024', color: 'from-orange-500 to-amber-500' },
  { label: 'Pop', query: 'top pop songs', color: 'from-pink-500 to-rose-500' },
  { label: 'Rock', query: 'best rock songs', color: 'from-red-500 to-orange-500' },
  { label: 'R&B', query: 'r&b hits', color: 'from-purple-500 to-violet-500' },
  { label: 'Electronic', query: 'electronic dance music', color: 'from-cyan-500 to-blue-500' },
  { label: 'Chill', query: 'chill lofi vibes', color: 'from-emerald-500 to-teal-500' },
  { label: 'Classical', query: 'classical music', color: 'from-amber-500 to-yellow-500' },
  { label: 'K-Pop', query: 'kpop hits', color: 'from-fuchsia-500 to-pink-500' },
];

const BROWSE_GENRES = [
  { name: 'Pop Hits', gradient: 'from-pink-600 via-rose-500 to-fuchsia-600', artist: 'Dua Lipa', album: 'Future Nostalgia', description: 'Chart-topping bangers' },
  { name: 'Chill Vibes', gradient: 'from-teal-600 via-emerald-500 to-cyan-600', artist: 'The xx', album: 'I See You', description: 'Relax & unwind' },
  { name: 'Rock Classics', gradient: 'from-orange-600 via-red-500 to-rose-600', artist: 'Nirvana', album: 'Nevermind', description: 'Timeless anthems' },
  { name: 'Hip-Hop', gradient: 'from-purple-600 via-indigo-500 to-violet-600', artist: 'Kanye West', album: 'Graduation', description: 'Beats & bars' },
  { name: 'Electronic', gradient: 'from-cyan-600 via-blue-500 to-indigo-600', artist: 'Disclosure', album: 'Settle', description: 'Drop the bass' },
  { name: 'Indie', gradient: 'from-lime-600 via-green-500 to-emerald-600', artist: 'Tame Impala', album: 'Currents', description: 'Alternative sounds' },
  { name: 'K-Pop', gradient: 'from-fuchsia-600 via-pink-500 to-rose-600', artist: 'BLACKPINK', album: 'THE ALBUM', description: 'Global phenomenon' },
  { name: 'R&B Soul', gradient: 'from-amber-600 via-orange-500 to-yellow-600', artist: 'Frank Ocean', album: 'Blonde', description: 'Smooth & soulful' },
];

export function Library() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Track[]>([]);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<'grid' | 'list'>('grid');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { setQueue, playTrack, queue, isPlaying, currentIndex, play, pause, likedSongs, toggleLikedSong } = useAudioStore();

  useEffect(() => {
    const saved = localStorage.getItem('searchHistory');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse search history", e);
      }
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions when query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!query.trim()) {
        setSuggestions([]);
        return;
      }
      try {
        const sugs = await api.getSuggestions(query);
        setSuggestions(sugs);
      } catch (e) {
        console.error('Failed to fetch suggestions', e);
      }
    };
    
    const timeout = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const saveToHistory = (term: string) => {
    if (!term.trim()) return;
    const newHistory = [term, ...history.filter(t => t !== term)].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  const removeHistoryItem = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHistory = history.filter(t => t !== term);
    setHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  const executeSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    setQuery(searchTerm);
    setIsSearching(true);
    setError('');
    setShowHistory(false);
    saveToHistory(searchTerm);
    
    try {
      const data = await api.searchOnlineTracks(searchTerm);
      setResults(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch search results. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query);
  };

  const handlePlay = (index: number) => {
    const isSameQueue = queue.length === results.length && queue[0]?.id === results[0]?.id;
    if (!isSameQueue) {
      setQueue(results);
    }
    
    if (currentIndex === index && isPlaying) {
      pause();
    } else if (currentIndex === index && !isPlaying) {
      play();
    } else {
      playTrack(index);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatDuration = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="animate-fade-in pb-32 md:pb-10 relative overflow-hidden">
      {/* === Ambient Background Orbs === */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-40 right-0 w-[400px] h-[400px] bg-purple-600/6 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-20 left-0 w-[300px] h-[300px] bg-indigo-600/5 rounded-full blur-[80px] pointer-events-none" />

      {/* ═══════════════════════════════════════════
          HERO HEADER with Animated Gradient Mesh
      ═══════════════════════════════════════════ */}
      <div className="relative overflow-hidden">
        {/* Animated gradient mesh background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-purple-900/20 to-indigo-900/25" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-500/15 to-transparent rounded-full blur-3xl library-orb-float" />
          <div className="absolute bottom-0 left-10 w-64 h-64 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-2xl library-orb-float-delayed" />
          {/* Noise texture overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.5\'/%3E%3C/svg%3E")' }} />
          {/* Bottom fade */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#050505]" />
        </div>

        <div className="relative px-6 md:px-10 pt-12 pb-10">
          {/* Greeting pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] mb-4 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse" />
            <span className="text-xs font-semibold text-zinc-400 tracking-wide">{getGreeting()}</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-zinc-400 mb-2 leading-tight">
            Discover Music
          </h1>
          
          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-blue-400" />
              <Zap size={13} className="text-purple-400" />
            </div>
            <span className="text-xs text-zinc-500 font-medium">Powered by Chosic × YouTube Music • Search millions of songs</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          PREMIUM SEARCH BAR with Glow Effect
      ═══════════════════════════════════════════ */}
      <div className="px-6 md:px-10 mb-8 -mt-2">
        <div ref={searchContainerRef} className="relative w-full max-w-2xl">
          <form onSubmit={handleSearch}>
            <div className={`relative flex items-center transition-all duration-500 ${searchFocused ? 'scale-[1.02]' : ''}`}>
              <div className={`relative w-full flex items-center rounded-2xl bg-zinc-900/60 backdrop-blur-xl border transition-all duration-300 ${searchFocused ? 'border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.2)]' : 'border-white/[0.08]'}`}>
                <div className={`absolute left-4 transition-all duration-300 ${searchFocused ? 'text-purple-400 scale-110' : 'text-zinc-500'}`}>
                  <Search size={18} />
                </div>
                <input 
                  ref={inputRef}
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => { setShowHistory(true); setSearchFocused(true); }}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="What do you want to listen to?"
                  className="w-full bg-transparent py-4 pl-12 pr-32 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none transition-all duration-300 relative z-10 rounded-2xl"
                />
                <button 
                  type="submit" 
                  disabled={isSearching || !query.trim()}
                  className="absolute right-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold text-sm rounded-xl hover:from-blue-400 hover:to-purple-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] active:scale-95 z-10"
                >
                  {isSearching ? <Loader2 size={18} className="animate-spin" /> : 'Search'}
                </button>
              </div>
            </div>
          </form>

          {/* Suggestions / History Dropdown */}
          {showHistory && (query.trim() ? suggestions.length > 0 : history.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-3 bg-zinc-900/95 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-[0_16px_64px_rgba(0,0,0,0.6)] z-50 overflow-hidden">
              {/* Gradient accent line */}
              <div className="h-[1px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
              <div className="p-2">
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] px-3 py-2 flex items-center gap-2">
                  {query.trim() ? (
                    <><Sparkles size={10} className="text-blue-400" /> Suggestions</>
                  ) : (
                    <><History size={10} className="text-zinc-500" /> Recent Searches</>
                  )}
                </h3>
                <ul className="max-h-64 overflow-y-auto no-scrollbar">
                  {query.trim() ? (
                    suggestions.map((sug, idx) => (
                      <li 
                        key={idx}
                        className="flex items-center justify-between px-3 py-3 hover:bg-white/[0.06] rounded-xl cursor-pointer group transition-all duration-200"
                        onClick={() => executeSearch(sug)}
                        style={{ animationDelay: `${idx * 30}ms` }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center border border-white/5">
                            <Search size={13} className="text-zinc-400 group-hover:text-blue-400 transition-colors" />
                          </div>
                          <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">{sug}</span>
                        </div>
                        <span className="text-[10px] text-zinc-700 group-hover:text-zinc-500 transition-colors">↵</span>
                      </li>
                    ))
                  ) : (
                    history.map((term, idx) => (
                      <li 
                        key={idx}
                        className="flex items-center justify-between px-3 py-3 hover:bg-white/[0.06] rounded-xl cursor-pointer group transition-all duration-200"
                        onClick={() => executeSearch(term)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center border border-white/5">
                            <History size={13} className="text-zinc-500" />
                          </div>
                          <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">{term}</span>
                        </div>
                        <button 
                          type="button"
                          onClick={(e) => removeHistoryItem(term, e)}
                          className="text-zinc-700 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-lg hover:bg-white/[0.08]"
                        >
                          <X size={13} />
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          QUICK SEARCH PILLS with Gradient Hover
      ═══════════════════════════════════════════ */}
      {results.length === 0 && !isSearching && (
        <div className="px-6 md:px-10 mb-10">
          <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Radio size={11} className="text-blue-400" />
            Quick Search
          </h3>
          <div className="flex flex-wrap gap-2.5">
            {QUICK_SEARCHES.map((item, idx) => (
              <button
                key={item.label}
                onClick={() => executeSearch(item.query)}
                className="group relative px-5 py-2.5 rounded-full text-sm font-medium text-zinc-400 hover:text-white transition-all duration-300 overflow-hidden border border-white/[0.06] hover:border-white/[0.12]"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Gradient background on hover */}
                <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-15 transition-opacity duration-300`} />
                <span className="relative z-10 flex items-center gap-2">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mx-6 md:mx-10 mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
            <X size={16} className="text-red-400" />
          </div>
          {error}
        </div>
      )}

      {/* ═══════════════════════════════════════════
          LOADING STATE — Morphing Skeleton
      ═══════════════════════════════════════════ */}
      {isSearching && (
        <div className="px-6 md:px-10">
          <div className="flex flex-col items-center justify-center py-16">
            {/* Animated equalizer loader */}
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-end justify-center gap-1 p-4">
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} className="w-2 rounded-full bg-gradient-to-t from-blue-500 to-purple-400 eq-bar" style={{ height: '100%' }} />
                ))}
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-60 animate-pulse" />
            </div>
            <p className="text-sm text-zinc-400 font-medium">Searching across millions of songs…</p>
            <p className="text-xs text-zinc-600 mt-1">Finding the best matches for you</p>
          </div>
          
          {/* Skeleton grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 mt-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="aspect-square rounded-xl bg-white/[0.04] mb-3" />
                <div className="h-3 w-3/4 rounded-full bg-white/[0.04] mb-2" />
                <div className="h-2.5 w-1/2 rounded-full bg-white/[0.03]" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          SEARCH RESULTS — Grid + List Views
      ═══════════════════════════════════════════ */}
      {results.length > 0 && !isSearching && (
        <div className="px-4 md:px-10">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                Top Results
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold tracking-wider">
                  {results.length}
                </span>
              </h2>
              <p className="text-xs text-zinc-500 mt-1">Showing results for "<span className="text-zinc-300">{query}</span>"</p>
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center gap-1 p-1 bg-white/[0.04] border border-white/[0.06] rounded-xl">
              <button 
                onClick={() => setActiveView('grid')}
                className={`p-2.5 rounded-lg transition-all duration-300 ${activeView === 'grid' ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 shadow-[inset_0_0_12px_rgba(99,102,241,0.1)]' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <LayoutGrid size={15} />
              </button>
              <button 
                onClick={() => setActiveView('list')}
                className={`p-2.5 rounded-lg transition-all duration-300 ${activeView === 'list' ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 shadow-[inset_0_0_12px_rgba(99,102,241,0.1)]' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <List size={15} />
              </button>
            </div>
          </div>
          
          {/* ── Grid View ── */}
          {activeView === 'grid' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {results.map((track, idx) => {
                const isCurrentlyPlaying = currentIndex === idx && queue[idx]?.id === track.id && isPlaying;
                const isLiked = (likedSongs || []).some(t => t.id === track.id);
                
                return (
                  <div 
                    key={track.id + idx} 
                    className="group cursor-pointer library-card-appear transform-style-3d hover:[transform:rotateX(5deg)_rotateY(-5deg)_scale(1.02)] transition-all duration-500"
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
                      
                      {/* Context menu */}
                      <div className={`absolute bottom-2 right-2 z-10 bg-black/40 backdrop-blur-md rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-300`} onClick={e => e.stopPropagation()}>
                        <TrackContextMenu track={track} />
                      </div>
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

          {/* ── List View ── */}
          {activeView === 'list' && (
            <div className="space-y-2 pb-10">
              {results.map((track, idx) => {
                const isCurrentlyPlaying = currentIndex === idx && queue[idx]?.id === track.id && isPlaying;
                const isLiked = (likedSongs || []).some(t => t.id === track.id);
                
                return (
                  <div 
                    key={track.id + idx}
                    onClick={() => handlePlay(idx)}
                    className={`group flex items-center gap-3 md:gap-4 px-3 md:px-4 py-2 md:py-3 rounded-2xl cursor-pointer transition-all duration-300 hover:-translate-y-0.5 library-card-appear ${
                      isCurrentlyPlaying 
                        ? 'bg-blue-500/[0.08] border border-blue-500/20 shadow-[0_4px_20px_rgba(59,130,246,0.1)]' 
                        : 'hover:bg-white/[0.04] border border-transparent hover:shadow-lg'
                    }`}
                    style={{ animationDelay: `${idx * 20}ms` }}
                  >
                    <div className="hidden sm:block w-8 text-center shrink-0">
                      {isCurrentlyPlaying ? (
                        <div className="flex items-end justify-center gap-[2px] h-4 mx-auto">
                          {[0,1,2].map(i => (
                            <div key={i} className="w-[2px] rounded-full bg-blue-400 eq-bar" style={{ height: '100%' }} />
                          ))}
                        </div>
                      ) : (
                        <span className={`text-base font-medium tabular-nums ${idx < 3 ? 'text-blue-400' : 'text-zinc-500 group-hover:text-white'} transition-colors`}>{idx + 1}</span>
                      )}
                    </div>
                    
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden bg-zinc-800 shrink-0 shadow-md relative border border-white/[0.04]">
                      {track.coverArtUrl ? (
                        <img src={track.coverArtUrl} alt={track.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Music size={20} className="text-zinc-700" /></div>
                      )}
                      <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-300 backdrop-blur-[2px] ${isCurrentlyPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        {isCurrentlyPlaying ? <Pause size={20} fill="white" className="drop-shadow-md" /> : <Play size={20} fill="white" className="ml-1 drop-shadow-md" />}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0 pr-4">
                      <p className={`font-bold text-base line-clamp-1 transition-colors ${isCurrentlyPlaying ? 'text-blue-400' : 'text-white group-hover:text-blue-400'}`} title={track.title}>
                        {track.title}
                      </p>
                      <p className="text-sm font-medium text-zinc-400 line-clamp-1 mt-0.5 md:hidden group-hover:text-zinc-300 transition-colors" title={track.artist}>
                        {track.artist}
                      </p>
                    </div>
                    
                    <span className="hidden md:block w-40 text-sm font-medium text-zinc-400 truncate group-hover:text-zinc-300 transition-colors">
                      {track.artist}
                    </span>

                    <span className="hidden sm:block w-16 text-right text-sm font-medium text-zinc-500 tabular-nums group-hover:text-zinc-300 transition-colors">
                      {formatDuration(track.duration || 0)}
                    </span>

                    <div className="flex items-center gap-1 ml-2">
                      <button
                        className="w-10 h-10 rounded-full flex items-center justify-center text-blue-400 hover:text-white hover:bg-white/10 transition-colors"
                        onClick={(e) => { e.stopPropagation(); toggleLikedSong(track); }}
                      >
                        <Heart size={20} className={isLiked ? 'fill-blue-500 text-blue-500' : 'fill-transparent text-zinc-500 hover:text-blue-400'} />
                      </button>
                      
                      <div onClick={e => e.stopPropagation()}>
                        <TrackContextMenu track={track} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════
          BROWSE GENRES — 3D Hover Cards
      ═══════════════════════════════════════════ */}
      {results.length === 0 && !isSearching && (
        <div className="px-6 md:px-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/[0.06]">
              <Headphones size={14} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Browse</h2>
              <p className="text-[10px] text-zinc-600 font-medium tracking-wider uppercase">Explore by genre</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {BROWSE_GENRES.map((genre, idx) => (
              <div
                key={genre.name}
                onClick={() => executeSearch(genre.name)}
                className="relative overflow-hidden rounded-2xl h-36 cursor-pointer group perspective-1000 library-card-appear"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105 transform-style-3d group-hover:rotate-y-2 group-hover:rotate-x-2">
                  {/* Background art */}
                  <div className="absolute inset-0 z-0">
                    <ArtImage 
                      artist={genre.artist}
                      album={genre.album}
                      type="genre"
                      fallbackGradient={genre.gradient}
                      className="w-full h-full object-cover"
                    />
                    {/* Multi-layer gradient overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${genre.gradient} opacity-40 mix-blend-multiply`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-br from-black/30 to-transparent" />
                  </div>
                  
                  {/* Glare effect on hover */}
                  <div className="absolute inset-0 glare-effect opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
                  
                  {/* Content */}
                  <div className="absolute inset-0 p-5 flex flex-col justify-between z-20">
                    <div>
                      <h3 className="text-base font-bold text-white drop-shadow-lg mb-0.5">{genre.name}</h3>
                      <p className="text-[10px] text-white/60 font-medium">{genre.description}</p>
                    </div>
                    <div className="flex items-end justify-between">
                      {/* Play icon on hover */}
                      <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 border border-white/20">
                        <Play size={14} fill="white" className="text-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
