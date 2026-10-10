import { useState, useMemo } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { 
  Play, Pause, Music, Disc3, ChevronLeft, Shuffle, 
  Search, X, Plus, Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudioStore } from '../store/useAudioStore';
import { TrackContextMenu } from '../components/ui/TrackContextMenu';
import { PlaylistContextMenu } from '../components/ui/PlaylistContextMenu';

export function Playlist() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const { 
    playlists, 
    queue, 
    currentIndex, 
    isPlaying, 
    setQueue, 
    playTrack, 
    play, 
    pause,
    likedSongs,
    toggleLikedSong,
    isShuffled
  } = useAudioStore();

  const playlist = playlists.find(p => p.id === id);

  if (!playlist) {
    return <Navigate to="/local" replace />;
  }

  // Calculate total playlist duration
  const totalDurationText = useMemo(() => {
    const totalSeconds = playlist.tracks.reduce((sum, t) => sum + (t.duration || 0), 0);
    if (!totalSeconds) return '';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    if (hours > 0) {
      return `${hours} hr ${minutes} min`;
    }
    return `${minutes} min ${seconds} sec`;
  }, [playlist.tracks]);

  // Tracks with cover art for collage
  const tracksWithCovers = useMemo(() => {
    return playlist.tracks.filter(t => t.coverArtUrl);
  }, [playlist.tracks]);

  // Filtered tracks if search inside playlist is active
  const filteredTracks = useMemo(() => {
    if (!searchQuery.trim()) return playlist.tracks;
    const q = searchQuery.toLowerCase();
    return playlist.tracks.filter(t => 
      t.title.toLowerCase().includes(q) || 
      t.artist?.toLowerCase().includes(q)
    );
  }, [playlist.tracks, searchQuery]);

  // Check if this playlist is currently playing
  const isPlaylistActive = 
    queue.length === playlist.tracks.length && 
    playlist.tracks.length > 0 &&
    queue[0]?.id === playlist.tracks[0]?.id;

  const handlePlayTrack = (index: number) => {
    if (!isPlaylistActive) {
      setQueue(playlist.tracks);
    }

    if (currentIndex === index && isPlaying && isPlaylistActive) {
      pause();
    } else if (currentIndex === index && !isPlaying && isPlaylistActive) {
      play();
    } else {
      playTrack(index);
    }
  };

  const handlePlayAll = () => {
    if (playlist.tracks.length === 0) return;
    if (isPlaylistActive && isPlaying) {
      pause();
      return;
    }
    setQueue(playlist.tracks);
    playTrack(0);
  };

  const handleShufflePlay = () => {
    if (playlist.tracks.length === 0) return;
    const randomIndex = Math.floor(Math.random() * playlist.tracks.length);
    const indices = Array.from({ length: playlist.tracks.length }, (_, i) => i);
    indices.splice(randomIndex, 1);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    indices.unshift(randomIndex);

    useAudioStore.setState({
      queue: playlist.tracks,
      currentIndex: randomIndex,
      isShuffled: true,
      shuffleOrder: indices,
      isPlaying: true
    });
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds || isNaN(seconds)) return '';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-full bg-[#070709] pb-2 md:pb-4 relative">
      {/* ─────────────────────────────────────────────
          TOP STICKY NAVIGATION BAR
          ───────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-[#070709]/90 backdrop-blur-2xl border-b border-white/[0.06] px-4 md:px-8 py-3 flex items-center justify-between">
        {/* Back Button */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/5 text-xs font-semibold transition-all duration-150 active:scale-[0.96]"
        >
          <ChevronLeft size={16} />
          <span>Library</span>
        </motion.button>

        {/* Center Title (Truncated) */}
        <div className="text-center min-w-0 max-w-[200px] md:max-w-md px-2">
          <p className="text-xs font-bold text-white truncate">{playlist.name}</p>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5">
          {playlist.tracks.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                setIsSearchOpen(prev => !prev);
                if (isSearchOpen) setSearchQuery('');
              }}
              aria-label="Search within playlist"
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 active:scale-[0.96] ${
                isSearchOpen || searchQuery 
                  ? 'bg-white text-zinc-950 shadow-md' 
                  : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              <Search size={14} />
            </motion.button>
          )}

          <PlaylistContextMenu playlist={playlist} />
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          HERO BANNER & PLAYLIST INFO
          ───────────────────────────────────────────── */}
      <div className="relative overflow-hidden pt-6 md:pt-10 pb-6 px-4 md:px-8 max-w-6xl mx-auto">
        {/* Ambient Gradient Glow */}
        <div 
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-full max-w-2xl h-72 pointer-events-none opacity-20 blur-3xl z-0"
          style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.4), transparent 70%)' }}
        />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8">
          {/* Playlist Artwork */}
          <div className="w-44 h-44 sm:w-52 sm:h-52 md:w-56 md:h-56 rounded-2xl md:rounded-3xl overflow-hidden bg-zinc-900 shadow-2xl border border-white/10 shrink-0 relative group">
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
              /* Single Cover with Subtle Backdrop */
              <img
                src={tracksWithCovers[0].coverArtUrl}
                alt={playlist.name}
                className="w-full h-full object-cover"
              />
            ) : (
              /* Minimalist Velvet Vinyl */
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950 p-4">
                <div className="w-16 h-16 rounded-full border border-white/15 flex items-center justify-center bg-white/[0.03] shadow-inner">
                  <Disc3 className="text-zinc-500 w-8 h-8" />
                </div>
              </div>
            )}
          </div>

          {/* Metadata Block */}
          <div className="flex-1 text-center md:text-left min-w-0">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/10 text-zinc-300 border border-white/10 mb-2.5">
              Playlist
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-tight text-balance leading-tight drop-shadow-md">
              {playlist.name}
            </h1>
            <p className="text-xs md:text-sm font-medium text-zinc-400 mt-2 flex items-center justify-center md:justify-start gap-2">
              <span>{playlist.tracks.length} {playlist.tracks.length === 1 ? 'song' : 'songs'}</span>
              {totalDurationText && (
                <>
                  <span className="w-1 h-1 rounded-full bg-zinc-600" />
                  <span>{totalDurationText}</span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          PLAYBACK & ACTION CONTROLS ROW
          ───────────────────────────────────────────── */}
      <div className="px-4 md:px-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-3 py-4 border-y border-white/[0.06]">
          {/* Left: Play & Shuffle Buttons */}
          <div className="flex items-center gap-3">
            {/* Primary Play Button */}
            <motion.button 
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={handlePlayAll}
              disabled={playlist.tracks.length === 0}
              aria-label={isPlaylistActive && isPlaying ? "Pause playlist" : "Play playlist"}
              className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-[0_0_24px_rgba(255,255,255,0.25)] hover:bg-zinc-200 transition-all duration-150 disabled:opacity-40 disabled:hover:scale-100"
            >
              {isPlaylistActive && isPlaying ? (
                <Pause size={22} fill="currentColor" />
              ) : (
                <Play size={22} fill="currentColor" className="ml-0.5" />
              )}
            </motion.button>

            {/* Shuffle Play Button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleShufflePlay}
              disabled={playlist.tracks.length === 0}
              title="Shuffle play playlist"
              aria-label="Shuffle play playlist"
              className={`w-10 h-10 md:w-11 md:h-11 rounded-full border flex items-center justify-center transition-all duration-150 disabled:opacity-40 ${
                isShuffled && isPlaylistActive
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 ring-2 ring-emerald-500/20'
                  : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
              }`}
            >
              <Shuffle size={18} />
            </motion.button>
          </div>

          {/* Right: Add Tracks action */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/library')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 transition-all duration-150 active:scale-[0.96]"
            >
              <Plus size={14} />
              <span>Add Songs</span>
            </button>
          </div>
        </div>

        {/* Inline Search inside playlist */}
        <AnimatePresence>
          {(isSearchOpen || searchQuery) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="pt-3 overflow-hidden"
            >
              <div className="relative flex items-center">
                <Search size={14} className="absolute left-3.5 text-zinc-500 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter songs in this playlist..."
                  className="w-full bg-zinc-900/90 border border-white/10 rounded-xl pl-9 pr-9 py-2 text-xs md:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/20 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 text-zinc-400 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─────────────────────────────────────────────
          SONG LIST
          ───────────────────────────────────────────── */}
      <div className="px-4 md:px-8 mt-4 max-w-6xl mx-auto">
        {playlist.tracks.length === 0 ? (
          /* Empty Playlist State */
          <div className="text-center py-20 px-4 rounded-3xl bg-zinc-900/40 border border-white/5 max-w-lg mx-auto">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 mb-4">
              <Disc3 size={28} />
            </div>
            <h2 className="text-lg font-bold text-white mb-1.5">This playlist is empty</h2>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto mb-6">
              Search for songs, albums, or artists and add them to "{playlist.name}".
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/library')}
              className="px-5 py-2.5 rounded-full bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-all shadow-md inline-flex items-center gap-1.5"
            >
              <Search size={14} />
              <span>Search & Add Songs</span>
            </motion.button>
          </div>
        ) : filteredTracks.length === 0 ? (
          /* Search Empty State */
          <div className="text-center py-16 text-zinc-500 text-xs">
            No tracks in this playlist matching "{searchQuery}".
          </div>
        ) : (
          /* Track List */
          <div className="divide-y divide-white/[0.04] bg-zinc-900/30 rounded-2xl border border-white/5 overflow-hidden">
            {filteredTracks.map((track, idx) => {
              const isCurrentlyPlaying = queue[currentIndex]?.id === track.id && isPlaying;
              const isLiked = likedSongs.some(t => t.id === track.id);

              return (
                <div
                  key={track.id + idx}
                  onClick={() => handlePlayTrack(idx)}
                  className={`group flex items-center justify-between gap-3 px-3.5 py-2.5 cursor-pointer transition-colors ${
                    isCurrentlyPlaying ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'
                  }`}
                >
                  {/* Left: Index, Thumbnail, Info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Track Number / Equalizer */}
                    <div className="w-5 text-center shrink-0">
                      {isCurrentlyPlaying ? (
                        <div className="flex items-end justify-center gap-0.5 h-3">
                          <span className="w-0.5 bg-white rounded-full eq-bar" style={{ height: '100%' }} />
                          <span className="w-0.5 bg-white rounded-full eq-bar" style={{ height: '70%', animationDelay: '0.15s' }} />
                          <span className="w-0.5 bg-white rounded-full eq-bar" style={{ height: '90%', animationDelay: '0.3s' }} />
                        </div>
                      ) : (
                        <span className="text-[11px] font-mono text-zinc-500 group-hover:text-zinc-300 tabular-nums">
                          {idx + 1}
                        </span>
                      )}
                    </div>

                    {/* Thumbnail */}
                    <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-zinc-900 border border-white/5 shrink-0 shadow-sm">
                      {track.coverArtUrl ? (
                        <img src={track.coverArtUrl} alt={track.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600 bg-zinc-900">
                          <Music size={16} />
                        </div>
                      )}

                      {/* Hover play icon */}
                      <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${
                        isCurrentlyPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}>
                        {isCurrentlyPlaying ? (
                          <Pause size={14} fill="currentColor" className="text-white" />
                        ) : (
                          <Play size={14} fill="currentColor" className="text-white ml-0.5" />
                        )}
                      </div>
                    </div>

                    {/* Title & Artist */}
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs md:text-sm font-semibold truncate ${
                        isCurrentlyPlaying ? 'text-white' : 'text-zinc-200 group-hover:text-white'
                      }`}>
                        {track.title}
                      </p>
                      <p className="text-[11px] font-medium text-zinc-400 truncate mt-0.5 group-hover:text-zinc-300">
                        {track.artist || 'Unknown Artist'}
                      </p>
                    </div>
                  </div>

                  {/* Right: Duration, Heart, Menu */}
                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {track.duration && (
                      <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline tabular-nums">
                        {formatDuration(track.duration)}
                      </span>
                    )}

                    <button
                      onClick={() => toggleLikedSong(track)}
                      aria-label={isLiked ? "Unlike track" : "Like track"}
                      className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-150 active:scale-[0.96] ${
                        isLiked 
                          ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10' 
                          : 'text-zinc-500 hover:text-white hover:bg-white/[0.08] opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      <Heart size={15} fill={isLiked ? "currentColor" : "none"} />
                    </button>

                    <TrackContextMenu track={track} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
