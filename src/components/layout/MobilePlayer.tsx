import { useState, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Heart, Music, Mic2, ListMusic, ChevronDown } from 'lucide-react';
import { useAudioStore } from '../../store/useAudioStore';
import { LyricsView } from '../audio/LyricsView';
import { QueueView } from '../audio/QueueView';
import { MiniLyrics } from '../audio/MiniLyrics';
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
  
  const touchStartRef = useRef<{x: number, y: number} | null>(null);

  const { queue, currentIndex, isPlaying, progress, duration, togglePlay, next, prev, seek, isShuffled, loopMode, toggleShuffle, toggleLoop, likedSongs, toggleLikedSong } = useAudioStore();

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const diffX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const diffY = e.changedTouches[0].clientY - touchStartRef.current.y;
    
    // Check if it's mostly a horizontal swipe and long enough
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX > 50) {
        // Swipe Right -> Prev
        prev();
      } else if (diffX < -50) {
        // Swipe Left -> Next
        next();
      }
    }
    
    touchStartRef.current = null;
  };

  const currentTrack = currentIndex >= 0 ? queue[currentIndex] : null;

  if (!currentTrack) return null;

  if (isExpanded) {
    return (
      <>
        <div className="md:hidden fixed inset-0 bg-[var(--color-surface-50)] z-50 flex flex-col animate-slide-up overflow-y-auto no-scrollbar pb-8">
          
          {/* Dynamic Blurred Background */}
          {currentTrack.coverArtUrl && (
            <div 
              className="absolute inset-0 opacity-[0.15] blur-[100px] scale-125 pointer-events-none"
              style={{ 
                backgroundImage: `url(${currentTrack.coverArtUrl})`,
                backgroundPosition: 'center',
                backgroundSize: 'cover'
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-surface-100)]/40 via-[var(--color-surface-50)]/80 to-[var(--color-surface-0)] pointer-events-none" />

          {/* Top Handle for Minimize */}
          <div className="w-full pt-4 pb-2 flex justify-center sticky top-0 z-20 cursor-pointer" onClick={() => setIsExpanded(false)}>
            <div className="w-10 h-1 bg-white/20 hover:bg-white/40 rounded-full transition-colors shadow-sm" />
          </div>

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between px-6 pt-4 pb-4">
            <button onClick={() => setIsExpanded(false)} className="text-zinc-500 hover:text-white p-2 -ml-2 transition-colors active:scale-95">
              <ChevronDown size={28} />
            </button>
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">Now Playing</span>
            <div className="flex items-center gap-4 text-zinc-500 mr-2">
              <button onClick={() => setShowLyrics(true)} className="hover:text-white transition-colors active:scale-95" title="Lyrics">
                <Mic2 size={22} />
              </button>
              <button onClick={() => setShowQueue(true)} className="hover:text-white transition-colors active:scale-95" title="Queue">
                <ListMusic size={22} />
              </button>
            </div>
          </div>

          {/* Fixed Main Area (Swipeable without animation) */}
          <div 
            className="flex-1 flex flex-col w-full relative z-10 touch-pan-y select-none"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Artwork */}
            <div className="relative z-10 flex-1 flex items-center justify-center px-8 py-4">
              <div className="w-full max-w-[340px] aspect-square rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/[0.05] relative group">
                {currentTrack.coverArtUrl ? (
                  <img 
                    src={currentTrack.coverArtUrl} 
                    alt="Cover" 
                    className="w-full h-full object-cover pointer-events-none" 
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                    <Music size={48} className="text-zinc-700" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 pointer-events-none" />
              </div>
            </div>

            {/* Track Info */}
            <div className="relative z-10 px-8 mb-6 flex items-start justify-between">
              <div className="flex flex-col overflow-hidden mr-4">
                <span className="text-2xl font-bold text-white line-clamp-2 tracking-tight">{currentTrack.title}</span>
                <span className="text-zinc-400 line-clamp-2 mt-1 text-[15px] font-medium">{currentTrack.artist}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={() => toggleLikedSong(currentTrack)}
                  className={`p-2 transition-all active:scale-90 rounded-full ${
                    (likedSongs || []).some(t => t.id === currentTrack.id) 
                      ? 'text-white bg-white/10' 
                      : 'text-zinc-500 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <Heart size={24} className={(likedSongs || []).some(t => t.id === currentTrack.id) ? 'fill-white text-white' : ''} />
                </button>
                <div onClick={e => e.stopPropagation()}>
                  <TrackContextMenu track={currentTrack} />
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="relative z-10 px-8 mb-8 group">
              <div className="relative h-6 w-full flex items-center mb-1 cursor-pointer">
                <input 
                  type="range" 
                  min={0} 
                  max={duration || 100} 
                  value={progress || 0}
                  onChange={(e) => seek(Number(e.target.value))}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                  className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
                />
                
                {/* Background Track */}
                <div className="absolute left-0 right-0 h-1.5 bg-white/[0.08] rounded-full overflow-hidden" />
                
                {/* Filled Track */}
                <div 
                  className="absolute left-0 h-1.5 bg-white rounded-full transition-all duration-100 ease-linear pointer-events-none shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                  style={{ width: `${(progress / (duration || 1)) * 100}%` }}
                />
                
                {/* Outer Glow */}
                <div 
                  className="absolute left-0 h-1.5 bg-white blur-sm rounded-full pointer-events-none opacity-40 transition-opacity duration-300"
                  style={{ width: `${(progress / (duration || 1)) * 100}%` }}
                />
                
                {/* Draggable Knob */}
                <div 
                  className="absolute w-3.5 h-3.5 bg-white rounded-full shadow-lg -ml-[7px] pointer-events-none transition-all duration-100 ease-linear scale-100"
                  style={{ left: `${(progress / (duration || 1)) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-zinc-500 font-mono-nums font-semibold tracking-wider">
                <span>{formatTime(progress)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="relative z-10 flex flex-col px-8 mb-10">
              <div className="flex items-center justify-between">
                <button onClick={toggleShuffle} className={`p-2 rounded-full transition-all active:scale-95 ${isShuffled ? 'text-white bg-white/10' : 'text-zinc-500 hover:bg-white/[0.05]'}`}>
                  <Shuffle size={22} />
                </button>
                
                <button onClick={prev} className="text-zinc-300 hover:text-white p-3 active:scale-90 transition-all">
                  <SkipBack size={32} fill="currentColor" />
                </button>
                
                <button 
                  onClick={togglePlay} 
                  className="w-16 h-16 rounded-full bg-transparent text-white flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] active:scale-95 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                >
                  {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                </button>
                
                <button onClick={next} className="text-zinc-300 hover:text-white p-3 active:scale-90 transition-all">
                  <SkipForward size={32} fill="currentColor" />
                </button>

                <button onClick={toggleLoop} className={`p-2 rounded-full transition-all active:scale-95 ${loopMode !== 'off' ? 'text-white bg-white/10' : 'text-zinc-500 hover:bg-white/[0.05]'}`}>
                  {loopMode === 'one' ? <Repeat1 size={22} /> : <Repeat size={22} />}
                </button>
              </div>
              
              {/* Bottom Controls */}
              <div className="w-full pb-2 pt-8">
                <MiniLyrics 
                  currentTrack={currentTrack} 
                  progress={progress} 
                  onClick={() => setShowLyrics(true)} 
                />
              </div>
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
    <div className="md:hidden fixed bottom-[72px] left-2 right-2 z-40 glass-surface-elevated rounded-2xl overflow-hidden transition-all duration-300">
      {/* Background artwork leak */}
      {currentTrack.coverArtUrl && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 saturate-150">
          <div 
            className="absolute -inset-20 bg-cover bg-center blur-[60px]"
            style={{ backgroundImage: `url(${currentTrack.coverArtUrl})` }}
          />
        </div>
      )}

      {/* Top progress line */}
      <div className="h-[2px] bg-white/[0.04] w-full absolute top-0 left-0 z-10">
        <div 
          className="h-full bg-white transition-[width] duration-300 ease-linear shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
          style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}
        />
      </div>
      
      <div className="flex items-center p-2.5 gap-3 cursor-pointer group" onClick={() => setIsExpanded(true)}>
        <div className="relative shrink-0 w-12 h-12 rounded-xl bg-zinc-900 overflow-hidden shadow-sm border border-white/[0.05]">
          {currentTrack.coverArtUrl ? (
            <img src={currentTrack.coverArtUrl} alt="Cover" className="w-full h-full object-cover group-active:scale-95 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
              <Music size={16} className="text-zinc-600" />
            </div>
          )}
        </div>
        
        <div className="flex-1 flex flex-col justify-center overflow-hidden pr-2">
          <span className="text-[14px] font-semibold text-zinc-100 truncate tracking-tight">{currentTrack.title}</span>
          <span className="text-[12px] text-zinc-400 truncate mt-0.5">{currentTrack.artist}</span>
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); togglePlay(); }} 
          className="w-12 h-12 flex items-center justify-center text-zinc-300 shrink-0 active:scale-90 hover:text-white transition-all duration-300"
        >
          {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
        </button>
      </div>
    </div>
  );
}
