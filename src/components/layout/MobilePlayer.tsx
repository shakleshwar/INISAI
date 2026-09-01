import { useState, useRef, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Heart, Music, Mic2, ListMusic, ChevronDown } from 'lucide-react';
import { useAudioStore } from '../../store/useAudioStore';
import { LyricsView } from '../audio/LyricsView';
import { QueueView } from '../audio/QueueView';
import { MiniLyrics } from '../audio/MiniLyrics';
import { TrackContextMenu } from '../ui/TrackContextMenu';
import { useKeyboardOpen } from '../../hooks/useKeyboardOpen';

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
  const isKeyboardOpen = useKeyboardOpen();
  
  // ─── Fix #1: Progress slider jitter ───
  // Track whether the user is currently dragging the slider.
  // While dragging, we display localProgress instead of the live progress
  // so the knob doesn't fight with the real-time playback position.
  const [isDragging, setIsDragging] = useState(false);
  const [localProgress, setLocalProgress] = useState(0);

  // ─── Fix #2 & #3: Swipe gesture refs ───
  const pointerStartRef = useRef<{x: number, y: number, time: number, pointerId: number} | null>(null);
  const hasSwiped = useRef(false);

  const { queue, currentIndex, isPlaying, progress, duration, togglePlay, next, prev, seek, isShuffled, loopMode, toggleShuffle, toggleLoop, likedSongs, toggleLikedSong } = useAudioStore();

  // The progress value used by the slider visual — either local (dragging) or live
  const displayProgress = isDragging ? localProgress : progress;

  // ─── Swipe handlers with pointer events (works for touch & mouse) ───
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Only handle primary button (left click) or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    pointerStartRef.current = { 
      x: e.clientX, 
      y: e.clientY,
      time: Date.now(),
      pointerId: e.pointerId
    };
    hasSwiped.current = false;
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!pointerStartRef.current || hasSwiped.current) return;

    const diffX = e.clientX - pointerStartRef.current.x;
    const diffY = e.clientY - pointerStartRef.current.y;

    // Prevent horizontal native scroll (for track skipping)
    if (Math.abs(diffX) > 30 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
      if (e.cancelable) e.preventDefault();
    }
    
    // Prevent vertical native scroll ONLY if we are pulling down from the top (swipe to close)
    const target = e.currentTarget as HTMLElement;
    if (target.scrollTop <= 0 && diffY > 10 && Math.abs(diffY) > Math.abs(diffX) * 1.5) {
      if (e.cancelable) e.preventDefault();
    }
  }, []);
  
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!pointerStartRef.current || hasSwiped.current) return;

    const diffX = e.clientX - pointerStartRef.current.x;
    const diffY = e.clientY - pointerStartRef.current.y;
    const elapsed = Date.now() - pointerStartRef.current.time;

    // Fix #2: Higher threshold (100px instead of 50px) and must be within 500ms
    // to prevent accidental skips from slow drifts.
    const SWIPE_THRESHOLD = 80; // slightly lower for easier swiping
    const SWIPE_TIME_LIMIT = 500;

    // Fix #4: Swipe DOWN to minimize the player
    if (diffY > 120 && Math.abs(diffY) > Math.abs(diffX) * 1.5 && elapsed < SWIPE_TIME_LIMIT) {
      hasSwiped.current = true;
      setIsExpanded(false);
      (e.target as HTMLElement).releasePointerCapture(pointerStartRef.current.pointerId);
      pointerStartRef.current = null;
      return;
    }
    
    // Horizontal swipe to change track
    if (Math.abs(diffX) > Math.abs(diffY) * 1.2 && Math.abs(diffX) > SWIPE_THRESHOLD && elapsed < SWIPE_TIME_LIMIT) {
      hasSwiped.current = true;
      if (diffX > 0) {
        prev();
      } else {
        next();
      }
    }
    
    (e.target as HTMLElement).releasePointerCapture(pointerStartRef.current.pointerId);
    pointerStartRef.current = null;
  }, [prev, next]);

  const handlePointerCancel = useCallback((e: React.PointerEvent) => {
    if (pointerStartRef.current) {
      (e.target as HTMLElement).releasePointerCapture(pointerStartRef.current.pointerId);
      pointerStartRef.current = null;
    }
  }, []);

  // ─── Progress slider handlers (Fix #1) ───
  const handleSliderStart = useCallback(() => {
    setIsDragging(true);
    setLocalProgress(progress);
  }, [progress]);

  const handleSliderChange = useCallback((value: number) => {
    if (isDragging) {
      setLocalProgress(value);
    } else {
      seek(value);
    }
  }, [isDragging, seek]);

  const handleSliderEnd = useCallback(() => {
    if (isDragging) {
      seek(localProgress);
      setIsDragging(false);
    }
  }, [isDragging, localProgress, seek]);

  const currentTrack = currentIndex >= 0 ? queue[currentIndex] : null;

  if (!currentTrack) return null;

  if (isExpanded) {
    return (
      <>
        <div className="md:hidden fixed inset-0 bg-[var(--color-surface-50)] z-50 flex flex-col animate-slide-up overflow-hidden">
          
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

          {/* Header — compact */}
          <div className="relative z-10 flex items-center justify-between px-6 pt-3 pb-1 shrink-0">
            <button onClick={() => setIsExpanded(false)} className="text-zinc-500 hover:text-white p-2 -ml-2 transition-colors active:scale-95">
              <ChevronDown size={24} />
            </button>
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">Now Playing</span>
            <div className="flex items-center gap-4 text-zinc-500 mr-2">
              <button onClick={() => setShowLyrics(true)} className="hover:text-white transition-colors active:scale-95" title="Lyrics">
                <Mic2 size={20} />
              </button>
              <button onClick={() => setShowQueue(true)} className="hover:text-white transition-colors active:scale-95" title="Queue">
                <ListMusic size={20} />
              </button>
            </div>
          </div>

          {/* ═══ Swipeable Content Area ═══ */}
          <div 
            className="flex-1 flex flex-col min-h-0 relative z-10 select-none"
            style={{ touchAction: 'pan-y' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
          >
            {/* Artwork — fills remaining space */}
            <div className="flex-1 min-h-0 flex items-center justify-center px-6 py-2">
              <div className="w-full max-w-[340px] h-full max-h-[340px] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/[0.05] relative aspect-square mx-auto">
                {currentTrack.coverArtUrl ? (
                  <img 
                    src={currentTrack.coverArtUrl} 
                    alt="Cover" 
                    className="w-full h-full object-cover pointer-events-none" 
                    draggable={false}
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                    <Music size={48} className="text-zinc-700" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 pointer-events-none" />
              </div>
            </div>

            {/* Track Info — fixed height, no overlap */}
            <div className="shrink-0 px-6 py-1 flex items-center justify-between">
              <div className="flex flex-col overflow-hidden mr-3 min-w-0 flex-1">
                <span className="text-xl font-bold text-white truncate tracking-tight">{currentTrack.title}</span>
                <span className="text-zinc-400 truncate mt-0.5 text-[14px] font-medium">{currentTrack.artist}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button 
                  onClick={() => toggleLikedSong(currentTrack)}
                  className={`p-2 transition-all active:scale-90 rounded-full ${
                    (likedSongs || []).some(t => t.id === currentTrack.id) 
                      ? 'text-white bg-white/10' 
                      : 'text-zinc-500 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <Heart size={22} className={(likedSongs || []).some(t => t.id === currentTrack.id) ? 'fill-white text-white' : ''} />
                </button>
                <div onClick={e => e.stopPropagation()}>
                  <TrackContextMenu track={currentTrack} />
                </div>
              </div>
            </div>
          </div>

          {/* ═══ MiniLyrics — sits above controls ═══ */}
          <div className="relative z-10 shrink-0 px-6 pt-1 pb-1">
            <MiniLyrics 
              currentTrack={currentTrack} 
              progress={progress} 
              onClick={() => setShowLyrics(true)} 
            />
          </div>

          {/* ═══ Fixed Bottom Controls: Progress + Buttons ═══ */}
          <div className="relative z-10 shrink-0 px-6 pb-5 pt-1">
            {/* Progress Bar */}
            <div 
              className="mb-2 group"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div className="relative h-7 w-full flex items-center mb-0.5 cursor-pointer">
                <input 
                  type="range" 
                  min={0} 
                  max={duration || 100} 
                  value={displayProgress || 0}
                  onChange={(e) => handleSliderChange(Number(e.target.value))}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    handleSliderStart();
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    handleSliderEnd();
                  }}
                  onMouseDown={handleSliderStart}
                  onMouseUp={handleSliderEnd}
                  className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
                  style={{ touchAction: 'none' }}
                />
                
                {/* Background Track */}
                <div className="absolute left-0 right-0 h-1.5 bg-white/[0.08] rounded-full overflow-hidden" />
                
                {/* Filled Track */}
                <div 
                  className={`absolute left-0 h-1.5 bg-white rounded-full pointer-events-none ${isDragging ? '' : 'transition-all duration-100 ease-linear'}`}
                  style={{ width: `${(displayProgress / (duration || 1)) * 100}%` }}
                />
                
                {/* Draggable Knob */}
                <div 
                  className={`absolute w-4 h-4 bg-white rounded-full shadow-lg -ml-2 pointer-events-none ${isDragging ? 'scale-125' : 'scale-100 transition-all duration-100 ease-linear'}`}
                  style={{ left: `${(displayProgress / (duration || 1)) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-zinc-500 font-mono-nums font-semibold tracking-wider">
                <span>{formatTime(displayProgress)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-between">
              <button onClick={toggleShuffle} className={`p-2 rounded-full transition-all active:scale-95 ${isShuffled ? 'text-white bg-white/10' : 'text-zinc-500 hover:bg-white/[0.05]'}`}>
                <Shuffle size={20} />
              </button>
              
              <button onClick={prev} className="text-zinc-300 hover:text-white p-2 active:scale-90 transition-all">
                <SkipBack size={28} fill="currentColor" />
              </button>
              
              <button 
                onClick={togglePlay} 
                className="w-14 h-14 rounded-full bg-transparent text-white flex items-center justify-center active:scale-95 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
              >
                {isPlaying ? <Pause size={26} fill="currentColor" /> : <Play size={26} fill="currentColor" className="ml-1" />}
              </button>
              
              <button onClick={next} className="text-zinc-300 hover:text-white p-2 active:scale-90 transition-all">
                <SkipForward size={28} fill="currentColor" />
              </button>

              <button onClick={toggleLoop} className={`p-2 rounded-full transition-all active:scale-95 ${loopMode !== 'off' ? 'text-white bg-white/10' : 'text-zinc-500 hover:bg-white/[0.05]'}`}>
                {loopMode === 'one' ? <Repeat1 size={20} /> : <Repeat size={20} />}
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
    <div className={`md:hidden fixed bottom-[100px] left-2 right-2 z-40 glass-surface-elevated rounded-2xl overflow-hidden transition-all duration-300 ${isKeyboardOpen ? 'translate-y-48 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
      {/* Background artwork leak */}
      {currentTrack.coverArtUrl && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10 saturate-[1.2]">
          <div 
            className="absolute -inset-20 bg-cover bg-center blur-[40px]"
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
