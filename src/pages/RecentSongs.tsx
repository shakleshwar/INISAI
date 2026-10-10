import { useState, useMemo } from 'react';
import { Clock, Play, Pause, Music, ChevronLeft, Shuffle, Search, X, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudioStore } from '../store/useAudioStore';
import { TrackContextMenu } from '../components/ui/TrackContextMenu';

export function RecentSongs() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const { 
    recentSongs, 
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

  const filteredTracks = useMemo(() => {
    if (!searchQuery.trim()) return recentSongs;
    const q = searchQuery.toLowerCase();
    return recentSongs.filter(t => 
      t.title.toLowerCase().includes(q) || 
      t.artist?.toLowerCase().includes(q)
    );
  }, [recentSongs, searchQuery]);

  const totalDurationText = useMemo(() => {
    const totalSeconds = recentSongs.reduce((sum, t) => sum + (t.duration || 0), 0);
    if (!totalSeconds) return '';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) return `${hours} hr ${minutes} min`;
    return `${minutes} min`;
  }, [recentSongs]);

  const isRecentQueueActive = 
    queue.length === recentSongs.length && 
    recentSongs.length > 0 && 
    queue[0]?.id === recentSongs[0]?.id;

  const handlePlay = (index: number) => {
    if (!isRecentQueueActive) {
      setQueue(recentSongs);
    }
    
    if (currentIndex === index && isPlaying && isRecentQueueActive) {
      pause();
    } else if (currentIndex === index && !isPlaying && isRecentQueueActive) {
      play();
    } else {
      playTrack(index);
    }
  };

  const handlePlayAll = () => {
    if (recentSongs.length === 0) return;
    if (isRecentQueueActive && isPlaying) {
      pause();
      return;
    }
    setQueue(recentSongs);
    playTrack(0);
  };

  const handleShufflePlay = () => {
    if (recentSongs.length === 0) return;
    const randomIndex = Math.floor(Math.random() * recentSongs.length);
    const indices = Array.from({ length: recentSongs.length }, (_, i) => i);
    indices.splice(randomIndex, 1);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    indices.unshift(randomIndex);

    useAudioStore.setState({
      queue: recentSongs,
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

  const tracksWithCovers = useMemo(() => {
    return recentSongs.filter(t => t.coverArtUrl);
  }, [recentSongs]);

  return (
    <div className="min-h-full bg-[#070709] pb-2 md:pb-4 relative">
      {/* Top Sticky Navigation */}
      <div className="sticky top-0 z-30 bg-[#070709]/90 backdrop-blur-2xl border-b border-white/[0.06] px-4 md:px-8 py-3 flex items-center justify-between">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/5 text-xs font-semibold transition-all duration-150 active:scale-[0.96]"
        >
          <ChevronLeft size={16} />
          <span>Library</span>
        </motion.button>

        <p className="text-xs font-bold text-white tracking-tight">Recently Played</p>

        {recentSongs.length > 0 && (
          <button
            onClick={() => setIsSearchOpen(prev => !prev)}
            aria-label="Search recently played"
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 active:scale-[0.96] ${
              isSearchOpen ? 'bg-white text-zinc-950 shadow-md' : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Search size={14} />
          </button>
        )}
      </div>

      {/* Header Banner */}
      <div className="relative overflow-hidden pt-6 md:pt-10 pb-6 px-4 md:px-8 max-w-6xl mx-auto">
        <div 
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-full max-w-2xl h-72 pointer-events-none opacity-25 blur-3xl z-0"
          style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.35), transparent 70%)' }}
        />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8">
          {/* Luxury Obsidian Glass Artwork Box */}
          <div className="w-44 h-44 sm:w-52 sm:h-52 md:w-56 md:h-56 rounded-2xl md:rounded-3xl overflow-hidden bg-[#0c0c12] shadow-[0_24px_50px_rgba(0,0,0,0.8)] border border-white/10 shrink-0 relative group">
            {tracksWithCovers.length >= 4 ? (
              /* Dynamic 4-Art Collage with Floating Center Jewel */
              <div className="relative w-full h-full">
                <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
                  {tracksWithCovers.slice(0, 4).map((t, idx) => (
                    <img
                      key={idx}
                      src={t.coverArtUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ))}
                </div>
                <div className="absolute inset-0 bg-black/35 backdrop-blur-[0.5px]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl">
                    <Clock size={26} className="text-indigo-400 filter drop-shadow-[0_0_12px_rgba(99,102,241,0.6)]" />
                  </div>
                </div>
              </div>
            ) : tracksWithCovers.length > 0 ? (
              /* Single Cover with Vignette and Center Jewel */
              <div className="relative w-full h-full">
                <img
                  src={tracksWithCovers[0].coverArtUrl}
                  alt="Recently played"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl">
                    <Clock size={26} className="text-indigo-400 filter drop-shadow-[0_0_12px_rgba(99,102,241,0.6)]" />
                  </div>
                </div>
              </div>
            ) : (
              /* Sculpted Obsidian Medallion */
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#14141d] to-[#0a0a0f] p-4 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-28 h-28 bg-indigo-500/20 rounded-full blur-2xl" />
                <div className="w-20 h-20 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center shadow-inner relative z-10">
                  <Clock size={36} strokeWidth={1.75} className="text-indigo-400 drop-shadow-md" />
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 text-center md:text-left min-w-0">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-2.5">
              Listening History
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Recently Played
            </h1>
            <p className="text-xs md:text-sm font-medium text-zinc-400 mt-2 flex items-center justify-center md:justify-start gap-2">
              <span className="tabular-nums">{recentSongs.length} {recentSongs.length === 1 ? 'song' : 'songs'}</span>
              {totalDurationText && (
                <>
                  <span className="w-1 h-1 rounded-full bg-zinc-600" />
                  <span className="tabular-nums">{totalDurationText}</span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 md:px-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-3 py-4 border-y border-white/[0.06]">
          <div className="flex items-center gap-3">
            <motion.button 
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={handlePlayAll}
              disabled={recentSongs.length === 0}
              aria-label={isRecentQueueActive && isPlaying ? "Pause recent songs" : "Play recent songs"}
              className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-[0_0_24px_rgba(255,255,255,0.25)] hover:bg-zinc-200 transition-all duration-150 disabled:opacity-40"
            >
              {isRecentQueueActive && isPlaying ? (
                <Pause size={22} fill="currentColor" />
              ) : (
                <Play size={22} fill="currentColor" className="ml-0.5" />
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleShufflePlay}
              disabled={recentSongs.length === 0}
              title="Shuffle play recent songs"
              aria-label="Shuffle play recent songs"
              className={`w-10 h-10 md:w-11 md:h-11 rounded-full border flex items-center justify-center transition-all duration-150 disabled:opacity-40 ${
                isShuffled && isRecentQueueActive
                  ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40 ring-2 ring-indigo-500/20'
                  : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
              }`}
            >
              <Shuffle size={18} />
            </motion.button>
          </div>
        </div>

        {/* Inline Search */}
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
                  placeholder="Filter recently played..."
                  className="w-full bg-zinc-900/90 border border-white/10 rounded-xl pl-9 pr-9 py-2 text-xs md:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/20 transition-all"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 text-zinc-400 hover:text-white">
                    <X size={14} />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Song List */}
      <div className="px-4 md:px-8 mt-4 max-w-6xl mx-auto">
        {recentSongs.length === 0 ? (
          <div className="text-center py-20 px-4 rounded-3xl bg-zinc-900/40 border border-white/5 max-w-lg mx-auto">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
              <Clock size={28} />
            </div>
            <h2 className="text-lg font-bold text-white mb-1.5">No recent songs</h2>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto mb-6">
              Songs you listen to will automatically be remembered here.
            </p>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/library')}
              className="px-5 py-2.5 rounded-full bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-all duration-150 shadow-md inline-flex items-center gap-1.5 active:scale-[0.96]"
            >
              <Search size={14} />
              <span>Explore Music</span>
            </motion.button>
          </div>
        ) : filteredTracks.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 text-xs">
            No recently played songs matching "{searchQuery}".
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04] bg-zinc-900/30 rounded-2xl border border-white/5 overflow-hidden">
            {filteredTracks.map((track, idx) => {
              const playing = queue[currentIndex]?.id === track.id && isPlaying;
              const isLiked = likedSongs.some(t => t.id === track.id);
              return (
                <div 
                  key={track.id + idx}
                  onClick={() => handlePlay(idx)}
                  className={`group flex items-center justify-between gap-3 px-3.5 py-2.5 cursor-pointer transition-colors ${
                    playing ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-5 text-center shrink-0">
                      {playing ? (
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

                    <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-zinc-900 border border-white/5 shrink-0 shadow-sm">
                      {track.coverArtUrl ? (
                        <img src={track.coverArtUrl} alt={track.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600 bg-zinc-900">
                          <Music size={16} />
                        </div>
                      )}
                      <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${
                        playing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}>
                        {playing ? (
                          <Pause size={14} fill="currentColor" className="text-white" />
                        ) : (
                          <Play size={14} fill="currentColor" className="text-white ml-0.5" />
                        )}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className={`text-xs md:text-sm font-semibold truncate ${
                        playing ? 'text-white' : 'text-zinc-200 group-hover:text-white'
                      }`}>
                        {track.title}
                      </p>
                      <p className="text-[11px] font-medium text-zinc-400 truncate mt-0.5 group-hover:text-zinc-300">
                        {track.artist || 'Unknown Artist'}
                      </p>
                    </div>
                  </div>

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
