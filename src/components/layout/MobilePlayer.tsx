import { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Heart, Music, Mic2, ListMusic, ChevronDown } from 'lucide-react';
import { useAudioStore } from '../../store/useAudioStore';
import { LyricsView } from '../audio/LyricsView';
import { QueueView } from '../audio/QueueView';
import { TrackContextMenu } from '../ui/TrackContextMenu';

function formatTime(seconds: number) {
  if (isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function MobilePlayer() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const { queue, currentIndex, isPlaying, progress, duration, togglePlay, next, prev, seek, isShuffled, loopMode, toggleShuffle, toggleLoop, likedSongs, toggleLikedSong } = useAudioStore();

  const currentTrack = currentIndex >= 0 ? queue[currentIndex] : null;

  if (!currentTrack) return null;

  if (isExpanded) {
    return (
      <>
        <div className="md:hidden fixed inset-0 bg-zinc-950 z-50 flex flex-col animate-slide-in-bottom overflow-y-auto no-scrollbar pb-8">
          
          {/* Dynamic Blurred Background */}
          {currentTrack.coverArtUrl && (
            <div 
              className="absolute inset-0 opacity-20 blur-[80px] scale-150"
              style={{ 
                backgroundImage: `url(${currentTrack.coverArtUrl})`,
                backgroundPosition: 'center',
                backgroundSize: 'cover'
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/60 to-zinc-950 pointer-events-none" />

          {/* Top Handle for Minimize */}
          <div className="w-full pt-4 pb-2 flex justify-center sticky top-0 z-20 cursor-pointer" onClick={() => setIsExpanded(false)}>
            <div className="w-12 h-1.5 bg-white/20 hover:bg-white/40 rounded-full transition-colors shadow-sm" />
          </div>

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between px-6 pt-4 pb-4">
            <button onClick={() => setIsExpanded(false)} className="text-zinc-400 hover:text-white p-2 -ml-2 transition-colors">
              <ChevronDown size={28} />
            </button>
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">Now Playing</span>
            <div className="w-10" />
          </div>

          {/* Artwork */}
          <div className="relative z-10 flex-1 flex items-center justify-center px-10 py-4">
            <div className="w-full max-w-[320px] aspect-square rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
              {currentTrack.coverArtUrl ? (
                <img 
                  src={currentTrack.coverArtUrl} 
                  alt="Cover" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                  <Music size={48} className="text-zinc-600" />
                </div>
              )}
            </div>
          </div>

          {/* Track Info */}
          <div className="relative z-10 px-8 mb-4 flex items-start justify-between">
            <div className="flex flex-col overflow-hidden mr-4">
              <span className="text-xl font-bold text-white truncate">{currentTrack.title}</span>
              <span className="text-zinc-400 truncate mt-0.5 text-sm">{currentTrack.artist}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button 
                onClick={() => toggleLikedSong(currentTrack)}
                className={`p-2 transition-colors ${(likedSongs || []).some(t => t.id === currentTrack.id) ? 'text-emerald-500 hover:text-emerald-400' : 'text-zinc-500 hover:text-emerald-400'}`}
              >
                <Heart size={22} className={(likedSongs || []).some(t => t.id === currentTrack.id) ? 'fill-emerald-500' : ''} />
              </button>
              <div onClick={e => e.stopPropagation()}>
                <TrackContextMenu track={currentTrack} />
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="relative z-10 px-8 mb-6">
            <input 
              type="range" 
              min={0} 
              max={duration || 100} 
              value={progress}
              onChange={(e) => seek(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 mt-1.5 font-mono tabular-nums">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="relative z-10 flex flex-col px-8 mb-12">
            <div className="flex items-center justify-between">
              <button onClick={toggleShuffle} className={`p-2 transition-colors ${isShuffled ? 'text-emerald-400' : 'text-zinc-500'}`}>
                <Shuffle size={22} />
              </button>
              
              <button onClick={prev} className="text-zinc-200 hover:text-white p-2 transition-colors">
                <SkipBack size={32} fill="currentColor" />
              </button>
              
              <button 
                onClick={togglePlay} 
                className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-zinc-950 shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
              </button>
              
              <button onClick={next} className="text-zinc-200 hover:text-white p-2 transition-colors">
                <SkipForward size={32} fill="currentColor" />
              </button>

              <button onClick={toggleLoop} className={`p-2 transition-colors ${loopMode !== 'off' ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {loopMode === 'one' ? <Repeat1 size={22} /> : <Repeat size={22} />}
              </button>
            </div>
            
            {/* Bottom Controls (Lyrics & Queue Cards) */}
            <div className="w-full pt-8 pb-4 flex gap-3">
              <button 
                onClick={() => setShowLyrics(true)}
                className="flex-1 bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors rounded-xl p-3.5 flex items-center justify-center gap-2 group border border-white/[0.05]"
              >
                <Mic2 className={`w-5 h-5 ${showLyrics ? 'text-emerald-400' : 'text-white group-hover:text-emerald-400'}`} />
                <span className="text-white font-bold tracking-wide text-sm">Lyrics</span>
              </button>
              
              <button 
                onClick={() => setShowQueue(true)}
                className="flex-1 bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors rounded-xl p-3.5 flex items-center justify-center gap-2 group border border-white/[0.05]"
              >
                <ListMusic className={`w-5 h-5 ${showQueue ? 'text-emerald-400' : 'text-white group-hover:text-emerald-400'}`} />
                <span className="text-white font-bold tracking-wide text-sm">Queue</span>
              </button>
            </div>
          </div>
        </div>
        {showLyrics && <LyricsView onClose={() => setShowLyrics(false)} />}
        {showQueue && <QueueView onClose={() => setShowQueue(false)} />}
      </>
    );
  }

  // Mini Player
  return (
    <div className="md:hidden fixed bottom-[72px] left-2 right-2 z-40 glass rounded-xl shadow-[0_-5px_30px_rgba(0,0,0,0.5)] border border-white/[0.1] overflow-hidden backdrop-blur-2xl bg-black/40">
      {/* Top progress line */}
      <div className="h-[2px] bg-zinc-800 w-full absolute top-0 left-0 z-10">
        <div 
          className="h-full bg-emerald-500 transition-[width] duration-300 ease-linear" 
          style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}
        />
      </div>
      
      <div className="flex items-center p-2.5 gap-3 cursor-pointer" onClick={() => setIsExpanded(true)}>
        {currentTrack.coverArtUrl ? (
          <img src={currentTrack.coverArtUrl} alt="Cover" className="w-11 h-11 rounded-lg object-cover shrink-0 shadow-md" />
        ) : (
          <div className="w-11 h-11 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 shadow-md">
            <Music size={16} className="text-zinc-600" />
          </div>
        )}
        
        <div className="flex-1 flex flex-col justify-center overflow-hidden pr-2">
          <span className="text-sm font-semibold text-zinc-100 truncate">{currentTrack.title}</span>
          <span className="text-xs text-zinc-500 truncate">{currentTrack.artist}</span>
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); togglePlay(); }} 
          className="w-10 h-10 flex items-center justify-center text-zinc-100 shrink-0 hover:text-emerald-400 transition-colors"
        >
          {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
        </button>
      </div>
    </div>
  );
}
