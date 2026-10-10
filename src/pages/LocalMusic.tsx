import { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Upload, Play, Music, Trash2, FolderOpen, ListMusic, 
  Plus, Heart, Clock, Search, X, HardDrive, ArrowRight,
  Shuffle, Disc3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../lib/db';
import { parseID3Tags } from '../lib/id3';
import { useAudioStore } from '../store/useAudioStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { TrackContextMenu } from '../components/ui/TrackContextMenu';
import { CreatePlaylistModal } from '../components/ui/CreatePlaylistModal';
import { PlaylistContextMenu } from '../components/ui/PlaylistContextMenu';
import type { Track, Playlist as PlaylistType } from '../types';

type LibraryTab = 'all' | 'playlists' | 'liked' | 'recent' | 'local';

function getAudioFileDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const audio = document.createElement('audio');
    const url = URL.createObjectURL(file);
    audio.preload = 'metadata';
    audio.src = url;
    audio.onloadedmetadata = () => {
      const dur = audio.duration;
      URL.revokeObjectURL(url);
      resolve(dur && !isNaN(dur) ? Math.round(dur) : 0);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
  });
}

export function LocalMusic() {
  const [activeTab, setActiveTab] = useState<LibraryTab>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localTracks, setLocalTracks] = useState<Track[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { 
    setQueue, 
    playTrack, 
    queue, 
    isPlaying, 
    currentIndex, 
    play, 
    pause, 
    playlists: rawPlaylists,
    likedSongs: rawLiked,
    recentSongs: rawRecent,
    toggleLikedSong,
    isShuffled
  } = useAudioStore();

  const playlists = useMemo(() => Array.isArray(rawPlaylists) ? rawPlaylists : [], [rawPlaylists]);
  const likedSongs = useMemo(() => Array.isArray(rawLiked) ? rawLiked : [], [rawLiked]);
  const recentSongs = useMemo(() => Array.isArray(rawRecent) ? rawRecent : [], [rawRecent]);

  useEffect(() => {
    db.loadAllLocalTracks()
      .then(tracks => setLocalTracks(tracks))
      .catch(e => console.error("Failed to load tracks", e));
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsImporting(true);
    const newTracks: Track[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('audio/')) continue;

      try {
        const metadata = await parseID3Tags(file);
        const { filterShortTracks, extractCoverArt } = useSettingsStore.getState();
        const duration = await getAudioFileDuration(file);

        // Skip ringtones or voice clips shorter than 30s when enabled
        if (filterShortTracks && duration > 0 && duration < 30) {
          continue;
        }

        const trackMetadata = {
          id: crypto.randomUUID(),
          title: metadata.title,
          artist: metadata.artist,
          coverArtUrl: extractCoverArt ? metadata.coverArtUrl : undefined,
          duration: duration || undefined,
        };
        const savedTrack = await db.saveTrack(file, trackMetadata);
        newTracks.push(savedTrack);
      } catch (err) {
        console.error("Error processing file", file.name, err);
      }
    }

    setLocalTracks(prev => [...prev, ...newTracks]);
    setIsImporting(false);

    if (fileInputRef.current) fileInputRef.current.value = '';
    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  const handlePlayQueue = (trackList: Track[], index: number) => {
    if (trackList.length === 0) return;
    const isSameQueue = queue.length === trackList.length && queue[0]?.id === trackList[0]?.id;
    if (!isSameQueue) {
      setQueue(trackList);
    }

    if (currentIndex === index && isPlaying && isSameQueue) {
      pause();
    } else if (currentIndex === index && !isPlaying && isSameQueue) {
      play();
    } else {
      playTrack(index);
    }
  };

  const handleShuffleQueue = (trackList: Track[], e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (trackList.length === 0) return;
    const randomIndex = Math.floor(Math.random() * trackList.length);
    const indices = Array.from({ length: trackList.length }, (_, i) => i);
    indices.splice(randomIndex, 1);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    indices.unshift(randomIndex);

    useAudioStore.setState({
      queue: trackList,
      currentIndex: randomIndex,
      isShuffled: true,
      shuffleOrder: indices,
      isPlaying: true
    });
  };

  const handlePlayPlaylist = (playlist: PlaylistType, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (playlist.tracks.length === 0) return;
    setQueue(playlist.tracks);
    playTrack(0);
  };

  const clearAllLocal = async () => {
    if (confirm("Remove all local tracks from your device cache?")) {
      await db.clearLocalTracks();
      setLocalTracks([]);
    }
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds || isNaN(seconds)) return '';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Filtered lists based on search
  const isSearching = searchQuery.trim().length > 0;

  const filteredPlaylists = useMemo(() => {
    if (!isSearching) return playlists;
    const q = searchQuery.toLowerCase();
    return playlists.filter(p => p.name.toLowerCase().includes(q));
  }, [playlists, searchQuery, isSearching]);

  const filteredLiked = useMemo(() => {
    if (!isSearching) return likedSongs;
    const q = searchQuery.toLowerCase();
    return likedSongs.filter(t => t.title.toLowerCase().includes(q) || t.artist?.toLowerCase().includes(q));
  }, [likedSongs, searchQuery, isSearching]);

  const filteredRecent = useMemo(() => {
    if (!isSearching) return recentSongs;
    const q = searchQuery.toLowerCase();
    return recentSongs.filter(t => t.title.toLowerCase().includes(q) || t.artist?.toLowerCase().includes(q));
  }, [recentSongs, searchQuery, isSearching]);

  const filteredLocal = useMemo(() => {
    if (!isSearching) return localTracks;
    const q = searchQuery.toLowerCase();
    return localTracks.filter(t => t.title.toLowerCase().includes(q) || t.artist?.toLowerCase().includes(q));
  }, [localTracks, searchQuery, isSearching]);

  const totalSearchMatches = 
    filteredPlaylists.length + 
    filteredLiked.length + 
    filteredRecent.length + 
    filteredLocal.length;

  // Tab count indicators
  const tabs = [
    { id: 'all' as LibraryTab, label: 'All', count: null },
    { id: 'playlists' as LibraryTab, label: 'Playlists', count: playlists.length },
    { id: 'liked' as LibraryTab, label: 'Liked', count: likedSongs.length },
    { id: 'recent' as LibraryTab, label: 'Recent', count: recentSongs.length },
    { id: 'local' as LibraryTab, label: 'Local', count: localTracks.length },
  ];

  // Memoized cover art & playback helpers for Hub Cards preview
  const likedCovers = useMemo(() => {
    return likedSongs.filter(t => Boolean(t.coverArtUrl)).slice(0, 3);
  }, [likedSongs]);

  const recentCoverTrack = useMemo(() => {
    return recentSongs.find(t => Boolean(t.coverArtUrl)) || recentSongs[0];
  }, [recentSongs]);

  const playlistCoverTrack = useMemo(() => {
    return playlists
      .flatMap(p => p?.tracks || [])
      .find(t => Boolean(t?.coverArtUrl));
  }, [playlists]);

  const isLikedPlaying = useMemo(() => {
    return isPlaying && likedSongs.some(t => t.id === queue[currentIndex]?.id);
  }, [isPlaying, likedSongs, queue, currentIndex]);

  const isRecentPlaying = useMemo(() => {
    return isPlaying && recentSongs.some(t => t.id === queue[currentIndex]?.id);
  }, [isPlaying, recentSongs, queue, currentIndex]);

  return (
    <div className="min-h-full bg-[#070709] pb-2 md:pb-4 relative">
      {/* ─────────────────────────────────────────────
          STICKY TOP BAR — Title & Actions
          ───────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-[#070709]/95 backdrop-blur-2xl border-b border-white/[0.06] px-4 md:px-8 py-3.5 shadow-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* Header Title & Stats */}
          <div className="min-w-0">
            <h1 className="text-xl md:text-3xl font-black text-white tracking-tight leading-tight">
              Library
            </h1>
            <p className="text-[11px] md:text-xs font-medium text-zinc-500 truncate mt-0.5">
              {playlists.length} playlists • {likedSongs.length} liked • {localTracks.length} local
            </p>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
            {/* Search Toggle Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setIsSearchOpen(prev => !prev);
                if (!isSearchOpen) {
                  setTimeout(() => searchInputRef.current?.focus(), 60);
                } else {
                  setSearchQuery('');
                }
              }}
              aria-label="Search within library"
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                isSearchOpen || isSearching 
                  ? 'bg-white text-zinc-950 shadow-md ring-2 ring-white/20' 
                  : 'bg-white/[0.06] hover:bg-white/10 text-zinc-300 hover:text-white border border-white/5'
              }`}
            >
              <Search size={16} />
            </motion.button>

            {/* Create Playlist Button */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setIsModalOpen(true)}
              aria-label="Create new playlist"
              className="flex items-center gap-1.5 px-3 md:px-4 h-9 rounded-full bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-all duration-150 shadow-md"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span className="hidden sm:inline">New Playlist</span>
            </motion.button>

            {/* Import Button (Local Files) */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              aria-label="Import local audio files"
              className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/10 text-zinc-300 hover:text-white border border-white/5 flex items-center justify-center transition-all duration-150 disabled:opacity-50"
              title="Import local files"
            >
              <Upload size={15} />
            </motion.button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────
            INLINE SEARCH BAR (Expands on Search Click)
            ───────────────────────────────────────────── */}
        <AnimatePresence>
          {(isSearchOpen || isSearching) && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="max-w-6xl mx-auto overflow-hidden pt-3 pb-1"
            >
              <div className="relative flex items-center">
                <Search size={15} className="absolute left-3.5 text-zinc-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search library by song, artist, playlist, or file..."
                  className="w-full bg-zinc-900/95 border border-white/15 rounded-xl pl-9 pr-9 py-2 text-xs md:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all shadow-inner"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-3 w-6 h-6 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─────────────────────────────────────────────
            FILTER CHIPS (Horizontal Scroll Bar)
            ───────────────────────────────────────────── */}
        {!isSearching && (
          <div className="max-w-6xl mx-auto pt-3">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 -mx-4 px-4 md:mx-0 md:px-0">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab(tab.id)}
                    className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-white text-zinc-950 shadow-md'
                        : 'bg-zinc-900/80 hover:bg-zinc-850 text-zinc-400 hover:text-white border border-white/5'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.count !== null && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive ? 'bg-zinc-950/15 text-zinc-950' : 'bg-white/5 text-zinc-400'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────
          MAIN CONTENT AREA
          ───────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-5">
        
        {/* ═══════════════════════════════════════════
            MODE: LIVE SEARCH RESULTS (When Searching)
            ═══════════════════════════════════════════ */}
        {isSearching ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Search size={16} className="text-zinc-400" />
                <span className="text-sm font-bold text-white">Results for "{searchQuery}"</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">
                  {totalSearchMatches} matches
                </span>
              </div>
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-zinc-400 hover:text-white transition-colors"
              >
                Clear search
              </button>
            </div>

            {totalSearchMatches === 0 ? (
              <div className="text-center py-20 px-4 rounded-3xl bg-zinc-900/40 border border-white/5">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 mb-4">
                  <Search size={24} />
                </div>
                <h3 className="text-base font-bold text-white mb-1">No matches found</h3>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto mb-5">
                  No tracks or playlists matching "{searchQuery}" in your library.
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 rounded-full bg-white text-zinc-950 text-xs font-bold hover:bg-zinc-200 transition-all shadow-md"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <div className="space-y-7">
                {/* Playlists matches */}
                {filteredPlaylists.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                      <ListMusic size={14} className="text-amber-400" />
                      Playlists ({filteredPlaylists.length})
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {filteredPlaylists.map(p => (
                        <PlaylistCard 
                          key={p.id} 
                          playlist={p} 
                          onPlay={handlePlayPlaylist}
                          onShuffle={(pl, e) => handleShuffleQueue(pl.tracks, e)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Liked songs matches */}
                {filteredLiked.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                      <Heart size={14} className="text-rose-400" fill="currentColor" />
                      Liked Songs ({filteredLiked.length})
                    </h3>
                    <div className="divide-y divide-white/[0.04] bg-zinc-900/40 rounded-2xl border border-white/5 overflow-hidden">
                      {filteredLiked.map((track, idx) => (
                        <TrackRow
                          key={track.id + idx}
                          track={track}
                          index={idx}
                          isPlaying={queue[currentIndex]?.id === track.id && isPlaying}
                          onPlay={() => handlePlayQueue(filteredLiked, idx)}
                          isLiked={true}
                          onToggleLike={() => toggleLikedSong(track)}
                          formatDuration={formatDuration}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent matches */}
                {filteredRecent.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                      <Clock size={14} className="text-indigo-400" />
                      Recently Played ({filteredRecent.length})
                    </h3>
                    <div className="divide-y divide-white/[0.04] bg-zinc-900/40 rounded-2xl border border-white/5 overflow-hidden">
                      {filteredRecent.map((track, idx) => (
                        <TrackRow
                          key={track.id + idx}
                          track={track}
                          index={idx}
                          isPlaying={queue[currentIndex]?.id === track.id && isPlaying}
                          onPlay={() => handlePlayQueue(filteredRecent, idx)}
                          isLiked={likedSongs.some(t => t.id === track.id)}
                          onToggleLike={() => toggleLikedSong(track)}
                          formatDuration={formatDuration}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Local matches */}
                {filteredLocal.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                      <HardDrive size={14} className="text-emerald-400" />
                      Local Device Files ({filteredLocal.length})
                    </h3>
                    <div className="divide-y divide-white/[0.04] bg-zinc-900/40 rounded-2xl border border-white/5 overflow-hidden">
                      {filteredLocal.map((track, idx) => (
                        <TrackRow
                          key={track.id + idx}
                          track={track}
                          index={idx}
                          isPlaying={queue[currentIndex]?.id === track.id && isPlaying}
                          onPlay={() => handlePlayQueue(filteredLocal, idx)}
                          isLiked={likedSongs.some(t => t.id === track.id)}
                          onToggleLike={() => toggleLikedSong(track)}
                          formatDuration={formatDuration}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ═══════════════════════════════════════════
              REGULAR TABS (When Not Searching)
              ═══════════════════════════════════════════ */
          <div>
            {/* ─────────────────────────────────────────
                TAB: ALL (Overview with 4 Hub Cards)
                ───────────────────────────────────────── */}
            {activeTab === 'all' && (
              <div className="space-y-8">
                {/* ─────────────────────────────────────────────
                    4 PINNED LIBRARY HUB CARDS (Tactile Glass Bento)
                    ───────────────────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                  {/* Hub 1: Liked Songs (Obsidian Glass + Velvet Ruby Aura) */}
                  <motion.div
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => setActiveTab('liked')}
                    className="group relative cursor-pointer rounded-2xl md:rounded-[1.4rem] p-[1px] bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-transparent hover:from-rose-500/30 hover:via-white/10 hover:to-transparent transition-all duration-300 shadow-lg hover:shadow-rose-950/20 hover:shadow-2xl overflow-hidden"
                  >
                    <div className="relative h-full w-full rounded-[calc(1rem-1px)] md:rounded-[calc(1.4rem-1px)] bg-[#0b0b10]/90 backdrop-blur-xl p-3.5 sm:p-4 md:p-5 flex flex-col justify-between overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] min-h-[148px] md:min-h-[168px]">
                      {/* Subtle Atmospheric Ruby Glow */}
                      <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-rose-500/20 group-hover:scale-125 transition-all duration-500" />
                      
                      {/* Top Row: Visual Art / Badge & Action Capsule */}
                      <div className="relative z-10 flex items-start justify-between gap-2">
                        {/* Visual Anchor: Real Album Stack or Ruby Emblem */}
                        <div className="relative flex items-center">
                          {likedCovers.length >= 2 ? (
                            <div className="relative w-11 h-11 shrink-0">
                              {/* Back Stacked Cover */}
                              <img 
                                src={likedCovers[1].coverArtUrl} 
                                alt="" 
                                className="absolute top-0 right-0 w-8 h-8 rounded-lg object-cover rotate-6 opacity-60 border border-white/10 shadow-sm" 
                              />
                              {/* Front Stacked Cover */}
                              <img 
                                src={likedCovers[0].coverArtUrl} 
                                alt="" 
                                className="absolute bottom-0 left-0 w-9 h-9 rounded-xl object-cover -rotate-3 border border-white/20 shadow-md group-hover:rotate-0 transition-transform duration-300" 
                              />
                              {/* Mini Floating Heart Badge */}
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md ring-2 ring-[#0b0b10]">
                                <Heart size={10} fill="currentColor" />
                              </div>
                            </div>
                          ) : likedCovers.length === 1 ? (
                            <div className="relative w-11 h-11 shrink-0">
                              <img 
                                src={likedCovers[0].coverArtUrl} 
                                alt="" 
                                className="w-11 h-11 rounded-xl object-cover border border-white/15 shadow-md group-hover:scale-105 transition-transform duration-300" 
                              />
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md ring-2 ring-[#0b0b10]">
                                <Heart size={10} fill="currentColor" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-rose-500/15 via-rose-500/5 to-transparent border border-rose-500/25 flex items-center justify-center text-rose-400 shadow-[inset_0_1px_1px_rgba(244,63,94,0.2)] group-hover:scale-105 transition-transform duration-300">
                              <Heart size={18} fill="currentColor" className="drop-shadow-sm" />
                            </div>
                          )}
                        </div>

                        {/* Action Controls: Nested Glass Capsule */}
                        {likedSongs.length > 0 && (
                          <div 
                            onClick={(e) => e.stopPropagation()} 
                            className="flex items-center gap-1 p-1 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md shadow-inner"
                          >
                            <button
                              onClick={(e) => handleShuffleQueue(likedSongs, e)}
                              title="Shuffle play liked songs"
                              aria-label="Shuffle liked songs"
                              className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 active:scale-[0.96] transition-all duration-150"
                            >
                              <Shuffle size={12} className={isShuffled ? 'text-rose-400' : ''} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlayQueue(likedSongs, 0);
                              }}
                              title="Play liked songs"
                              aria-label="Play liked songs"
                              className="w-7 h-7 rounded-full bg-white text-zinc-950 flex items-center justify-center hover:bg-zinc-200 active:scale-[0.96] shadow-md transition-all duration-150"
                            >
                              {isLikedPlaying ? (
                                <div className="flex items-end justify-center gap-0.5 h-2.5">
                                  <span className="w-0.5 bg-zinc-950 rounded-full eq-bar" style={{ height: '100%' }} />
                                  <span className="w-0.5 bg-zinc-950 rounded-full eq-bar" style={{ height: '60%', animationDelay: '0.15s' }} />
                                  <span className="w-0.5 bg-zinc-950 rounded-full eq-bar" style={{ height: '85%', animationDelay: '0.3s' }} />
                                </div>
                              ) : (
                                <Play size={12} fill="currentColor" className="ml-0.5" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Bottom: Clean Editorial Typography */}
                      <div className="relative z-10 pt-3">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400/80 font-bold block mb-0.5">
                          Favorites
                        </span>
                        <h3 className="font-bold text-sm sm:text-base text-white tracking-tight leading-snug group-hover:text-rose-100 transition-colors">
                          Liked Songs
                        </h3>
                        <p className="text-[11px] sm:text-xs font-mono text-zinc-400 mt-0.5">
                          {likedSongs.length} {likedSongs.length === 1 ? 'track' : 'tracks'}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Hub 2: Recent Tracks (Obsidian Glass + Twilight Indigo Aura) */}
                  <motion.div
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => setActiveTab('recent')}
                    className="group relative cursor-pointer rounded-2xl md:rounded-[1.4rem] p-[1px] bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-transparent hover:from-indigo-500/30 hover:via-white/10 hover:to-transparent transition-all duration-300 shadow-lg hover:shadow-indigo-950/20 hover:shadow-2xl overflow-hidden"
                  >
                    <div className="relative h-full w-full rounded-[calc(1rem-1px)] md:rounded-[calc(1.4rem-1px)] bg-[#0b0b10]/90 backdrop-blur-xl p-3.5 sm:p-4 md:p-5 flex flex-col justify-between overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] min-h-[148px] md:min-h-[168px]">
                      {/* Subtle Atmospheric Indigo Glow */}
                      <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/20 group-hover:scale-125 transition-all duration-500" />
                      
                      {/* Top Row: Visual Art / Badge & Action Capsule */}
                      <div className="relative z-10 flex items-start justify-between gap-2">
                        {/* Visual Anchor: Latest Track Art or Twilight Clock */}
                        <div className="relative flex items-center">
                          {recentCoverTrack?.coverArtUrl ? (
                            <div className="relative w-11 h-11 shrink-0">
                              <img 
                                src={recentCoverTrack.coverArtUrl} 
                                alt="" 
                                className="w-11 h-11 rounded-xl object-cover border border-white/15 shadow-md group-hover:scale-105 transition-transform duration-300" 
                              />
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-md ring-2 ring-[#0b0b10]">
                                <Clock size={10} />
                              </div>
                            </div>
                          ) : (
                            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-indigo-500/15 via-indigo-500/5 to-transparent border border-indigo-500/25 flex items-center justify-center text-indigo-400 shadow-[inset_0_1px_1px_rgba(99,102,241,0.2)] group-hover:scale-105 transition-transform duration-300">
                              <Clock size={18} className="drop-shadow-sm" />
                            </div>
                          )}
                        </div>

                        {/* Action Controls: Nested Glass Capsule */}
                        {recentSongs.length > 0 && (
                          <div 
                            onClick={(e) => e.stopPropagation()} 
                            className="flex items-center gap-1 p-1 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md shadow-inner"
                          >
                            <button
                              onClick={(e) => handleShuffleQueue(recentSongs, e)}
                              title="Shuffle play recent songs"
                              aria-label="Shuffle recent songs"
                              className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 active:scale-[0.96] transition-all duration-150"
                            >
                              <Shuffle size={12} className={isShuffled ? 'text-indigo-400' : ''} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlayQueue(recentSongs, 0);
                              }}
                              title="Play recent songs"
                              aria-label="Play recent songs"
                              className="w-7 h-7 rounded-full bg-white text-zinc-950 flex items-center justify-center hover:bg-zinc-200 active:scale-[0.96] shadow-md transition-all duration-150"
                            >
                              {isRecentPlaying ? (
                                <div className="flex items-end justify-center gap-0.5 h-2.5">
                                  <span className="w-0.5 bg-zinc-950 rounded-full eq-bar" style={{ height: '100%' }} />
                                  <span className="w-0.5 bg-zinc-950 rounded-full eq-bar" style={{ height: '60%', animationDelay: '0.15s' }} />
                                  <span className="w-0.5 bg-zinc-950 rounded-full eq-bar" style={{ height: '85%', animationDelay: '0.3s' }} />
                                </div>
                              ) : (
                                <Play size={12} fill="currentColor" className="ml-0.5" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Bottom: Clean Editorial Typography */}
                      <div className="relative z-10 pt-3">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400/80 font-bold block mb-0.5">
                          History
                        </span>
                        <h3 className="font-bold text-sm sm:text-base text-white tracking-tight leading-snug group-hover:text-indigo-100 transition-colors">
                          Recent Tracks
                        </h3>
                        <p className="text-[11px] sm:text-xs font-mono text-zinc-400 mt-0.5 truncate">
                          {recentSongs.length > 0 && recentSongs[0]?.title 
                            ? recentSongs[0].title 
                            : `${recentSongs.length} ${recentSongs.length === 1 ? 'song' : 'songs'}`}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Hub 3: Playlists (Obsidian Glass + Warm Amber Aura) */}
                  <motion.div
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => setActiveTab('playlists')}
                    className="group relative cursor-pointer rounded-2xl md:rounded-[1.4rem] p-[1px] bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-transparent hover:from-amber-500/30 hover:via-white/10 hover:to-transparent transition-all duration-300 shadow-lg hover:shadow-amber-950/20 hover:shadow-2xl overflow-hidden"
                  >
                    <div className="relative h-full w-full rounded-[calc(1rem-1px)] md:rounded-[calc(1.4rem-1px)] bg-[#0b0b10]/90 backdrop-blur-xl p-3.5 sm:p-4 md:p-5 flex flex-col justify-between overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] min-h-[148px] md:min-h-[168px]">
                      {/* Subtle Atmospheric Amber Glow */}
                      <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/20 group-hover:scale-125 transition-all duration-500" />
                      
                      {/* Top Row: Visual Art / Badge & Action Button */}
                      <div className="relative z-10 flex items-start justify-between gap-2">
                        {/* Visual Anchor: Playlist Art or Amber Badge */}
                        <div className="relative flex items-center">
                          {playlistCoverTrack?.coverArtUrl ? (
                            <div className="relative w-11 h-11 shrink-0">
                              <img 
                                src={playlistCoverTrack.coverArtUrl} 
                                alt="" 
                                className="w-11 h-11 rounded-xl object-cover border border-white/15 shadow-md group-hover:scale-105 transition-transform duration-300" 
                              />
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center shadow-md ring-2 ring-[#0b0b10]">
                                <ListMusic size={10} />
                              </div>
                            </div>
                          ) : (
                            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/25 flex items-center justify-center text-amber-400 shadow-[inset_0_1px_1px_rgba(245,158,11,0.2)] group-hover:scale-105 transition-transform duration-300">
                              <ListMusic size={18} className="drop-shadow-sm" />
                            </div>
                          )}
                        </div>

                        {/* Action: Refined + New Pill */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsModalOpen(true);
                          }}
                          aria-label="Create new playlist"
                          title="Create new playlist"
                          className="w-7 h-7 sm:w-auto sm:px-2.5 sm:h-7.5 flex items-center justify-center gap-1 rounded-full bg-white/[0.05] hover:bg-white text-zinc-300 hover:text-zinc-950 border border-white/10 hover:border-transparent text-[11px] font-semibold transition-all duration-150 active:scale-[0.96] shadow-sm"
                        >
                          <Plus size={13} strokeWidth={2.2} />
                          <span className="hidden sm:inline">New</span>
                        </button>
                      </div>

                      {/* Bottom: Clean Editorial Typography */}
                      <div className="relative z-10 pt-3">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400/80 font-bold block mb-0.5">
                          Curated
                        </span>
                        <h3 className="font-bold text-sm sm:text-base text-white tracking-tight leading-snug group-hover:text-amber-100 transition-colors">
                          Playlists
                        </h3>
                        <p className="text-[11px] sm:text-xs font-mono text-zinc-400 mt-0.5">
                          {playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Hub 4: Local Device (Obsidian Glass + Precision Emerald Aura) */}
                  <motion.div
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => setActiveTab('local')}
                    className="group relative cursor-pointer rounded-2xl md:rounded-[1.4rem] p-[1px] bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-transparent hover:from-emerald-500/30 hover:via-white/10 hover:to-transparent transition-all duration-300 shadow-lg hover:shadow-emerald-950/20 hover:shadow-2xl overflow-hidden"
                  >
                    <div className="relative h-full w-full rounded-[calc(1rem-1px)] md:rounded-[calc(1.4rem-1px)] bg-[#0b0b10]/90 backdrop-blur-xl p-3.5 sm:p-4 md:p-5 flex flex-col justify-between overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] min-h-[148px] md:min-h-[168px]">
                      {/* Subtle Atmospheric Emerald Glow */}
                      <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/20 group-hover:scale-125 transition-all duration-500" />
                      
                      {/* Top Row: Visual Art / Badge & Action Button */}
                      <div className="relative z-10 flex items-start justify-between gap-2">
                        {/* Visual Anchor: Precision Hardware Badge with Live LED */}
                        <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-500/25 flex items-center justify-center text-emerald-400 shadow-[inset_0_1px_1px_rgba(16,185,129,0.2)] group-hover:scale-105 transition-transform duration-300">
                          <HardDrive size={18} className="drop-shadow-sm" />
                          {/* Pulsing Active Hardware LED */}
                          <span className="absolute top-1 right-1 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                          </span>
                        </div>

                        {/* Action: Refined Upload/Import Pill */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                          aria-label="Import audio files"
                          title="Import local files"
                          className="w-7 h-7 sm:w-auto sm:px-2.5 sm:h-7.5 flex items-center justify-center gap-1 rounded-full bg-white/[0.05] hover:bg-white text-zinc-300 hover:text-zinc-950 border border-white/10 hover:border-transparent text-[11px] font-semibold transition-all duration-150 active:scale-[0.96] shadow-sm"
                        >
                          <Upload size={12} strokeWidth={2.2} />
                          <span className="hidden sm:inline">Import</span>
                        </button>
                      </div>

                      {/* Bottom: Clean Editorial Typography */}
                      <div className="relative z-10 pt-3">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400/80 font-bold block mb-0.5">
                          Vault
                        </span>
                        <h3 className="font-bold text-sm sm:text-base text-white tracking-tight leading-snug group-hover:text-emerald-100 transition-colors">
                          Local Device
                        </h3>
                        <p className="text-[11px] sm:text-xs font-mono text-zinc-400 mt-0.5">
                          {localTracks.length} {localTracks.length === 1 ? 'file' : 'files'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Section: Playlists Preview */}
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base md:text-lg font-bold text-white tracking-tight">Your Playlists</h2>
                      <span className="text-xs font-mono text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full">
                        {playlists.length}
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveTab('playlists')}
                      className="text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <span>See all</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>

                  {playlists.length === 0 ? (
                    <motion.div 
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsModalOpen(true)}
                      className="cursor-pointer p-5 rounded-2xl bg-zinc-900/40 hover:bg-zinc-900/70 border border-dashed border-white/10 flex items-center gap-4 transition-all group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:bg-white/10 transition-colors shrink-0">
                        <Plus size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white group-hover:underline">Create your first playlist</p>
                        <p className="text-xs text-zinc-500">Collect and organize your favorite songs</p>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                      {playlists.slice(0, 5).map((playlist) => (
                        <PlaylistCard 
                          key={playlist.id} 
                          playlist={playlist} 
                          onPlay={handlePlayPlaylist}
                          onShuffle={(pl, e) => handleShuffleQueue(pl.tracks, e)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Section: Recently Played Preview */}
                {recentSongs.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="flex items-center gap-2">
                        <h2 className="text-base md:text-lg font-bold text-white tracking-tight">Recently Played</h2>
                        <span className="text-xs font-mono text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full">
                          {recentSongs.length}
                        </span>
                      </div>
                      <button
                        onClick={() => setActiveTab('recent')}
                        className="text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        <span>See all</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>

                    <div className="divide-y divide-white/[0.04] bg-zinc-900/40 rounded-2xl border border-white/5 overflow-hidden">
                      {recentSongs.slice(0, 5).map((track, idx) => (
                        <TrackRow
                          key={track.id + idx}
                          track={track}
                          index={idx}
                          isPlaying={queue[currentIndex]?.id === track.id && isPlaying}
                          onPlay={() => handlePlayQueue(recentSongs, idx)}
                          isLiked={likedSongs.some(t => t.id === track.id)}
                          onToggleLike={() => toggleLikedSong(track)}
                          formatDuration={formatDuration}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Section: Liked Songs Preview */}
                {likedSongs.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="flex items-center gap-2">
                        <h2 className="text-base md:text-lg font-bold text-white tracking-tight">Liked Songs</h2>
                        <span className="text-xs font-mono text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full">
                          {likedSongs.length}
                        </span>
                      </div>
                      <button
                        onClick={() => setActiveTab('liked')}
                        className="text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        <span>See all</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>

                    <div className="divide-y divide-white/[0.04] bg-zinc-900/40 rounded-2xl border border-white/5 overflow-hidden">
                      {likedSongs.slice(0, 5).map((track, idx) => (
                        <TrackRow
                          key={track.id + idx}
                          track={track}
                          index={idx}
                          isPlaying={queue[currentIndex]?.id === track.id && isPlaying}
                          onPlay={() => handlePlayQueue(likedSongs, idx)}
                          isLiked={true}
                          onToggleLike={() => toggleLikedSong(track)}
                          formatDuration={formatDuration}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─────────────────────────────────────────
                TAB: PLAYLISTS
                ───────────────────────────────────────── */}
            {activeTab === 'playlists' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg md:text-xl font-bold text-white">Your Playlists</h2>
                    <p className="text-xs text-zinc-500">{playlists.length} playlists created</p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-all shadow-md"
                  >
                    <Plus size={14} strokeWidth={2.5} />
                    <span>Create Playlist</span>
                  </motion.button>
                </div>

                {playlists.length === 0 ? (
                  <div className="text-center py-20 px-4 rounded-3xl bg-zinc-900/40 border border-white/5">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 mb-4">
                      <ListMusic size={26} />
                    </div>
                    <h3 className="text-base font-bold text-white mb-1">No playlists yet</h3>
                    <p className="text-xs text-zinc-500 max-w-xs mx-auto mb-5">
                      Create your first playlist to organize your music collection.
                    </p>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="px-5 py-2.5 rounded-full bg-white text-zinc-950 text-xs font-bold hover:bg-zinc-200 transition-all shadow-md"
                    >
                      Create Playlist
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 md:gap-4">
                    {playlists.map((playlist) => (
                      <PlaylistCard 
                        key={playlist.id} 
                        playlist={playlist} 
                        onPlay={handlePlayPlaylist}
                        onShuffle={(pl, e) => handleShuffleQueue(pl.tracks, e)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ─────────────────────────────────────────
                TAB: LIKED SONGS
                ───────────────────────────────────────── */}
            {activeTab === 'liked' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                      <Heart size={18} className="text-rose-400" fill="currentColor" />
                      <span>Liked Songs</span>
                    </h2>
                    <p className="text-xs text-zinc-500">{likedSongs.length} tracks</p>
                  </div>

                  {likedSongs.length > 0 && (
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => handleShuffleQueue(likedSongs, e)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-bold transition-all shadow-sm ${
                          isShuffled 
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
                            : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                        }`}
                      >
                        <Shuffle size={13} />
                        <span>Shuffle</span>
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handlePlayQueue(likedSongs, 0)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-all shadow-md"
                      >
                        <Play size={13} fill="currentColor" />
                        <span>Play All</span>
                      </motion.button>
                    </div>
                  )}
                </div>

                {likedSongs.length === 0 ? (
                  <div className="text-center py-20 px-4 rounded-3xl bg-zinc-900/40 border border-white/5">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
                      <Heart size={26} />
                    </div>
                    <h3 className="text-base font-bold text-white mb-1">No liked songs yet</h3>
                    <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                      Tap the heart icon on any track to save it here for instant access.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.04] bg-zinc-900/40 rounded-2xl border border-white/5 overflow-hidden">
                    {likedSongs.map((track, idx) => (
                      <TrackRow
                        key={track.id + idx}
                        track={track}
                        index={idx}
                        isPlaying={queue[currentIndex]?.id === track.id && isPlaying}
                        onPlay={() => handlePlayQueue(likedSongs, idx)}
                        isLiked={true}
                        onToggleLike={() => toggleLikedSong(track)}
                        formatDuration={formatDuration}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ─────────────────────────────────────────
                TAB: RECENT SONGS
                ───────────────────────────────────────── */}
            {activeTab === 'recent' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                      <Clock size={18} className="text-indigo-400" />
                      <span>Recently Played</span>
                    </h2>
                    <p className="text-xs text-zinc-500">{recentSongs.length} tracks</p>
                  </div>

                  {recentSongs.length > 0 && (
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => handleShuffleQueue(recentSongs, e)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-bold transition-all shadow-sm ${
                          isShuffled 
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' 
                            : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                        }`}
                      >
                        <Shuffle size={13} />
                        <span>Shuffle</span>
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handlePlayQueue(recentSongs, 0)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-all shadow-md"
                      >
                        <Play size={13} fill="currentColor" />
                        <span>Play All</span>
                      </motion.button>
                    </div>
                  )}
                </div>

                {recentSongs.length === 0 ? (
                  <div className="text-center py-20 px-4 rounded-3xl bg-zinc-900/40 border border-white/5">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                      <Clock size={26} />
                    </div>
                    <h3 className="text-base font-bold text-white mb-1">No listening history</h3>
                    <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                      Songs you listen to will automatically be remembered here.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.04] bg-zinc-900/40 rounded-2xl border border-white/5 overflow-hidden">
                    {recentSongs.map((track, idx) => (
                      <TrackRow
                        key={track.id + idx}
                        track={track}
                        index={idx}
                        isPlaying={queue[currentIndex]?.id === track.id && isPlaying}
                        onPlay={() => handlePlayQueue(recentSongs, idx)}
                        isLiked={likedSongs.some(t => t.id === track.id)}
                        onToggleLike={() => toggleLikedSong(track)}
                        formatDuration={formatDuration}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ─────────────────────────────────────────
                TAB: LOCAL FILES
                ───────────────────────────────────────── */}
            {activeTab === 'local' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                      <HardDrive size={18} className="text-emerald-400" />
                      <span>Local Audio Files</span>
                    </h2>
                    <p className="text-xs text-zinc-500">{localTracks.length} cached offline files</p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {localTracks.length > 0 && (
                      <>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => handleShuffleQueue(localTracks, e)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-all"
                        >
                          <Shuffle size={13} />
                          <span>Shuffle</span>
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handlePlayQueue(localTracks, 0)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-zinc-950 text-xs font-bold hover:bg-zinc-200 transition-all shadow-md"
                        >
                          <Play size={13} fill="currentColor" />
                          <span>Play All</span>
                        </motion.button>
                        <button
                          onClick={clearAllLocal}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all"
                        >
                          <Trash2 size={12} />
                          <span>Clear</span>
                        </button>
                      </>
                    )}

                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isImporting}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/10 transition-all disabled:opacity-50"
                    >
                      <Upload size={13} />
                      <span>{isImporting ? 'Importing…' : 'Files'}</span>
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => folderInputRef.current?.click()}
                      disabled={isImporting}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white font-semibold text-xs border border-white/5 transition-all disabled:opacity-50"
                    >
                      <FolderOpen size={13} />
                      <span>Folder</span>
                    </motion.button>
                  </div>
                </div>

                {localTracks.length === 0 && !isImporting ? (
                  <div className="text-center py-20 px-4 rounded-3xl bg-zinc-900/40 border border-white/5">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                      <FolderOpen size={26} />
                    </div>
                    <h3 className="text-base font-bold text-white mb-1">No local files found</h3>
                    <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-5">
                      Import MP3, FLAC, or WAV audio files directly from your device. Tracks are cached offline in browser storage.
                    </p>
                    <div className="flex items-center justify-center gap-2.5">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-5 py-2.5 rounded-full bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-all shadow-md"
                      >
                        Import Audio Files
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.04] bg-zinc-900/40 rounded-2xl border border-white/5 overflow-hidden">
                    {localTracks.map((track, idx) => (
                      <TrackRow
                        key={track.id + idx}
                        track={track}
                        index={idx}
                        isPlaying={queue[currentIndex]?.id === track.id && isPlaying}
                        onPlay={() => handlePlayQueue(localTracks, idx)}
                        isLiked={likedSongs.some(t => t.id === track.id)}
                        onToggleLike={() => toggleLikedSong(track)}
                        formatDuration={formatDuration}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Hidden File / Folder Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        multiple
        accept="audio/*"
        className="hidden"
      />
      <input
        type="file"
        ref={folderInputRef}
        onChange={handleFileSelect}
        /* @ts-expect-error webkitdirectory is non-standard but supported by most browsers */
        webkitdirectory=""
        directory=""
        multiple
        accept="audio/*"
        className="hidden"
      />

      {/* Create Playlist Modal */}
      <CreatePlaylistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────
   PLAYLIST CARD COMPONENT (With Multi-Art Collage)
   ───────────────────────────────────────────── */
interface PlaylistCardProps {
  playlist: PlaylistType;
  onPlay: (playlist: PlaylistType, e?: React.MouseEvent) => void;
  onShuffle?: (playlist: PlaylistType, e?: React.MouseEvent) => void;
}

function PlaylistCard({ playlist, onPlay, onShuffle }: PlaylistCardProps) {
  const navigate = useNavigate();

  // Multi-artwork collage detection
  const tracksWithCovers = useMemo(() => {
    return playlist.tracks.filter(t => t.coverArtUrl);
  }, [playlist.tracks]);

  return (
    <motion.div
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate(`/playlist/${playlist.id}`)}
      className="group cursor-pointer flex flex-col p-2.5 rounded-2xl bg-zinc-900/40 hover:bg-zinc-850/70 border border-white/[0.04] hover:border-white/10 transition-all shadow-sm"
    >
      <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-900 mb-2.5 shadow-md">
        {tracksWithCovers.length >= 4 ? (
          /* 4-Cover Collage */
          <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
            {tracksWithCovers.slice(0, 4).map((t, idx) => (
              <img
                key={idx}
                src={t.coverArtUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ))}
          </div>
        ) : tracksWithCovers.length > 0 ? (
          /* Single Main Cover */
          <img
            src={tracksWithCovers[0].coverArtUrl}
            alt={playlist.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          /* Sleek Minimalist Vinyl Disc Art */
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950 p-3">
            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center bg-white/[0.02]">
              <Disc3 className="text-zinc-500 w-6 h-6 animate-spin-slow" />
            </div>
          </div>
        )}

        {/* Hover / Active Actions (Play & Shuffle) */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          {onShuffle && playlist.tracks.length > 0 && (
            <button
              onClick={(e) => onShuffle(playlist, e)}
              aria-label={`Shuffle ${playlist.name}`}
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white text-white hover:text-zinc-950 flex items-center justify-center shadow-lg active:scale-[0.96] transition-all duration-150"
            >
              <Shuffle size={14} />
            </button>
          )}
          <button
            onClick={(e) => onPlay(playlist, e)}
            aria-label={`Play ${playlist.name}`}
            className="w-10 h-10 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-xl active:scale-[0.96] transition-all duration-150"
          >
            <Play size={16} fill="currentColor" className="ml-0.5" />
          </button>
        </div>
      </div>

      <div className="flex items-start justify-between gap-1.5 min-w-0 px-0.5">
        <div className="min-w-0 flex-1">
          <h4 className="font-bold text-xs md:text-sm text-white group-hover:text-amber-200 transition-colors truncate">
            {playlist.name}
          </h4>
          <p className="text-[11px] font-medium text-zinc-500 mt-0.5 truncate">
            {playlist.tracks.length} {playlist.tracks.length === 1 ? 'track' : 'tracks'}
          </p>
        </div>
        <div onClick={(e) => e.stopPropagation()} className="shrink-0 -mr-1">
          <PlaylistContextMenu playlist={playlist} />
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   TRACK ROW COMPONENT (Dense, Touch-Friendly)
   ───────────────────────────────────────────── */
interface TrackRowProps {
  track: Track;
  index: number;
  isPlaying: boolean;
  onPlay: () => void;
  isLiked: boolean;
  onToggleLike: () => void;
  formatDuration: (seconds?: number) => string;
}

function TrackRow({
  track,
  index,
  isPlaying,
  onPlay,
  isLiked,
  onToggleLike,
  formatDuration
}: TrackRowProps) {
  return (
    <div
      onClick={onPlay}
      className={`group flex items-center justify-between gap-3 px-3.5 py-2.5 cursor-pointer transition-colors ${
        isPlaying ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'
      }`}
    >
      {/* Left: Thumbnail & Info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="text-[11px] font-mono text-zinc-600 w-4 text-center hidden sm:inline shrink-0 tabular-nums">
          {index + 1}
        </span>
        <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-zinc-900 border border-white/5 shrink-0 shadow-sm">
          {track.coverArtUrl ? (
            <img src={track.coverArtUrl} alt={track.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-600 bg-zinc-900">
              <Music size={16} />
            </div>
          )}

          {/* Playing EQ or Hover Play Icon */}
          <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${
            isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}>
            {isPlaying ? (
              <div className="flex items-end justify-center gap-0.5 h-3">
                <span className="w-0.5 bg-white rounded-full eq-bar" style={{ height: '100%' }} />
                <span className="w-0.5 bg-white rounded-full eq-bar" style={{ height: '70%', animationDelay: '0.15s' }} />
                <span className="w-0.5 bg-white rounded-full eq-bar" style={{ height: '90%', animationDelay: '0.3s' }} />
              </div>
            ) : (
              <Play size={14} fill="currentColor" className="text-white ml-0.5" />
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className={`text-xs md:text-sm font-semibold truncate ${
            isPlaying ? 'text-white' : 'text-zinc-200 group-hover:text-white'
          }`}>
            {track.title}
          </p>
          <p className="text-[11px] font-medium text-zinc-400 truncate mt-0.5 group-hover:text-zinc-300">
            {track.artist || 'Unknown Artist'}
          </p>
        </div>
      </div>

      {/* Right: Duration, Heart & Context Menu */}
      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
        {track.duration && (
          <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline tabular-nums">
            {formatDuration(track.duration)}
          </span>
        )}

        <button
          onClick={onToggleLike}
          aria-label={isLiked ? "Unlike track" : "Like track"}
          className={`w-7 h-7 flex items-center justify-center rounded-full transition-all duration-150 ${
            isLiked 
              ? 'text-rose-400 hover:scale-110 active:scale-[0.96]' 
              : 'text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100 active:scale-[0.96]'
          }`}
        >
          <Heart size={14} fill={isLiked ? "currentColor" : "none"} />
        </button>

        <TrackContextMenu track={track} />
      </div>
    </div>
  );
}

export default LocalMusic;
