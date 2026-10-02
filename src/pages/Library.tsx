import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Play, Pause, Loader2, Music, History, X, Heart, LayoutGrid, List, ArrowRight, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { useAudioStore } from '../store/useAudioStore';
import type { Track } from '../types';
import { ArtImage } from '../components/ui/ArtImage';
import { TrackContextMenu } from '../components/ui/TrackContextMenu';

/* ─────────────────────────────────────────────
   DATA
   ───────────────────────────────────────────── */

const QUICK_SEARCHES = [
 { label: 'Trending', query: 'trending hits 2024' },
 { label: 'Pop', query: 'top pop songs' },
 { label: 'Rock', query: 'best rock songs' },
 { label: 'R&B', query: 'r&b hits' },
 { label: 'Electronic', query: 'electronic dance music' },
 { label: 'Chill', query: 'chill lofi vibes' },
 { label: 'Classical', query: 'classical music' },
 { label: 'K-Pop', query: 'kpop hits' },
 { label: 'Hip-Hop', query: 'hip hop beats' },
 { label: 'Jazz', query: 'jazz classics' },
];

const BROWSE_GENRES = [
 { name: 'Pop Hits', accent: 'from-rose-500/30 to-rose-900/10', accentBorder: 'hover:border-rose-500/30', artist: 'Dua Lipa', album: 'Future Nostalgia', description: 'Chart-topping bangers', size: 'tall' },
 { name: 'Chill Vibes', accent: 'from-sky-500/30 to-sky-900/10', accentBorder: 'hover:border-sky-500/30', artist: 'The xx', album: 'I See You', description: 'Relax & unwind', size: 'short' },
 { name: 'Rock Classics', accent: 'from-amber-500/30 to-amber-900/10', accentBorder: 'hover:border-amber-500/30', artist: 'Nirvana', album: 'Nevermind', description: 'Timeless anthems', size: 'short' },
 { name: 'Hip-Hop', accent: 'from-violet-500/30 to-violet-900/10', accentBorder: 'hover:border-violet-500/30', artist: 'Kanye West', album: 'Graduation', description: 'Beats & bars', size: 'tall' },
 { name: 'Electronic', accent: 'from-cyan-500/30 to-cyan-900/10', accentBorder: 'hover:border-cyan-500/30', artist: 'Disclosure', album: 'Settle', description: 'Drop the bass', size: 'short' },
 { name: 'Indie', accent: 'from-emerald-500/30 to-emerald-900/10', accentBorder: 'hover:border-emerald-500/30', artist: 'Tame Impala', album: 'Currents', description: 'Alternative sounds', size: 'tall' },
 { name: 'K-Pop', accent: 'from-pink-500/30 to-pink-900/10', accentBorder: 'hover:border-pink-500/30', artist: 'BLACKPINK', album: 'THE ALBUM', description: 'Global phenomenon', size: 'short' },
 { name: 'R&B Soul', accent: 'from-orange-500/30 to-orange-900/10', accentBorder: 'hover:border-orange-500/30', artist: 'Frank Ocean', album: 'Blonde', description: 'Smooth & soulful', size: 'short' },
];

/* ─────────────────────────────────────────────
   COMPONENT
   ───────────────────────────────────────────── */

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
 const [isSearchSticky, setIsSearchSticky] = useState(false);
 const searchContainerRef = useRef<HTMLDivElement>(null);
 const searchSentinelRef = useRef<HTMLDivElement>(null);
 const inputRef = useRef<HTMLInputElement>(null);
 const stickyInputRef = useRef<HTMLInputElement>(null);
 
 const { setQueue, playTrack, queue, isPlaying, currentIndex, play, pause, likedSongs, toggleLikedSong } = useAudioStore();

 // ── Sticky search sentinel ──
 useEffect(() => {
  const sentinel = searchSentinelRef.current;
  if (!sentinel) return;
  const observer = new IntersectionObserver(
   ([entry]) => setIsSearchSticky(!entry.isIntersecting),
   { threshold: 0, rootMargin: '-1px 0px 0px 0px' }
  );
  observer.observe(sentinel);
  return () => observer.disconnect();
 }, []);

 // ── Keyboard shortcut: Ctrl+K / Cmd+K ──
 useEffect(() => {
  const handler = (e: KeyboardEvent) => {
   if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    inputRef.current?.focus();
   }
  };
  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
 }, []);

 // ── Load search history ──
 useEffect(() => {
  const saved = localStorage.getItem('searchHistory');
  if (saved) {
   try { setHistory(JSON.parse(saved)); } catch (e) { console.error("Failed to parse search history", e); }
  }

  const handleClickOutside = (event: MouseEvent) => {
   if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
    setShowHistory(false);
   }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
 }, []);

 // ── Autocomplete suggestions ──
 useEffect(() => {
  const fetchSuggestions = async () => {
   if (!query.trim()) { setSuggestions([]); return; }
   try { const sugs = await api.getSuggestions(query); setSuggestions(sugs); } catch (e) { console.error('Failed to fetch suggestions', e); }
  };
  const timeout = setTimeout(fetchSuggestions, 300);
  return () => clearTimeout(timeout);
 }, [query]);

 const saveToHistory = useCallback((term: string) => {
  if (!term.trim()) return;
  const newHistory = [term, ...history.filter(t => t !== term)].slice(0, 10);
  setHistory(newHistory);
  localStorage.setItem('searchHistory', JSON.stringify(newHistory));
 }, [history]);

 const removeHistoryItem = (term: string, e: React.MouseEvent) => {
  e.stopPropagation();
  const newHistory = history.filter(t => t !== term);
  setHistory(newHistory);
  localStorage.setItem('searchHistory', JSON.stringify(newHistory));
 };

 const executeSearch = useCallback(async (searchTerm: string) => {
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
 }, [saveToHistory]);

 const handleSearch = async (e: React.FormEvent) => {
  e.preventDefault();
  executeSearch(query);
 };

 const handlePlay = (index: number) => {
  const isSameQueue = queue.length === results.length && queue[0]?.id === results[0]?.id;
  if (!isSameQueue) setQueue(results);
  if (currentIndex === index && isPlaying) pause();
  else if (currentIndex === index && !isPlaying) play();
  else playTrack(index);
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

 const hasResults = results.length > 0 && !isSearching;
 const showDiscovery = results.length === 0 && !isSearching;

 /* ─────────────────────────────────────────────
    SEARCH INPUT (shared between hero & sticky)
    ───────────────────────────────────────────── */
 const renderSearchInput = (isSticky: boolean) => (
  <form onSubmit={handleSearch} className="w-full">
   <div className={`relative w-full flex items-center rounded-2xl border transition-all duration-200 ${
    searchFocused && !isSticky ? 'bg-zinc-800/80 border-zinc-600 shadow-lg shadow-white/5' 
    : isSticky ? 'bg-zinc-900/95 border-white/10' 
    : 'bg-zinc-900/60 border-white/10 hover:border-white/20'
   }`}>
    <div className={`absolute left-4 transition-colors ${searchFocused ? 'text-white' : 'text-zinc-500'}`}>
     <Search size={18} />
    </div>
    <input 
     ref={isSticky ? stickyInputRef : inputRef}
     type="text"
     value={query}
     onChange={(e) => setQuery(e.target.value)}
     onFocus={() => { if (!isSticky) { setShowHistory(true); setSearchFocused(true); } }}
     onBlur={() => setSearchFocused(false)}
     placeholder="Search songs, artists, albums..."
     className={`w-full bg-transparent font-medium text-zinc-100 placeholder:text-zinc-600 focus:outline-none ${
      isSticky ? 'py-2.5 pl-11 pr-12 text-sm' : 'py-3.5 md:py-4 pl-12 pr-28 text-base'
     }`}
    />
    {/* Clear button */}
    {query && !isSticky && (
     <button type="button" onClick={() => { setQuery(''); inputRef.current?.focus(); }}
      className="absolute right-20 w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-white transition-colors rounded-full hover:bg-white/10">
      <X size={14} />
     </button>
    )}
    {/* Submit */}
    {!isSticky ? (
     <button type="submit" disabled={isSearching || !query.trim()}
      className="absolute right-2 w-10 h-10 flex items-center justify-center rounded-xl bg-white text-black hover:bg-zinc-200 disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-90">
      {isSearching ? <Loader2 size={16} className="animate-spin"/> : <ArrowRight size={16} />}
     </button>
    ) : (
     <button type="submit" disabled={isSearching || !query.trim()}
      className="absolute right-2 w-8 h-8 flex items-center justify-center rounded-lg bg-white text-black hover:bg-zinc-200 disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-90">
      {isSearching ? <Loader2 size={14} className="animate-spin"/> : <ArrowRight size={14} />}
     </button>
    )}
    {/* Keyboard shortcut hint */}
    {!query && !isSticky && (
     <div className="absolute right-14 hidden md:flex items-center gap-0.5 pointer-events-none">
      <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-zinc-600">⌘</kbd>
      <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-zinc-600">K</kbd>
     </div>
    )}
   </div>
  </form>
 );

 return (
  <div className="animate-fade-in relative">

   {/* ═══════════════════════════════════════════
       STICKY SEARCH BAR (appears on scroll)
       ═══════════════════════════════════════════ */}
   <AnimatePresence>
    {isSearchSticky && (
     <motion.div 
      initial={{ y: -48, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -48, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
      className="sticky top-0 z-40 -mt-8"
     >
      <div className="bg-zinc-950/90 backdrop-blur-2xl border-b border-white/5 px-4 md:px-8 py-2.5">
       <div className="max-w-2xl">
        {renderSearchInput(true)}
       </div>
      </div>
     </motion.div>
    )}
   </AnimatePresence>

   {/* ═══════════════════════════════════════════
       HERO — Compressed, functional
       ═══════════════════════════════════════════ */}
   <div className="px-4 md:px-8 lg:px-10 pt-6 md:pt-8 pb-2">
    <div className="flex items-baseline gap-3 mb-1">
     <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
      Search
     </h1>
     <span className="text-sm text-zinc-600 font-medium hidden md:inline">{getGreeting()}</span>
    </div>
    <p className="text-sm text-zinc-500 mb-5">Find songs, artists, and albums</p>
   </div>

   {/* ═══════════════════════════════════════════
       SEARCH BAR — Full width command palette
       ═══════════════════════════════════════════ */}
   <div ref={searchSentinelRef} className="px-4 md:px-8 lg:px-10 mb-6">
    <div ref={searchContainerRef} className="relative w-full max-w-3xl">
     {renderSearchInput(false)}

     {/* ── Dropdown: Suggestions / History ── */}
     {showHistory && (query.trim() ? suggestions.length > 0 : history.length > 0) && (
      <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
       <div className="px-2 py-2">
        <div className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest px-3 py-2">
         {query.trim() ? 'Suggestions' : 'Recent'}
        </div>
        <ul className="max-h-64 overflow-y-auto">
         {query.trim() ? (
          suggestions.map((sug, idx) => (
           <li key={idx}
            className="flex items-center justify-between px-3 py-2 hover:bg-white/5 rounded-xl cursor-pointer group transition-colors"
            onClick={() => executeSearch(sug)}>
            <div className="flex items-center gap-3">
             <Search size={14} className="text-zinc-500 group-hover:text-white shrink-0"/>
             <span className="text-sm text-zinc-300 group-hover:text-white transition-colors truncate">{sug}</span>
            </div>
            <ArrowRight size={12} className="text-zinc-700 group-hover:text-zinc-400 shrink-0"/>
           </li>
          ))
         ) : (
          history.map((term, idx) => (
           <li key={idx}
            className="flex items-center justify-between px-3 py-2 hover:bg-white/5 rounded-xl cursor-pointer group transition-colors"
            onClick={() => executeSearch(term)}>
            <div className="flex items-center gap-3 min-w-0">
             <History size={14} className="text-zinc-600 group-hover:text-zinc-400 shrink-0"/>
             <span className="text-sm text-zinc-400 group-hover:text-white transition-colors truncate">{term}</span>
            </div>
            <button type="button" onClick={(e) => removeHistoryItem(term, e)}
             className="text-zinc-700 hover:text-white w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all shrink-0">
             <X size={12} />
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
       QUICK SEARCH — Horizontal scrollable pills (always visible)
       ═══════════════════════════════════════════ */}
   {showDiscovery && (
    <div className="px-4 md:px-8 lg:px-10 mb-8">
     <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
      {QUICK_SEARCHES.map((item) => (
       <button key={item.label} onClick={() => executeSearch(item.query)}
        className="shrink-0 px-4 py-2 rounded-full text-sm font-medium text-zinc-400 hover:text-white bg-zinc-900 border border-white/10 hover:bg-zinc-800 hover:border-white/20 transition-all active:scale-95 whitespace-nowrap">
        {item.label}
       </button>
      ))}
     </div>
    </div>
   )}

   {/* ═══════════════════════════════════════════
       ERROR STATE
       ═══════════════════════════════════════════ */}
   {error && (
    <div className="mx-4 md:mx-8 lg:mx-10 mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium flex items-center gap-3">
     <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
      <X size={16} className="text-red-400"/>
     </div>
     {error}
    </div>
   )}

   {/* ═══════════════════════════════════════════
       LOADING STATE
       ═══════════════════════════════════════════ */}
   <AnimatePresence mode="wait">
    {isSearching && (
     <motion.div key="loading"
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
      className="px-4 md:px-8 lg:px-10">
      <div className="flex flex-col items-center justify-center py-16">
       <div className="relative mb-5">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-end justify-center gap-[3px] p-4">
         {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="w-[3px] rounded-full bg-white eq-bar" style={{ height: '100%' }} />
         ))}
        </div>
       </div>
       <p className="text-base font-semibold text-white tracking-tight">Searching…</p>
       <p className="text-sm text-zinc-600 mt-1">Finding the best matches</p>
      </div>
      {/* Skeleton grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mt-2">
       {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="animate-pulse" style={{ animationDelay: `${i * 80}ms` }}>
         <div className="aspect-square rounded-xl bg-zinc-900 mb-3"/>
         <div className="h-3 w-3/4 rounded bg-zinc-900 mb-2"/>
         <div className="h-2.5 w-1/2 rounded bg-zinc-900/60"/>
        </div>
       ))}
      </div>
     </motion.div>
    )}

    {/* ═══════════════════════════════════════════
        SEARCH RESULTS
        ═══════════════════════════════════════════ */}
    {hasResults && (
     <motion.div key="results"
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="px-4 md:px-8 lg:px-10 pb-8">
      
      {/* Results header */}
      <div className="flex items-center justify-between mb-6">
       <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
         Results for "<span className="text-zinc-400">{query}</span>"
         <span className="text-xs font-mono text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded-md border border-white/5">{results.length}</span>
        </h2>
       </div>
       <div className="flex items-center gap-1 p-0.5 bg-zinc-900 border border-white/10 rounded-lg">
        <button onClick={() => setActiveView('grid')}
         className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${activeView === 'grid' ? 'bg-white/10 text-white' : 'text-zinc-600 hover:text-zinc-300'}`}>
         <LayoutGrid size={14} />
        </button>
        <button onClick={() => setActiveView('list')}
         className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${activeView === 'list' ? 'bg-white/10 text-white' : 'text-zinc-600 hover:text-zinc-300'}`}>
         <List size={14} />
        </button>
       </div>
      </div>

      {/* ── GRID VIEW ── */}
      {activeView === 'grid' && (
       <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
        {results.map((track, idx) => {
         const isCurrentlyPlaying = currentIndex === idx && queue[idx]?.id === track.id && isPlaying;
         const isLiked = (likedSongs || []).some(t => t.id === track.id);
         // First result gets featured styling on md+
         const isFeatured = idx === 0;

         return (
          <motion.div 
           key={track.id + idx}
           initial={{ opacity: 0, y: 16 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.3, delay: Math.min(idx * 0.03, 0.5) }}
           className={`group cursor-pointer ${isFeatured ? 'col-span-2 row-span-2' : ''}`}
           onClick={() => handlePlay(idx)}
          >
           {/* Featured card (first result, md+ only) */}
           {isFeatured ? (
            <div className="relative h-full">
             <div className={`relative w-full h-full min-h-[280px] rounded-2xl overflow-hidden border transition-all duration-300 ${isCurrentlyPlaying ? 'border-white/40' : 'border-white/10 group-hover:border-white/20'}`}>
              {track.coverArtUrl ? (
               <img src={track.coverArtUrl} alt={track.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" loading="lazy"/>
              ) : (
               <div className="w-full h-full flex items-center justify-center bg-zinc-900"><Music className="text-zinc-700 w-16 h-16"/></div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"/>
              {/* Featured badge */}
              <div className="absolute top-4 left-4 px-2.5 py-1 rounded-md bg-white/15 backdrop-blur-md border border-white/20 z-10">
               <span className="text-[10px] font-bold text-white uppercase tracking-wider">Top Match</span>
              </div>
              {/* Play overlay */}
              <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${isCurrentlyPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
               <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-black shadow-2xl">
                {isCurrentlyPlaying ? <Pause size={28} fill="currentColor"/> : <Play size={28} fill="currentColor" className="ml-1"/>}
               </div>
              </div>
              {/* Bottom info */}
              <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
               <h3 className="text-xl font-bold text-white tracking-tight truncate mb-1">{track.title}</h3>
               <p className="text-sm text-zinc-400 font-medium truncate">{track.artist}</p>
              </div>
              {/* Like */}
              <button
               className={`absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center z-10 transition-all active:scale-90 ${isLiked ? 'bg-white' : 'bg-black/40 backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100'}`}
               onClick={(e) => { e.stopPropagation(); toggleLikedSong(track); }}>
               <Heart size={16} className={isLiked ? 'text-black fill-black' : 'text-white'} />
              </button>
             </div>
            </div>
           ) : (
            /* Regular card */
            <div>
             <div className={`relative aspect-square rounded-xl overflow-hidden mb-2.5 border transition-all duration-300 ${isCurrentlyPlaying ? 'border-white/40 shadow-lg' : 'border-white/5 group-hover:border-white/15 bg-zinc-900'}`}>
              {track.coverArtUrl ? (
               <img src={track.coverArtUrl} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" loading="lazy"/>
              ) : (
               <div className="w-full h-full flex items-center justify-center bg-zinc-900"><Music className="text-zinc-700 w-8 h-8"/></div>
              )}
              {/* Hover overlay */}
              <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200 ${isCurrentlyPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
               <div className={`w-11 h-11 rounded-full bg-white flex items-center justify-center text-black shadow-xl transition-transform duration-200 ${isCurrentlyPlaying ? 'scale-100' : 'scale-90 group-hover:scale-100'}`}>
                {isCurrentlyPlaying ? <Pause size={18} fill="currentColor"/> : <Play size={18} fill="currentColor" className="ml-0.5"/>}
               </div>
              </div>
              {/* Rank badge */}
              {idx > 0 && idx <= 3 && (
               <div className="absolute top-2 left-2 w-6 h-6 rounded-md bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center border border-white/10 z-10">
                <span className="text-xs font-bold font-mono text-white">{idx + 1}</span>
               </div>
              )}
              {/* Like button */}
              <button
               className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center z-10 transition-all active:scale-90 ${isLiked ? 'bg-white scale-100' : 'bg-black/50 scale-0 group-hover:scale-100 border border-white/10'}`}
               onClick={(e) => { e.stopPropagation(); toggleLikedSong(track); }}>
               <Heart size={12} className={isLiked ? 'text-black fill-black' : 'text-white'} />
              </button>
              {/* Equalizer */}
              {isCurrentlyPlaying && (
               <div className="absolute bottom-2 left-2 flex items-end gap-[2px] h-3 z-10">
                {[0,1,2].map(i => <div key={i} className="w-[2px] rounded-full bg-white eq-bar" style={{ height: '100%' }} />)}
               </div>
              )}
              {/* Context menu */}
              <div className="hidden md:block absolute bottom-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
               <TrackContextMenu track={track} />
              </div>
             </div>
             <h3 className={`font-semibold truncate text-sm tracking-tight transition-colors ${isCurrentlyPlaying ? 'text-white' : 'text-zinc-200 group-hover:text-white'}`} title={track.title}>
              {track.title}
             </h3>
             <p className="text-xs text-zinc-600 font-medium truncate mt-0.5 group-hover:text-zinc-500 transition-colors" title={track.artist}>{track.artist}</p>
            </div>
           )}
          </motion.div>
         );
        })}

       </div>
      )}

      {/* ── LIST VIEW ── */}
      {activeView === 'list' && (
       <div>
        {/* Column headers */}
        <div className="hidden sm:flex items-center gap-4 px-4 py-2 text-[10px] font-semibold text-zinc-600 uppercase tracking-widest border-b border-white/5 mb-1">
         <div className="w-8 text-center">#</div>
         <div className="w-12 md:w-14">  </div>
         <div className="flex-1">Title</div>
         <div className="hidden md:block w-44">Artist</div>
         <div className="w-14 text-right"><Clock size={11}/></div>
         <div className="w-20"></div>
        </div>
        <div className="space-y-0.5">
         {results.map((track, idx) => {
          const isCurrentlyPlaying = currentIndex === idx && queue[idx]?.id === track.id && isPlaying;
          const isLiked = (likedSongs || []).some(t => t.id === track.id);
          return (
           <motion.div 
            key={track.id + idx}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.4) }}
            onClick={() => handlePlay(idx)}
            className={`group flex items-center gap-4 px-4 py-2 rounded-xl cursor-pointer transition-colors ${
             isCurrentlyPlaying ? 'bg-white/10' : 'hover:bg-white/[0.04]'
            }`}>
            {/* Number */}
            <div className="hidden sm:flex w-8 items-center justify-center shrink-0">
             {isCurrentlyPlaying ? (
              <div className="flex items-end gap-[2px] h-3.5">
               {[0,1,2].map(i => <div key={i} className="w-[2px] rounded-full bg-white eq-bar" style={{ height: '100%' }}/>)}
              </div>
             ) : (
              <span className={`text-sm font-mono font-medium ${idx < 3 ? 'text-zinc-300' : 'text-zinc-700'} group-hover:text-zinc-400 transition-colors`}>{idx + 1}</span>
             )}
            </div>
            {/* Cover */}
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden bg-zinc-900 shrink-0 relative border border-white/5">
             {track.coverArtUrl ? (
              <img src={track.coverArtUrl} alt={track.title} className="w-full h-full object-cover" loading="lazy"/>
             ) : (
              <div className="w-full h-full flex items-center justify-center"><Music size={16} className="text-zinc-700"/></div>
             )}
             <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${isCurrentlyPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              {isCurrentlyPlaying ? <Pause size={14} fill="white"/> : <Play size={14} fill="white" className="ml-0.5"/>}
             </div>
            </div>
            {/* Title + artist (mobile) */}
            <div className="flex-1 min-w-0">
             <p className={`font-medium text-sm truncate transition-colors ${isCurrentlyPlaying ? 'text-white' : 'text-zinc-200 group-hover:text-white'}`}>{track.title}</p>
             <p className="text-xs text-zinc-600 truncate mt-0.5 md:hidden">{track.artist}</p>
            </div>
            {/* Artist (desktop) */}
            <span className="hidden md:block w-44 text-sm text-zinc-600 truncate group-hover:text-zinc-400 transition-colors">{track.artist}</span>
            {/* Duration */}
            <span className="hidden sm:block w-14 text-right text-xs font-mono text-zinc-700 group-hover:text-zinc-500 transition-colors">{formatDuration(track.duration || 0)}</span>
            {/* Actions */}
            <div className="flex items-center gap-1 w-20 justify-end">
             <button className="w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-90"
              onClick={(e) => { e.stopPropagation(); toggleLikedSong(track); }}>
              <Heart size={14} className={isLiked ? 'fill-white text-white' : 'text-zinc-700 group-hover:text-zinc-400'} />
             </button>
             <div onClick={e => e.stopPropagation()} className="opacity-0 group-hover:opacity-100 transition-opacity">
              <TrackContextMenu track={track} />
             </div>
            </div>
           </motion.div>
          );
         })}
        </div>
       </div>
      )}
     </motion.div>
    )}

    {/* ═══════════════════════════════════════════
        BROWSE GENRES — Asymmetric bento grid
        ═══════════════════════════════════════════ */}
    {showDiscovery && (
     <motion.div key="discovery"
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      className="px-4 md:px-8 lg:px-10 pb-12">
      <h2 className="text-lg font-bold text-white tracking-tight mb-5">
       Browse genres
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
       {BROWSE_GENRES.map((genre, idx) => (
        <motion.div
         key={genre.name}
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.35, delay: idx * 0.04 }}
         onClick={() => executeSearch(genre.name)}
         className={`relative overflow-hidden rounded-2xl cursor-pointer group border border-white/5 ${genre.accentBorder} transition-all duration-300 ${
          genre.size === 'tall' ? 'row-span-2 h-auto min-h-[160px] md:min-h-[200px]' : 'h-32 md:h-36'
         }`}>
         {/* Background image */}
         <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105">
          <ArtImage 
           artist={genre.artist}
           album={genre.album}
           type="genre"
           fallbackGradient={genre.accent}
           className="w-full h-full object-cover"
          />
          {/* Genre accent overlay */}
          <div className={`absolute inset-0 bg-gradient-to-br ${genre.accent} opacity-60`} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"/>
         </div>
         
         {/* Content */}
         <div className="absolute inset-0 p-4 flex flex-col justify-end z-10">
          <h3 className="text-base md:text-lg font-bold text-white drop-shadow-md tracking-tight leading-tight">{genre.name}</h3>
          <p className="text-[11px] text-zinc-300/80 font-medium mt-0.5 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200">{genre.description}</p>
         </div>
         
         {/* Play button on hover */}
         <div className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-200 border border-white/20 z-10">
          <Play size={14} fill="white" className="text-white ml-0.5"/>
         </div>
        </motion.div>
       ))}
      </div>
     </motion.div>
    )}
   </AnimatePresence>
  </div>
 );
}
