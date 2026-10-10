import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Play, Pause, Loader2, Music, History, X, Heart, 
  LayoutGrid, List, ArrowRight, Clock, CheckCircle, MapPin, 
  Flame, Sparkles, TrendingUp, Compass, Headphones, Disc3, 
  Trash2, ArrowUpRight, Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import type { AudioDBArtist } from '../services/api';
import { useAudioStore } from '../store/useAudioStore';
import type { Track } from '../types';
import { ArtImage } from '../components/ui/ArtImage';
import { TrackContextMenu } from '../components/ui/TrackContextMenu';

/* ─────────────────────────────────────────────
   CURATED DATA & CONSTANTS
   ───────────────────────────────────────────── */

const QUICK_SEARCHES = [
  { label: 'Trending', query: 'trending hits 2024', icon: Flame },
  { label: 'Pop Hits', query: 'top pop songs', icon: Sparkles },
  { label: 'Rock Anthems', query: 'best rock songs', icon: Radio },
  { label: 'Chill & Lo-Fi', query: 'chill lofi vibes', icon: Headphones },
  { label: 'Electronic', query: 'electronic dance music', icon: Disc3 },
  { label: 'Hip-Hop', query: 'hip hop beats', icon: Flame },
  { label: 'R&B Soul', query: 'r&b soul hits', icon: Sparkles },
  { label: 'Indie Vibes', query: 'indie alternative music', icon: Compass },
  { label: 'K-Pop', query: 'kpop hits', icon: TrendingUp },
  { label: 'Classical', query: 'classical music masterpieces', icon: Music },
];

const TRENDING_RECOMMENDATIONS = [
  { term: 'Kendrick Lamar', category: 'Artist', query: 'Kendrick Lamar' },
  { term: 'Dua Lipa', category: 'Artist', query: 'Dua Lipa' },
  { term: 'Taylor Swift', category: 'Artist', query: 'Taylor Swift' },
  { term: 'The Weeknd - Blinding Lights', category: 'Track', query: 'The Weeknd Blinding Lights' },
  { term: 'Late Night Chill Lo-Fi', category: 'Playlist', query: 'chill lofi beats' },
];

const SONIC_MOODS = [
  {
    title: 'Night Drive',
    subtitle: 'Synthwave & Midnight Cruising',
    query: 'synthwave night drive playlist',
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop',
    accent: 'from-indigo-950/90 via-purple-950/60 to-zinc-950',
    border: 'hover:border-indigo-400/40',
  },
  {
    title: 'Deep Focus',
    subtitle: 'Lo-Fi Instrumental & Flow State',
    query: 'chill lofi study beats',
    image: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=800&auto=format&fit=crop',
    accent: 'from-emerald-950/90 via-teal-950/60 to-zinc-950',
    border: 'hover:border-emerald-400/40',
  },
  {
    title: 'Workout Fuel',
    subtitle: 'High BPM Bass & Trap Energy',
    query: 'gym workout hype music playlist',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=800&auto=format&fit=crop',
    accent: 'from-rose-950/90 via-red-950/60 to-zinc-950',
    border: 'hover:border-rose-400/40',
  },
  {
    title: 'Golden Hour',
    subtitle: 'Warm Acoustic & Indie Serenity',
    query: 'acoustic indie golden hour songs',
    image: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?q=80&w=800&auto=format&fit=crop',
    accent: 'from-amber-950/90 via-orange-950/60 to-zinc-950',
    border: 'hover:border-amber-400/40',
  }
];

const BROWSE_GENRES = [
  { 
    name: 'Pop Hits', 
    accent: 'from-rose-950/90 via-pink-950/50 to-zinc-950', 
    accentBorder: 'hover:border-rose-500/40', 
    artist: 'Dua Lipa', 
    album: 'Future Nostalgia', 
    description: 'Chart-topping global bangers'
  },
  { 
    name: 'Chill Vibes', 
    accent: 'from-slate-900/90 via-zinc-900/50 to-zinc-950', 
    accentBorder: 'hover:border-slate-500/40', 
    artist: 'The xx', 
    album: 'I See You', 
    description: 'Downtempo & ambient serenity'
  },
  { 
    name: 'Rock Classics', 
    accent: 'from-amber-950/90 via-yellow-950/50 to-zinc-950', 
    accentBorder: 'hover:border-amber-500/40', 
    artist: 'Nirvana', 
    album: 'Nevermind', 
    description: 'Timeless anthems & raw guitars'
  },
  { 
    name: 'Hip-Hop', 
    accent: 'from-stone-900/95 via-amber-950/50 to-zinc-950', 
    accentBorder: 'hover:border-amber-500/40', 
    artist: 'Kanye West', 
    album: 'Graduation', 
    description: 'Beats, bars & heavy 808s'
  },
  { 
    name: 'Electronic', 
    accent: 'from-blue-950/90 via-cyan-950/50 to-zinc-950', 
    accentBorder: 'hover:border-blue-500/40', 
    artist: 'Disclosure', 
    album: 'Settle', 
    description: 'Club rhythms & synth waves'
  },
  { 
    name: 'Indie', 
    accent: 'from-emerald-950/90 via-teal-950/50 to-zinc-950', 
    accentBorder: 'hover:border-emerald-500/40', 
    artist: 'Tame Impala', 
    album: 'Currents', 
    description: 'Alternative & psychedelic dreams'
  },
  { 
    name: 'K-Pop', 
    accent: 'from-fuchsia-950/90 via-purple-950/50 to-zinc-950', 
    accentBorder: 'hover:border-fuchsia-500/40', 
    artist: 'BLACKPINK', 
    album: 'THE ALBUM', 
    description: 'Global viral choreography'
  },
  { 
    name: 'R&B Soul', 
    accent: 'from-orange-950/90 via-red-950/50 to-zinc-950', 
    accentBorder: 'hover:border-orange-500/40', 
    artist: 'Frank Ocean', 
    album: 'Blonde', 
    description: 'Smooth vocals & introspective soul'
  },
];

/* ─────────────────────────────────────────────
   COMPONENT
   ───────────────────────────────────────────── */

// ── Module-level cache for Search Trending stability across navigation ──
let memorySearchTrending: Track[] = [];
let memorySearchTrendingTime = 0;
let memoryTrendingScrollLeft = 0;

const getInitialTrending = (): Track[] => {
  try {
    const audioState = useAudioStore.getState();
    const region = audioState?.trendingRegion || 'Global';
    const storeTracks = audioState?.cachedTrending?.[region] || audioState?.cachedTrending?.['Global'];
    if (storeTracks && Array.isArray(storeTracks) && storeTracks.length > 0) {
      return storeTracks;
    }
  } catch {}

  if (memorySearchTrending.length > 0) {
    return memorySearchTrending;
  }

  try {
    const saved = sessionStorage.getItem('inisai_trending_search_cache');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memorySearchTrending = parsed;
        return parsed;
      }
    }
  } catch {}

  return [];
};

export function Library() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Track[]>([]);
  const [searchedArtist, setSearchedArtist] = useState<AudioDBArtist | null>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<'grid' | 'list'>('grid');
  const [activeFilter, setActiveFilter] = useState<'all' | 'tracks'>('all');
  const [searchFocused, setSearchFocused] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const initialTrending = useMemo(() => getInitialTrending(), []);
  const [trendingTracks, setTrendingTracks] = useState<Track[]>(initialTrending);
  const [isTrendingLoading, setIsTrendingLoading] = useState<boolean>(() => initialTrending.length === 0);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number>(-1);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const commandPaletteRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const trendingScrollRef = useRef<HTMLDivElement>(null);

  const { 
    setQueue, 
    playTrack, 
    queue, 
    isPlaying, 
    currentIndex, 
    play, 
    pause, 
    likedSongs, 
    toggleLikedSong,
    cachedTrending,
    setCachedData,
    trendingRegion
  } = useAudioStore();

  // ── Track main container scroll position for subtle sticky header styling ──
  useEffect(() => {
    const mainEl = document.querySelector('main');
    if (!mainEl) return;

    const handleScroll = () => {
      setIsScrolled(mainEl.scrollTop > 24);
    };

    mainEl.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => mainEl.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Smoothly close search dropdown on page scroll, preserving clicks/scroll inside dropdown ──
  useEffect(() => {
    if (!showHistory) return;
    const mainEl = document.querySelector('main');
    if (!mainEl) return;

    const initialScrollTop = mainEl.scrollTop;

    const handleScrollWhileOpen = () => {
      // If user scrolls page content by > 20px, smoothly dismiss search history/dropdown
      if (Math.abs(mainEl.scrollTop - initialScrollTop) > 20) {
        setShowHistory(false);
        setSearchFocused(false);
        inputRef.current?.blur();
      }
    };

    mainEl.addEventListener('scroll', handleScrollWhileOpen, { passive: true });
    return () => mainEl.removeEventListener('scroll', handleScrollWhileOpen);
  }, [showHistory]);

  // ── Keyboard shortcut: Ctrl+K / Cmd+K and Escape ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setShowHistory(true);
      }
      if (e.key === 'Escape') {
        setShowHistory(false);
        setSearchFocused(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // ── Fetch Trending Tracks for Discovery Section (Cached & Stable) ──
  useEffect(() => {
    let isMounted = true;
    const region = trendingRegion || 'Global';

    // Restore horizontal scroll position if returning to page
    if (trendingScrollRef.current && memoryTrendingScrollLeft > 0) {
      trendingScrollRef.current.scrollLeft = memoryTrendingScrollLeft;
    }

    // Determine available cached tracks
    const existing = (cachedTrending && cachedTrending[region]?.length > 0)
      ? cachedTrending[region]
      : (cachedTrending && cachedTrending['Global']?.length > 0)
        ? cachedTrending['Global']
        : memorySearchTrending;

    if (existing && existing.length > 0 && trendingTracks.length === 0) {
      setTrendingTracks(existing);
      setIsTrendingLoading(false);
    }

    // Cache TTL: 15 minutes
    const isFresh = memorySearchTrendingTime > 0 && (Date.now() - memorySearchTrendingTime < 15 * 60 * 1000);

    // If we have cached tracks and data is fresh, skip fetching completely!
    if ((trendingTracks.length > 0 || (existing && existing.length > 0)) && isFresh) {
      return () => {
        if (trendingScrollRef.current) {
          memoryTrendingScrollLeft = trendingScrollRef.current.scrollLeft;
        }
      };
    }

    const fetchTrending = async () => {
      // Only show skeletons if there are NO tracks to display
      if (trendingTracks.length === 0 && (!existing || existing.length === 0)) {
        setIsTrendingLoading(true);
      }
      try {
        const tracks = await api.getTrending(region);
        if (isMounted && tracks && tracks.length > 0) {
          setTrendingTracks(tracks);
          memorySearchTrending = tracks;
          memorySearchTrendingTime = Date.now();
          setCachedData(region, tracks, null);
          try {
            sessionStorage.setItem('inisai_trending_search_cache', JSON.stringify(tracks));
          } catch {}
        }
      } catch (err) {
        console.warn('Trending tracks fetch notice:', err);
      } finally {
        if (isMounted) setIsTrendingLoading(false);
      }
    };

    fetchTrending();

    return () => { 
      isMounted = false;
      if (trendingScrollRef.current) {
        memoryTrendingScrollLeft = trendingScrollRef.current.scrollLeft;
      }
    };
  }, [trendingRegion, setCachedData]);

  // ── Load Search History from LocalStorage ──
  useEffect(() => {
    const saved = localStorage.getItem('searchHistory');
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch (e) { console.error("Failed to parse search history", e); }
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        setShowHistory(false);
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Autocomplete suggestions fetch ──
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!query.trim()) { 
        setSuggestions([]); 
        return; 
      }
      try { 
        const sugs = await api.getSuggestions(query); 
        setSuggestions(sugs || []); 
      } catch (e) { 
        console.error('Failed to fetch suggestions', e); 
      }
    };
    const timeout = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(timeout);
  }, [query]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedSuggestionIndex(-1);
  }, [query, suggestions]);

  const saveToHistory = useCallback((term: string) => {
    if (!term.trim()) return;
    const trimmed = term.trim();
    const newHistory = [trimmed, ...history.filter(t => t.toLowerCase() !== trimmed.toLowerCase())].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  }, [history]);

  const removeHistoryItem = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHistory = history.filter(t => t !== term);
    setHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  const clearAllHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory([]);
    localStorage.removeItem('searchHistory');
  };

  const executeSearch = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    setQuery(searchTerm);
    setIsSearching(true);
    setError('');
    setShowHistory(false);
    setSearchedArtist(null);
    saveToHistory(searchTerm);

    try {
      const [data, initialArtist] = await Promise.all([
        api.searchOnlineTracks(searchTerm),
        api.getAudioDBArtist(searchTerm)
      ]);
      const found = data || [];
      setResults(found);

      let artistMatch = initialArtist;
      if (!artistMatch && found.length > 0) {
        const topArtist = found[0]?.artist;
        if (topArtist && topArtist.toLowerCase() !== searchTerm.toLowerCase()) {
          try {
            artistMatch = await api.getAudioDBArtist(topArtist);
          } catch {
            // ignore
          }
        }
      }
      setSearchedArtist(artistMatch);
    } catch (err) {
      console.error(err);
      setError('Unable to fetch tracks right now. Please check your connection and try again.');
    } finally {
      setIsSearching(false);
    }
  }, [saveToHistory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
      executeSearch(suggestions[selectedSuggestionIndex]);
    } else {
      executeSearch(query);
    }
  };

  // Keyboard navigation inside dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const listLength = query.trim() ? suggestions.length : history.length;
    if (!showHistory || listLength === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => (prev + 1 < listLength ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => (prev - 1 >= 0 ? prev - 1 : listLength - 1));
    }
  };

  const handlePlay = (index: number) => {
    const isSameQueue = queue.length === results.length && queue[0]?.id === results[0]?.id;
    if (!isSameQueue) setQueue(results);
    if (currentIndex === index && isPlaying) pause();
    else if (currentIndex === index && !isPlaying) play();
    else playTrack(index);
  };

  const handlePlayTrending = (index: number) => {
    const isSameQueue = queue.length === trendingTracks.length && queue[0]?.id === trendingTracks[0]?.id;
    if (!isSameQueue) setQueue(trendingTracks);
    if (currentIndex === index && isPlaying) pause();
    else if (currentIndex === index && !isPlaying) play();
    else playTrack(index);
  };

  const formatDuration = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const hasResults = results.length > 0 && !isSearching;
  const showDiscovery = results.length === 0 && !isSearching;

  const filteredResults = useMemo(() => {
    return results;
  }, [results]);

  /* ─────────────────────────────────────────────
     RENDER SEARCH INPUT
     ───────────────────────────────────────────── */
  const renderSearchInput = () => (
    <form onSubmit={handleSearchSubmit} className="w-full">
      <div 
        className={`relative w-full flex items-center transition-all duration-200 h-12 md:h-14 rounded-2xl ${
          searchFocused
            ? 'bg-zinc-900/95 border border-white/30 shadow-[0_8px_30px_rgba(0,0,0,0.5)] ring-2 ring-white/15'
            : isScrolled
              ? 'bg-zinc-900/90 hover:bg-zinc-900 border border-white/15 hover:border-white/25 shadow-lg'
              : 'bg-zinc-900/70 hover:bg-zinc-900/90 border border-white/10 hover:border-white/20 shadow-md'
        }`}
      >
        {/* Search Icon */}
        <div className={`absolute left-4 md:left-5 flex items-center justify-center transition-colors pointer-events-none ${
          searchFocused ? 'text-white' : 'text-zinc-400'
        }`}>
          <Search size={18} strokeWidth={2} />
        </div>

        {/* Text Input */}
        <input 
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { 
            setShowHistory(true); 
            setSearchFocused(true); 
          }}
          onBlur={() => setSearchFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder="Search songs, artists, albums, or moods..."
          className="w-full bg-transparent font-medium text-white placeholder:text-zinc-500 focus:outline-none pl-11 md:pl-13 pr-24 md:pr-28 text-sm md:text-base"
        />

        {/* Right Action Cluster */}
        <div className="absolute right-2 md:right-3 flex items-center gap-2">
          {/* Clear Button */}
          {query && (
            <button 
              type="button" 
              onClick={() => { 
                setQuery(''); 
                inputRef.current?.focus(); 
              }}
              aria-label="Clear search input"
              className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center text-zinc-400 hover:text-white transition-all duration-150 rounded-full hover:bg-white/10 active:scale-[0.96]"
            >
              <X size={14} />
            </button>
          )}

          {/* Keyboard shortcut indicator on Desktop */}
          {!query && (
            <div className="hidden md:flex items-center pointer-events-none opacity-50">
              <kbd className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-zinc-300">⌘K</kbd>
            </div>
          )}

          {/* Submit Action Button */}
          <button 
            type="submit" 
            disabled={isSearching || !query.trim()}
            aria-label="Execute search"
            className="flex items-center justify-center rounded-full bg-white text-black hover:bg-zinc-200 disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-150 active:scale-[0.96] shadow-md w-8 h-8 md:w-9 md:h-9"
          >
            {isSearching ? (
              <Loader2 size={14} className="animate-spin text-black" />
            ) : (
              <ArrowRight size={15} strokeWidth={2.5} />
            )}
          </button>
        </div>
      </div>
    </form>
  );

  /* ─────────────────────────────────────────────
     RENDER INTELLIGENT COMMAND PALETTE DROPDOWN
     ───────────────────────────────────────────── */
  const renderCommandPalette = () => (
    <AnimatePresence>
      {showHistory && (
        <motion.div 
          ref={commandPaletteRef}
          initial={{ opacity: 0, y: 6, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.99 }}
          transition={{ duration: 0.15 }}
          className="absolute top-[calc(100%+8px)] left-0 right-0 bg-zinc-950/95 backdrop-blur-3xl border border-white/10 rounded-2xl md:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] z-50 overflow-hidden"
        >
          <div className="p-3 md:p-5 max-h-[70vh] overflow-y-auto scrollbar-hide">
            {/* CASE 1: Query has characters -> Live Autocomplete */}
            {query.trim() ? (
              <div>
                <div className="flex items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  <span>Suggestions</span>
                  <span className="font-mono text-zinc-600">Press Enter</span>
                </div>
                {suggestions.length > 0 ? (
                  <ul className="space-y-1 mt-1">
                    {suggestions.map((sug, idx) => {
                      const isSelected = selectedSuggestionIndex === idx;
                      return (
                        <li 
                          key={idx}
                          onClick={() => executeSearch(sug)}
                          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer group transition-all ${
                            isSelected ? 'bg-white/15 text-white' : 'hover:bg-white/5 text-zinc-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Search size={14} className={`${isSelected ? 'text-white' : 'text-zinc-500 group-hover:text-white'} shrink-0`} />
                            <span className="text-sm font-medium truncate group-hover:text-white transition-colors">
                              {sug}
                            </span>
                          </div>
                          <ArrowUpRight size={14} className="text-zinc-600 group-hover:text-white opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="px-4 py-6 text-center text-zinc-500 text-sm">
                    Press <span className="text-white font-medium">Enter</span> to search "{query}"
                  </div>
                )}
              </div>
            ) : (
              /* CASE 2: Query is empty -> Balanced 2-Column Command Palette (No Void) */
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {/* Left Column: Recent Searches */}
                  <div>
                    <div className="flex items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      <span className="flex items-center gap-1.5">
                        <History size={12} />
                        Recent Searches
                      </span>
                      {history.length > 0 && (
                        <button 
                          type="button" 
                          onClick={clearAllHistory}
                          className="text-zinc-500 hover:text-rose-400 transition-colors lowercase tracking-normal text-xs flex items-center gap-1"
                        >
                          <Trash2 size={11} />
                          clear all
                        </button>
                      )}
                    </div>

                    {history.length > 0 ? (
                      <ul className="space-y-1 mt-1">
                        {history.slice(0, 5).map((term, idx) => (
                          <li 
                            key={idx}
                            onClick={() => executeSearch(term)}
                            className="flex items-center justify-between px-3.5 py-2 hover:bg-white/5 rounded-xl cursor-pointer group transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <Clock size={13} className="text-zinc-600 group-hover:text-zinc-400 shrink-0" />
                              <span className="text-sm text-zinc-300 group-hover:text-white transition-colors truncate">
                                {term}
                              </span>
                            </div>
                            <button 
                              type="button" 
                              onClick={(e) => removeHistoryItem(term, e)}
                              className="w-6 h-6 flex items-center justify-center text-zinc-600 hover:text-white rounded-md hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                            >
                              <X size={12} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="px-3.5 py-6 text-xs text-zinc-600">
                        No recent searches
                      </div>
                    )}
                  </div>

                  {/* Right Column: Trending Searches */}
                  <div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      <Flame size={12} className="text-amber-400" />
                      <span>Trending Searches</span>
                    </div>

                    <div className="space-y-1 mt-1">
                      {TRENDING_RECOMMENDATIONS.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => executeSearch(item.query)}
                          className="w-full flex items-center justify-between p-2 rounded-xl bg-white/[0.02] hover:bg-white/5 border border-white/5 text-left group transition-all"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-5 h-5 rounded-md bg-white/5 font-mono text-[10px] font-bold flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:bg-white/10">
                              {idx + 1}
                            </span>
                            <p className="text-xs font-semibold text-zinc-200 group-hover:text-white truncate">
                              {item.term}
                            </p>
                          </div>
                          <span className="text-[10px] text-zinc-500 shrink-0 ml-2">
                            {item.category}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Quick Explore Chips */}
                <div className="pt-3.5 mt-3.5 border-t border-white/5 flex flex-wrap gap-1.5 px-2">
                  {['Top 50', 'Lo-Fi Chill', 'Gym Workout', 'Acoustic Morning', 'Synthwave'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => executeSearch(tag)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="relative min-h-full pb-2 md:pb-4">
      {/* ── Soft Ambient Glow ── */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-64 pointer-events-none opacity-20 blur-3xl z-0"
        style={{
          background: 'radial-gradient(circle at 50% 15%, rgba(255, 255, 255, 0.12), transparent 70%)'
        }}
      />

      {/* ── Subtle Backdrop Dimmer for Focused Search ── */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-20 pointer-events-none hidden md:block"
          />
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════
          HEADER — Clean, Confident & Professional
          ═══════════════════════════════════════════ */}
      <div className="relative z-10 px-4 md:px-8 lg:px-10 pt-6 md:pt-10 pb-3 max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
          Search
        </h1>
      </div>

      {/* ═══════════════════════════════════════════
          SEARCH BAR — Unified Sticky Container
          (Glides to top-0 when scrolled, zero layout shift)
          ═══════════════════════════════════════════ */}
      <div 
        className={`sticky top-0 z-40 transition-colors duration-200 px-4 md:px-8 lg:px-10 ${
          isScrolled 
            ? 'py-3 bg-zinc-950/90 backdrop-blur-2xl border-b border-white/10 shadow-xl' 
            : 'py-2 bg-transparent mb-5'
        }`}
      >
        <div ref={searchContainerRef} className="relative w-full max-w-7xl mx-auto">
          {renderSearchInput()}
          {renderCommandPalette()}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          QUICK SEARCH PILLS
          ═══════════════════════════════════════════ */}
      {showDiscovery && (
        <div className="relative z-10 px-4 md:px-8 lg:px-10 mb-8 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            {QUICK_SEARCHES.map((item) => {
              const Icon = item.icon;
              return (
                <motion.button 
                  key={item.label} 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => executeSearch(item.query)}
                  className="shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-full text-xs md:text-sm font-medium text-zinc-300 hover:text-white bg-zinc-900/80 hover:bg-zinc-850 border border-white/10 hover:border-white/20 transition-all shadow-sm whitespace-nowrap group"
                >
                  <Icon size={13} className="text-zinc-500 group-hover:text-white transition-colors" />
                  <span>{item.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          ERROR NOTICE
          ═══════════════════════════════════════════ */}
      {error && (
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 lg:px-10 mb-6">
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-300 text-sm font-medium flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
              <X size={16} className="text-red-400" />
            </div>
            <p className="flex-1">{error}</p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          LOADING STATE
          ═══════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {isSearching && (
          <motion.div 
            key="loading"
            initial={{ opacity: 0, y: 12 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 lg:px-10"
          >
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900/90 border border-white/10 flex items-end justify-center gap-1 p-4 shadow-2xl">
                  {[0, 1, 2, 3, 4].map(i => (
                    <div 
                      key={i} 
                      className="w-1 rounded-full bg-white eq-bar" 
                      style={{ height: '100%', animationDelay: `${i * 0.15}s` }} 
                    />
                  ))}
                </div>
              </div>
              <p className="text-base md:text-lg font-bold text-white tracking-tight">Finding audio streams…</p>
            </div>

            {/* Skeleton Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mt-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="animate-pulse" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="aspect-square rounded-2xl bg-zinc-900 border border-white/5 mb-3" />
                  <div className="h-3.5 w-3/4 rounded-md bg-zinc-900 mb-2" />
                  <div className="h-2.5 w-1/2 rounded-md bg-zinc-900/60" />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════
            SEARCH RESULTS VIEW
            ═══════════════════════════════════════════ */}
        {hasResults && (
          <motion.div 
            key="results"
            initial={{ opacity: 0, y: 12 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 lg:px-10 pb-12"
          >
            {/* ── ARTIST SPOTLIGHT BANNER (When artist matches) ── */}
            {searchedArtist && (
              <div className="relative rounded-3xl overflow-hidden mb-8 border border-white/10 shadow-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950">
                <div className="absolute inset-0 z-0">
                  {searchedArtist.strArtistFanart || searchedArtist.strArtistBanner || searchedArtist.strArtistWideThumb ? (
                    <img
                      src={searchedArtist.strArtistFanart || searchedArtist.strArtistBanner || searchedArtist.strArtistWideThumb}
                      alt={searchedArtist.strArtist}
                      className="w-full h-full object-cover brightness-[0.35] filter contrast-110"
                    />
                  ) : (
                    <ArtImage
                      artist={searchedArtist.strArtist}
                      type="artist"
                      className="w-full h-full object-cover brightness-[0.3]"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-zinc-950/70 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-transparent to-zinc-950/80" />
                </div>

                <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="flex items-center gap-5 min-w-0">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden bg-zinc-900 shrink-0 border-2 border-white/20 shadow-2xl relative">
                      {searchedArtist.strArtistThumb ? (
                        <img src={searchedArtist.strArtistThumb} alt={searchedArtist.strArtist} className="w-full h-full object-cover" />
                      ) : (
                        <ArtImage artist={searchedArtist.strArtist} type="artist" className="w-full h-full object-cover" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 backdrop-blur-md">
                          <CheckCircle size={10} className="text-blue-400" />
                          Verified Artist
                        </span>
                        {searchedArtist.strGenre && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-zinc-300 bg-white/10 border border-white/10">
                            {searchedArtist.strGenre}
                          </span>
                        )}
                        {searchedArtist.strCountry && (
                          <span className="text-[11px] font-medium text-zinc-400 hidden sm:inline-flex items-center gap-1">
                            <MapPin size={11} className="text-zinc-500" />
                            {searchedArtist.strCountry}
                          </span>
                        )}
                      </div>

                      <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight drop-shadow-md truncate">
                        {searchedArtist.strArtist}
                      </h2>

                      {(searchedArtist.strBiography || searchedArtist.strBiographyEN) && (
                        <p className="text-xs md:text-sm text-zinc-300 line-clamp-2 max-w-2xl mt-1.5 leading-relaxed font-normal">
                          {searchedArtist.strBiography || searchedArtist.strBiographyEN}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => {
                        setQueue(results);
                        playTrack(0);
                      }}
                      className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-white text-black px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 transition-all shadow-xl cursor-pointer"
                    >
                      <Play size={14} fill="currentColor" />
                      <span>Play Artist</span>
                    </motion.button>

                    <button
                      onClick={() => navigate('/albums', { state: { artist: searchedArtist.strArtist } })}
                      className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/15 px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all backdrop-blur-md cursor-pointer"
                    >
                      <span>Discography</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Results Header with Filter Chips & View Switcher ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-3 border-b border-white/5">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Results for</span>
                  <span className="text-zinc-400 font-medium">"{query}"</span>
                  <span className="text-xs font-mono text-zinc-400 bg-zinc-900 px-2.5 py-0.5 rounded-full border border-white/10">
                    {results.length}
                  </span>
                </h2>
              </div>

              <div className="flex items-center gap-3">
                {/* Result Filter Chips */}
                <div className="flex items-center gap-1 p-1 bg-zinc-900/90 border border-white/10 rounded-xl">
                  <button
                    onClick={() => setActiveFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      activeFilter === 'all' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActiveFilter('tracks')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      activeFilter === 'tracks' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Tracks
                  </button>
                </div>

                {/* View Switcher */}
                <div className="flex items-center gap-1 p-1 bg-zinc-900/90 border border-white/10 rounded-xl">
                  <button 
                    onClick={() => setActiveView('grid')}
                    aria-label="Grid view"
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                      activeView === 'grid' ? 'bg-white/15 text-white' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <LayoutGrid size={15} />
                  </button>
                  <button 
                    onClick={() => setActiveView('list')}
                    aria-label="List view"
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                      activeView === 'list' ? 'bg-white/15 text-white' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <List size={15} />
                  </button>
                </div>
              </div>
            </div>

            {/* ── TOP RESULT SPOTLIGHT ── */}
            {filteredResults.length > 0 && (
              <div className="mb-8">
                <div className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">
                  Top Result
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* #1 Top Match Card */}
                  {(() => {
                    const topTrack = filteredResults[0];
                    const isTopPlaying = currentIndex === 0 && queue[0]?.id === topTrack.id && isPlaying;
                    const isLiked = (likedSongs || []).some(t => t.id === topTrack.id);

                    return (
                      <motion.div 
                        whileHover={{ y: -2 }}
                        onClick={() => handlePlay(0)}
                        className="lg:col-span-1 p-5 rounded-3xl bg-zinc-950/80 border border-white/10 hover:border-white/20 transition-all cursor-pointer group relative overflow-hidden shadow-xl"
                      >
                        <div className="flex sm:flex-row lg:flex-col gap-4 items-start">
                          <div className="relative w-28 h-28 sm:w-32 sm:h-32 lg:w-44 lg:h-44 rounded-2xl overflow-hidden bg-zinc-900 shrink-0 border border-white/10 shadow-lg">
                            {topTrack.coverArtUrl ? (
                              <img src={topTrack.coverArtUrl} alt={topTrack.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-zinc-900"><Music size={32} className="text-zinc-600" /></div>
                            )}
                            <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                              isTopPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            }`}>
                              <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-2xl active:scale-[0.96] transition-transform">
                                {isTopPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                              </div>
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg md:text-xl font-bold text-white tracking-tight truncate group-hover:text-white">
                              {topTrack.title}
                            </h3>
                            <p className="text-sm text-zinc-400 font-medium truncate mt-0.5">
                              {topTrack.artist}
                            </p>
                            <div className="flex items-center gap-3 mt-4">
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleLikedSong(topTrack); }}
                                aria-label={isLiked ? "Unlike top track" : "Like top track"}
                                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-all duration-150 active:scale-[0.96]"
                              >
                                <Heart size={14} className={isLiked ? 'text-rose-500 fill-rose-500' : ''} />
                              </button>
                              <span className="text-xs font-mono tabular-nums text-zinc-500">
                                {formatDuration(topTrack.duration || 0)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })()}

                  {/* Companion Tracks */}
                  <div className="lg:col-span-2 space-y-1.5">
                    {filteredResults.slice(1, 5).map((track, relativeIdx) => {
                      const actualIdx = relativeIdx + 1;
                      const isCurrentlyPlaying = currentIndex === actualIdx && queue[actualIdx]?.id === track.id && isPlaying;
                      const isLiked = (likedSongs || []).some(t => t.id === track.id);

                      return (
                        <div
                          key={track.id + actualIdx}
                          onClick={() => handlePlay(actualIdx)}
                          className={`flex items-center justify-between p-2.5 md:p-3 rounded-2xl border transition-all cursor-pointer group ${
                            isCurrentlyPlaying 
                              ? 'bg-white/10 border-white/20' 
                              : 'bg-zinc-950/60 hover:bg-white/[0.04] border-white/5 hover:border-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-white/10">
                              {track.coverArtUrl ? (
                                <img src={track.coverArtUrl} alt={track.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><Music size={16} className="text-zinc-600" /></div>
                              )}
                              <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${
                                isCurrentlyPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                              }`}>
                                {isCurrentlyPlaying ? <Pause size={14} fill="white" /> : <Play size={14} fill="white" className="ml-0.5" />}
                              </div>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white truncate">{track.title}</p>
                              <p className="text-xs text-zinc-400 truncate">{track.artist}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs font-mono text-zinc-500">
                              {formatDuration(track.duration || 0)}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleLikedSong(track); }}
                              className="w-8 h-8 rounded-full flex items-center justify-center transition-all text-zinc-500 hover:text-white"
                            >
                              <Heart size={14} className={isLiked ? 'text-rose-500 fill-rose-500' : ''} />
                            </button>
                            <div onClick={e => e.stopPropagation()} className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <TrackContextMenu track={track} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── ALL SONGS (GRID OR LIST) ── */}
            <div className="mt-8">
              <div className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center justify-between">
                <span>All Tracks</span>
                <span className="text-zinc-600 font-mono text-[11px]">{filteredResults.length} tracks</span>
              </div>

              {activeView === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 md:gap-4">
                  {filteredResults.map((track, idx) => {
                    const isCurrentlyPlaying = currentIndex === idx && queue[idx]?.id === track.id && isPlaying;
                    const isLiked = (likedSongs || []).some(t => t.id === track.id);

                    return (
                      <motion.div 
                        key={track.id + idx}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.3) }}
                        whileHover={{ y: -3, transition: { duration: 0.2 } }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handlePlay(idx)}
                        className="group cursor-pointer p-2.5 rounded-2xl bg-zinc-950/40 hover:bg-white/[0.04] border border-white/5 hover:border-white/10 transition-all"
                      >
                        <div className="relative aspect-square rounded-xl overflow-hidden mb-2.5 bg-zinc-900 border border-white/10">
                          {track.coverArtUrl ? (
                            <img src={track.coverArtUrl} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Music size={24} className="text-zinc-600" /></div>
                          )}

                          {/* Hover Play Button */}
                          <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                            isCurrentlyPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}>
                            <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-xl active:scale-[0.96] transition-transform">
                              {isCurrentlyPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                            </div>
                          </div>

                          {/* Like Button */}
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleLikedSong(track); }}
                            className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center z-10 transition-all ${
                              isLiked ? 'bg-white text-black' : 'bg-black/50 text-white opacity-0 group-hover:opacity-100'
                            }`}
                          >
                            <Heart size={12} className={isLiked ? 'fill-black' : ''} />
                          </button>

                          {/* Equalizer */}
                          {isCurrentlyPlaying && (
                            <div className="absolute bottom-2 left-2 flex items-end gap-[2px] h-3 z-10 bg-black/60 px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                              {[0, 1, 2].map(i => <div key={i} className="w-[2px] rounded-full bg-white eq-bar" style={{ height: '100%' }} />)}
                            </div>
                          )}
                        </div>

                        <h3 className="font-semibold text-xs md:text-sm text-white truncate tracking-tight" title={track.title}>
                          {track.title}
                        </h3>
                        <p className="text-[11px] text-zinc-400 truncate mt-0.5" title={track.artist}>
                          {track.artist}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                /* List View */
                <div className="space-y-1">
                  {filteredResults.map((track, idx) => {
                    const isCurrentlyPlaying = currentIndex === idx && queue[idx]?.id === track.id && isPlaying;
                    const isLiked = (likedSongs || []).some(t => t.id === track.id);

                    return (
                      <div
                        key={track.id + idx}
                        onClick={() => handlePlay(idx)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer group ${
                          isCurrentlyPlaying ? 'bg-white/10 border-white/20' : 'hover:bg-white/[0.04] border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <span className="w-5 text-center text-xs font-mono text-zinc-500">
                            {idx + 1}
                          </span>
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-zinc-900 shrink-0 border border-white/5">
                            {track.coverArtUrl ? (
                              <img src={track.coverArtUrl} alt={track.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><Music size={14} className="text-zinc-600" /></div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{track.title}</p>
                            <p className="text-xs text-zinc-400 truncate">{track.artist}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs font-mono text-zinc-500">
                            {formatDuration(track.duration || 0)}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleLikedSong(track); }}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:text-white"
                          >
                            <Heart size={14} className={isLiked ? 'text-rose-500 fill-rose-500' : ''} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════
          DISCOVERY SECTIONS (Before Searching)
          ═══════════════════════════════════════════ */}
      {showDiscovery && (
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 lg:px-10 space-y-12">
          
          {/* ── SECTION 1: TRENDING RIGHT NOW (Audio Carousel) ── */}
          {(trendingTracks.length > 0 || isTrendingLoading) && (
            <div>
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                  Trending Right Now
                </h2>
                <button
                  onClick={() => executeSearch('top trending songs')}
                  className="text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <span>See all</span>
                  <ArrowRight size={12} />
                </button>
              </div>

              {/* Horizontal Scroll Deck */}
              <div 
                ref={trendingScrollRef}
                className="flex gap-3 md:gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0"
              >
                {isTrendingLoading && trendingTracks.length === 0 ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="shrink-0 w-36 sm:w-40 md:w-44 p-3 rounded-2xl bg-zinc-950/70 border border-white/5 animate-pulse">
                      <div className="aspect-square rounded-xl bg-zinc-900 mb-2.5" />
                      <div className="h-3.5 w-3/4 rounded bg-zinc-900 mb-1.5" />
                      <div className="h-2.5 w-1/2 rounded bg-zinc-900/60" />
                    </div>
                  ))
                ) : (
                  trendingTracks.slice(0, 10).map((track, idx) => {
                    const isCurrentTrendingPlaying = currentIndex === idx && queue[idx]?.id === track.id && isPlaying;
                    const isLiked = (likedSongs || []).some(t => t.id === track.id);

                    return (
                      <motion.div
                        key={track.id + idx}
                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handlePlayTrending(idx)}
                        className="shrink-0 w-36 sm:w-40 md:w-44 p-3 rounded-2xl bg-zinc-950/70 hover:bg-white/[0.05] border border-white/5 hover:border-white/15 transition-all cursor-pointer group shadow-lg"
                      >
                        <div className="relative aspect-square rounded-xl overflow-hidden mb-2.5 bg-zinc-900 border border-white/10">
                          {track.coverArtUrl ? (
                            <img src={track.coverArtUrl} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Music size={24} className="text-zinc-600" /></div>
                          )}

                          {/* Like Button */}
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleLikedSong(track); }}
                            className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center z-10 transition-all ${
                              isLiked ? 'bg-white text-black' : 'bg-black/50 text-white opacity-0 group-hover:opacity-100 hover:scale-105'
                            }`}
                          >
                            <Heart size={12} className={isLiked ? 'fill-black' : ''} />
                          </button>

                          {/* Play Overlay */}
                          <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                            isCurrentTrendingPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}>
                            <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-xl active:scale-[0.96] transition-transform">
                              {isCurrentTrendingPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                            </div>
                          </div>

                          {/* Equalizer */}
                          {isCurrentTrendingPlaying && (
                            <div className="absolute bottom-2 left-2 flex items-end gap-[2px] h-3 z-10 bg-black/60 px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                              {[0, 1, 2].map(i => <div key={i} className="w-[2px] rounded-full bg-white eq-bar" style={{ height: '100%' }} />)}
                            </div>
                          )}
                        </div>

                        <h3 className="font-semibold text-xs md:text-sm text-white truncate tracking-tight" title={track.title}>
                          {track.title}
                        </h3>
                        <p className="text-[11px] text-zinc-400 truncate mt-0.5" title={track.artist}>
                          {track.artist}
                        </p>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ── SECTION 2: CURATED MOODS (Rich, Textured Artwork Cards) ── */}
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-4">
              Curated Moods
            </h2>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {SONIC_MOODS.map((mood) => (
                <motion.div
                  key={mood.title}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => executeSearch(mood.query)}
                  className={`relative overflow-hidden rounded-2xl md:rounded-3xl cursor-pointer group border border-white/5 ${mood.border} transition-all duration-200 h-36 md:h-44 shadow-lg`}
                >
                  {/* Mood Atmospheric Artwork Background */}
                  <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-105">
                    <img 
                      src={mood.image} 
                      alt={mood.title} 
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-br ${mood.accent} opacity-80`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
                  </div>

                  {/* Content Island */}
                  <div className="absolute inset-0 p-4 flex flex-col justify-end z-10">
                    <h3 className="text-base md:text-xl font-bold text-white drop-shadow-md tracking-tight leading-tight">
                      {mood.title}
                    </h3>
                    <p className="text-[11px] text-zinc-300/80 font-normal mt-0.5 line-clamp-1">
                      {mood.subtitle}
                    </p>
                  </div>

                  {/* Hover Floating Glass Play Button */}
                  <div className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-200 border border-white/20 z-10 shadow-lg">
                    <Play size={14} fill="white" className="text-white ml-0.5" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── SECTION 3: BROWSE GENRES ── */}
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-4">
              Browse Genres
            </h2>

            {/* Symmetrical Grid: 2 cols on mobile (4 rows), 4 cols on desktop (2 rows) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {BROWSE_GENRES.map((genre, idx) => (
                <motion.div
                  key={genre.name}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.02 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => executeSearch(genre.name)}
                  className={`relative overflow-hidden rounded-2xl md:rounded-3xl cursor-pointer group border border-white/5 ${genre.accentBorder} transition-all duration-200 h-36 md:h-44 shadow-lg`}
                >
                  {/* Artwork */}
                  <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-105">
                    <ArtImage 
                      artist={genre.artist}
                      album={genre.album}
                      type="genre"
                      fallbackGradient={genre.accent}
                      className="w-full h-full object-cover"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-br ${genre.accent} opacity-80`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  </div>

                  {/* Content Island */}
                  <div className="absolute inset-0 p-3.5 md:p-4 flex flex-col justify-end z-10">
                    <h3 className="text-base md:text-xl font-bold text-white drop-shadow-md tracking-tight leading-tight">
                      {genre.name}
                    </h3>
                    <p className="text-[11px] text-zinc-300/80 font-normal mt-0.5 line-clamp-1">
                      {genre.description}
                    </p>
                  </div>

                  {/* Hover Floating Glass Play Button */}
                  <div className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-200 border border-white/20 z-10 shadow-lg">
                    <Play size={14} fill="white" className="text-white ml-0.5" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

export default Library;
