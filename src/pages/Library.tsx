import { useState, useEffect, useRef } from 'react';
import { Search, Play, Pause, Loader2, Music, History, X, Sparkles, Headphones, Radio, Heart, LayoutGrid, List } from 'lucide-react';
import { api } from '../services/api';
import { useAudioStore } from '../store/useAudioStore';
import type { Track } from '../types';
import { ArtImage } from '../components/ui/ArtImage';
import { TrackContextMenu } from '../components/ui/TrackContextMenu';

const QUICK_SEARCHES = [
  { label: 'Trending', query: 'trending hits 2024', color: 'from-white/10 to-transparent' },
  { label: 'Pop', query: 'top pop songs', color: 'from-white/10 to-transparent' },
  { label: 'Rock', query: 'best rock songs', color: 'from-white/10 to-transparent' },
  { label: 'R&B', query: 'r&b hits', color: 'from-white/10 to-transparent' },
  { label: 'Electronic', query: 'electronic dance music', color: 'from-white/10 to-transparent' },
  { label: 'Chill', query: 'chill lofi vibes', color: 'from-white/10 to-transparent' },
  { label: 'Classical', query: 'classical music', color: 'from-white/10 to-transparent' },
  { label: 'K-Pop', query: 'kpop hits', color: 'from-white/10 to-transparent' },
];

const BROWSE_GENRES = [
  { name: 'Pop Hits', gradient: 'from-white/10 via-transparent to-transparent', artist: 'Dua Lipa', album: 'Future Nostalgia', description: 'Chart-topping bangers' },
  { name: 'Chill Vibes', gradient: 'from-white/10 via-transparent to-transparent', artist: 'The xx', album: 'I See You', description: 'Relax & unwind' },
  { name: 'Rock Classics', gradient: 'from-white/10 via-transparent to-transparent', artist: 'Nirvana', album: 'Nevermind', description: 'Timeless anthems' },
  { name: 'Hip-Hop', gradient: 'from-white/10 via-transparent to-transparent', artist: 'Kanye West', album: 'Graduation', description: 'Beats & bars' },
  { name: 'Electronic', gradient: 'from-white/10 via-transparent to-transparent', artist: 'Disclosure', album: 'Settle', description: 'Drop the bass' },
  { name: 'Indie', gradient: 'from-white/10 via-transparent to-transparent', artist: 'Tame Impala', album: 'Currents', description: 'Alternative sounds' },
  { name: 'K-Pop', gradient: 'from-white/10 via-transparent to-transparent', artist: 'BLACKPINK', album: 'THE ALBUM', description: 'Global phenomenon' },
  { name: 'R&B Soul', gradient: 'from-white/10 via-transparent to-transparent', artist: 'Frank Ocean', album: 'Blonde', description: 'Smooth & soulful' },
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
    <div className="animate-fade-in pb-32 md:pb-12 relative overflow-hidden">
      {/* === Ambient Background Orbs === */}
      <div className="absolute top-[-10%] left-[10%] w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-20 right-[-10%] w-[500px] h-[500px] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />

      {/* ═══════════════════════════════════════════
          HERO HEADER
      ═══════════════════════════════════════════ */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-white/[0.03] to-transparent rounded-full blur-3xl library-orb-float" />
          <div className="absolute bottom-0 left-10 w-64 h-64 bg-gradient-to-tr from-white/[0.02] to-transparent rounded-full blur-2xl library-orb-float-delayed" />
        </div>

        <div className="relative px-6 md:px-10 pt-12 pb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] mb-4 backdrop-blur-md">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">{getGreeting()}</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">
            Discover Music
          </h1>
          
          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center gap-1">
              <Sparkles size={14} className="text-white" />
            </div>
            <span className="text-[13px] text-zinc-500 font-medium">Powered by Chosic × YouTube Music</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          PREMIUM SEARCH BAR
      ═══════════════════════════════════════════ */}
      <div className="px-6 md:px-10 mb-10 -mt-2">
        <div ref={searchContainerRef} className="relative w-full max-w-2xl">
          <form onSubmit={handleSearch}>
            <div className={`relative flex items-center transition-all duration-300 ${searchFocused ? 'scale-[1.01]' : ''}`}>
              <div className={`relative w-full flex items-center rounded-2xl bg-[var(--color-surface-50)]/90 backdrop-blur-xl border transition-all duration-300 ${searchFocused ? 'border-white/30 shadow-[0_8px_32px_rgba(255,255,255,0.1)]' : 'border-white/[0.06]'}`}>
                <div className={`absolute left-5 transition-all duration-300 ${searchFocused ? 'text-white scale-110' : 'text-zinc-500'}`}>
                  <Search size={20} />
                </div>
                <input 
                  ref={inputRef}
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => { setShowHistory(true); setSearchFocused(true); }}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="What do you want to listen to?"
                  className="w-full bg-transparent py-4 pl-14 pr-36 text-[15px] font-medium text-zinc-100 placeholder:text-zinc-500 focus:outline-none transition-all duration-300 relative z-10 rounded-2xl"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      inputRef.current?.focus();
                    }}
                    className="absolute right-[110px] p-2 text-zinc-500 hover:text-white transition-colors z-20 hover:bg-white/10 rounded-full active:scale-90"
                  >
                    <X size={16} />
                  </button>
                )}
                <button 
                  type="submit" 
                  disabled={isSearching || !query.trim()}
                  className="absolute right-2 px-6 py-2.5 bg-white text-black font-bold text-[13px] rounded-xl hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-[0_4px_16px_rgba(255,255,255,0.2)] active:scale-95 z-10"
                >
                  {isSearching ? <Loader2 size={18} className="animate-spin" /> : 'Search'}
                </button>
              </div>
            </div>
          </form>

          {/* Suggestions / History Dropdown */}
          {showHistory && (query.trim() ? suggestions.length > 0 : history.length > 0) && (
            <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[var(--color-surface-50)]/95 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-[0_24px_48px_rgba(0,0,0,0.6)] z-50 overflow-hidden">
              <div className="h-[2px] bg-white/20" />
              <div className="p-2">
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] px-4 py-3 flex items-center gap-2">
                  {query.trim() ? (
                    <><Sparkles size={12} className="text-white" /> Suggestions</>
                  ) : (
                    <><History size={12} className="text-zinc-500" /> Recent Searches</>
                  )}
                </h3>
                <ul className="max-h-[300px] overflow-y-auto custom-scrollbar pb-2 px-2">
                  {query.trim() ? (
                    suggestions.map((sug, idx) => (
                      <li 
                        key={idx}
                        className="flex items-center justify-between px-3 py-2.5 hover:bg-white/[0.04] rounded-xl cursor-pointer group transition-all duration-200"
                        onClick={() => executeSearch(sug)}
                        style={{ animationDelay: `${idx * 20}ms` }}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-colors">
                            <Search size={14} className="text-white" />
                          </div>
                          <span className="text-[14px] font-medium text-zinc-300 group-hover:text-white transition-colors">{sug}</span>
                        </div>
                        <span className="text-[12px] font-mono text-zinc-600 group-hover:text-white transition-colors">↵</span>
                      </li>
                    ))
                  ) : (
                    history.map((term, idx) => (
                      <li 
                        key={idx}
                        className="flex items-center justify-between px-3 py-2.5 hover:bg-white/[0.04] rounded-xl cursor-pointer group transition-all duration-200"
                        onClick={() => executeSearch(term)}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center border border-white/[0.06] group-hover:bg-white/[0.08] transition-colors">
                            <History size={14} className="text-zinc-400 group-hover:text-zinc-300" />
                          </div>
                          <span className="text-[14px] font-medium text-zinc-300 group-hover:text-white transition-colors">{term}</span>
                        </div>
                        <button 
                          type="button"
                          onClick={(e) => removeHistoryItem(term, e)}
                          className="text-zinc-600 hover:text-white opacity-0 group-hover:opacity-100 transition-all p-2 rounded-lg hover:bg-white/[0.08]"
                        >
                          <X size={14} />
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
          QUICK SEARCH PILLS
      ═══════════════════════════════════════════ */}
      {results.length === 0 && !isSearching && (
        <div className="px-6 md:px-10 mb-12">
          <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Radio size={12} className="text-white" />
            Quick Search
          </h3>
          <div className="flex flex-wrap gap-3">
            {QUICK_SEARCHES.map((item, idx) => (
              <button
                key={item.label}
                onClick={() => executeSearch(item.query)}
                className="group relative px-5 py-2.5 rounded-xl text-[13px] font-semibold text-zinc-400 hover:text-white transition-all duration-300 overflow-hidden bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.1] active:scale-95"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
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
        <div className="mx-6 md:mx-10 mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[13px] font-medium flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
            <X size={16} className="text-red-400" />
          </div>
          {error}
        </div>
      )}

      {/* ═══════════════════════════════════════════
          LOADING STATE
      ═══════════════════════════════════════════ */}
      {isSearching && (
        <div className="px-6 md:px-10">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-end justify-center gap-[3px] p-5">
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} className="w-[3px] rounded-full bg-white eq-bar" style={{ height: '100%' }} />
                ))}
              </div>
              <div className="absolute inset-0 bg-white/10 rounded-2xl blur-2xl opacity-60 animate-pulse" />
            </div>
            <p className="text-[15px] font-semibold text-white tracking-tight">Searching across millions of songs…</p>
            <p className="text-[13px] font-medium text-zinc-500 mt-1">Finding the best matches for you</p>
          </div>
          
          {/* Skeleton grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 mt-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="aspect-square rounded-2xl bg-white/[0.03] mb-3 border border-white/[0.02]" />
                <div className="h-3 w-3/4 rounded-full bg-white/[0.04] mb-2.5" />
                <div className="h-2.5 w-1/2 rounded-full bg-white/[0.03]" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          SEARCH RESULTS
      ═══════════════════════════════════════════ */}
      {results.length > 0 && !isSearching && (
        <div className="px-6 md:px-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
                Top Results
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/10 border border-white/20 text-white text-[10px] font-bold font-mono-nums">
                  {results.length}
                </span>
              </h2>
              <p className="text-[13px] font-medium text-zinc-500 mt-1">Showing results for "<span className="text-zinc-300">{query}</span>"</p>
            </div>
            
            <div className="flex items-center gap-1 p-1 bg-white/[0.03] border border-white/[0.05] rounded-xl">
              <button 
                onClick={() => setActiveView('grid')}
                className={`p-2.5 rounded-lg transition-all duration-300 ${activeView === 'grid' ? 'bg-white/15 text-white shadow-[inset_0_0_12px_rgba(255,255,255,0.1)]' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]'}`}
              >
                <LayoutGrid size={16} />
              </button>
              <button 
                onClick={() => setActiveView('list')}
                className={`p-2.5 rounded-lg transition-all duration-300 ${activeView === 'list' ? 'bg-white/15 text-white shadow-[inset_0_0_12px_rgba(255,255,255,0.1)]' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]'}`}
              >
                <List size={16} />
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
                    className="group cursor-pointer library-card-appear"
                    style={{ animationDelay: `${idx * 20}ms` }}
                    onClick={() => handlePlay(idx)}
                  >
                    <div className={`relative aspect-square rounded-2xl overflow-hidden shadow-lg mb-3 border transition-all duration-500 ${isCurrentlyPlaying ? 'border-white/50 shadow-[0_12px_32px_rgba(255,255,255,0.2)]' : 'border-white/[0.04] group-hover:border-white/[0.1] group-hover:shadow-[0_16px_40px_rgba(0,0,0,0.5)] bg-zinc-900'}`}>
                      {track.coverArtUrl ? (
                        <img src={track.coverArtUrl} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                          <Music className="text-zinc-700 w-10 h-10" />
                        </div>
                      )}
                      
                      <div className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center transition-all duration-300 ${isCurrentlyPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <div className={`w-14 h-14 rounded-full bg-white flex items-center justify-center text-zinc-950 shadow-[0_8px_24px_rgba(255,255,255,0.3)] transition-all duration-300 ${isCurrentlyPlaying ? 'scale-100' : 'scale-90 group-hover:scale-100 group-hover:shadow-[0_12px_32px_rgba(255,255,255,0.4)]'}`}>
                          {isCurrentlyPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                        </div>
                      </div>

                      {/* Rank badge for top 3 */}
                      {idx < 3 && (
                        <div className="absolute top-3 left-3 w-8 h-8 rounded-lg bg-[var(--color-surface-50)]/80 backdrop-blur-md flex items-center justify-center shadow-md border border-white/10 z-10">
                          <span className="text-[13px] font-mono-nums font-bold text-white">{idx + 1}</span>
                        </div>
                      )}

                      {/* Like button */}
                      <button
                        className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 z-10 active:scale-90 ${isLiked ? 'bg-white shadow-md scale-100' : 'bg-black/40 backdrop-blur-md scale-0 group-hover:scale-100 border border-white/10 hover:bg-white/20'}`}
                        onClick={(e) => { e.stopPropagation(); toggleLikedSong(track); }}
                      >
                        <Heart size={14} className={isLiked ? 'text-black fill-black' : 'text-white'} />
                      </button>

                      {/* Playing indicator */}
                      {isCurrentlyPlaying && (
                        <div className="absolute bottom-4 left-4 flex items-end gap-[3px] h-4 z-10">
                          {[0,1,2].map(i => (
                            <div key={i} className="w-[3px] rounded-full bg-white eq-bar" style={{ height: '100%' }} />
                          ))}
                        </div>
                      )}
                      
                      {/* Context menu */}
                      <div className={`absolute bottom-3 right-3 z-10 bg-black/40 backdrop-blur-md rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-300`} onClick={e => e.stopPropagation()}>
                        <TrackContextMenu track={track} />
                      </div>
                    </div>
                    
                    <h3 className={`font-bold truncate text-[15px] tracking-tight transition-colors ${isCurrentlyPlaying ? 'text-white' : 'text-zinc-100 group-hover:text-white'}`} title={track.title}>
                      {track.title}
                    </h3>
                    <p className="text-[13px] text-zinc-500 font-medium truncate mt-0.5 group-hover:text-zinc-400 transition-colors" title={track.artist}>{track.artist}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── List View ── */}
          {activeView === 'list' && (
            <div className="space-y-1.5 pb-10">
              {results.map((track, idx) => {
                const isCurrentlyPlaying = currentIndex === idx && queue[idx]?.id === track.id && isPlaying;
                const isLiked = (likedSongs || []).some(t => t.id === track.id);
                
                return (
                  <div 
                    key={track.id + idx}
                    onClick={() => handlePlay(idx)}
                    className={`group flex items-center gap-3 md:gap-4 px-3 md:px-4 py-2.5 md:py-3 rounded-2xl cursor-pointer transition-all duration-300 library-card-appear ${
                      isCurrentlyPlaying 
                        ? 'bg-white/10 border border-white/20 shadow-[0_4px_20px_rgba(255,255,255,0.1)]' 
                        : 'hover:bg-white/[0.03] border border-transparent hover:border-white/[0.04]'
                    }`}
                    style={{ animationDelay: `${idx * 15}ms` }}
                  >
                    <div className="hidden sm:block w-8 text-center shrink-0">
                      {isCurrentlyPlaying ? (
                        <div className="flex items-end justify-center gap-[2px] h-4 mx-auto">
                          {[0,1,2].map(i => (
                            <div key={i} className="w-[2px] rounded-full bg-white eq-bar" style={{ height: '100%' }} />
                          ))}
                        </div>
                      ) : (
                        <span className={`text-[14px] font-mono-nums font-semibold ${idx < 3 ? 'text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]' : 'text-zinc-600 group-hover:text-white'} transition-colors`}>{idx + 1}</span>
                      )}
                    </div>
                    
                    <div className="w-[48px] h-[48px] md:w-[56px] md:h-[56px] rounded-xl overflow-hidden bg-zinc-900 shrink-0 shadow-md relative border border-white/[0.04]">
                      {track.coverArtUrl ? (
                        <img src={track.coverArtUrl} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Music size={20} className="text-zinc-700" /></div>
                      )}
                      <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 backdrop-blur-[2px] ${isCurrentlyPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        {isCurrentlyPlaying ? <Pause size={20} fill="white" className="drop-shadow-md" /> : <Play size={20} fill="white" className="ml-1 drop-shadow-md" />}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0 pr-4">
                      <p className={`font-bold text-[15px] tracking-tight truncate transition-colors ${isCurrentlyPlaying ? 'text-white' : 'text-zinc-100 group-hover:text-white'}`} title={track.title}>
                        {track.title}
                      </p>
                      <p className="text-[13px] font-medium text-zinc-500 truncate mt-0.5 md:hidden group-hover:text-zinc-400 transition-colors" title={track.artist}>
                        {track.artist}
                      </p>
                    </div>
                    
                    <span className="hidden md:block w-48 text-[13px] font-medium text-zinc-500 truncate group-hover:text-zinc-400 transition-colors">
                      {track.artist}
                    </span>

                    <span className="hidden sm:block w-16 text-right text-[12px] font-mono-nums font-semibold text-zinc-600 group-hover:text-zinc-400 transition-colors">
                      {formatDuration(track.duration || 0)}
                    </span>

                    <div className="flex items-center gap-2 ml-2">
                      <button
                        className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90"
                        onClick={(e) => { e.stopPropagation(); toggleLikedSong(track); }}
                      >
                        <Heart size={18} className={isLiked ? 'fill-white text-white' : 'text-zinc-600 hover:text-white'} />
                      </button>
                      
                      <div onClick={e => e.stopPropagation()} className="md:opacity-0 group-hover:opacity-100 transition-opacity">
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
          BROWSE GENRES
      ═══════════════════════════════════════════ */}
      {results.length === 0 && !isSearching && (
        <div className="px-6 md:px-10">
          <div className="flex items-center gap-3 mb-8">
            <h2 className="text-[12px] font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-3">
              <Headphones size={14} className="text-white" />
              Browse Genres
            </h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
            {BROWSE_GENRES.map((genre, idx) => (
              <div
                key={genre.name}
                onClick={() => executeSearch(genre.name)}
                className="relative overflow-hidden rounded-2xl h-40 cursor-pointer group library-card-appear border border-white/[0.04] hover:border-white/[0.1] transition-all duration-500"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div className="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105">
                  <div className="absolute inset-0 z-0">
                    <ArtImage 
                      artist={genre.artist}
                      album={genre.album}
                      type="genre"
                      fallbackGradient={genre.gradient}
                      className="w-full h-full object-cover"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-br ${genre.gradient} opacity-50 mix-blend-overlay`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
                  </div>
                  
                  <div className="absolute inset-0 p-5 flex flex-col justify-between z-20">
                    <div>
                      <h3 className="text-[18px] font-bold text-white drop-shadow-md tracking-tight mb-1">{genre.name}</h3>
                      <p className="text-[11px] font-medium text-zinc-300 drop-shadow-md">{genre.description}</p>
                    </div>
                    <div className="flex items-end justify-between">
                      <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] border border-white/20 shadow-lg">
                        <Play size={16} fill="white" className="text-white ml-0.5" />
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
