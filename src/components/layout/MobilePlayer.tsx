import { useState } from 'react';
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
  const [touchStart, setTouchStart] = useState<{x: number, y: number} | null>(null);
  const [touchOffset, setTouchOffset] = useState<number>(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isVerticalScroll, setIsVerticalScroll] = useState<boolean | null>(null);
  const { queue, currentIndex, isPlaying, progress, duration, togglePlay, next, prev, seek, isShuffled, loopMode, toggleShuffle, toggleLoop, likedSongs, toggleLikedSong } = useAudioStore();

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isTransitioning) return;
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    setIsVerticalScroll(null);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null || isTransitioning) return;
    
    const diffX = e.touches[0].clientX - touchStart.x;
    const diffY = e.touches[0].clientY - touchStart.y;
    
    if (isVerticalScroll === null) {
      if (Math.abs(diffY) > 10 && Math.abs(diffY) > Math.abs(diffX)) {
        setIsVerticalScroll(true);
      } else if (Math.abs(diffX) > 10) {
        setIsVerticalScroll(false);
      }
    }
    
    if (isVerticalScroll === false) {
      setTouchOffset(diffX);
    }
  };
  
  const handleTouchEnd = () => {
    if (touchStart === null || isTransitioning) return;
    
    if (isVerticalScroll === false) {
      if (touchOffset > 100) {
        // Swipe Right -> Prev
        setIsTransitioning(true);
        setTouchOffset(window.innerWidth);
        setTimeout(() => {
          prev();
          setIsTransitioning(false);
          setTouchOffset(-window.innerWidth);
          setTimeout(() => {
            setIsTransitioning(true);
            setTouchOffset(0);
            setTimeout(() => setIsTransitioning(false), 150);
          }, 20);
        }, 150);
      } else if (touchOffset < -100) {
        // Swipe Left -> Next
        setIsTransitioning(true);
        setTouchOffset(-window.innerWidth);
        setTimeout(() => {
          next();
          setIsTransitioning(false);
          setTouchOffset(window.innerWidth);
          setTimeout(() => {
            setIsTransitioning(true);
            setTouchOffset(0);
            setTimeout(() => setIsTransitioning(false), 150);
          }, 20);
        }, 150);
      } else {
        setIsTransitioning(true);
        setTouchOffset(0);
        setTimeout(() => setIsTransitioning(false), 150);
      }
    }
    
    setTouchStart(null);
    setIsVerticalScroll(null);
  };

  const currentTrack = currentIndex >= 0 ? queue[currentIndex] : null;

  const transformStyle = {
    transform: `translateX(${touchOffset}px)`,
    opacity: 1 - Math.abs(touchOffset) / (window.innerWidth || 500) * 0.5,
    transition: isTransitioning ? 'transform 150ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 150ms cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none'
  };

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
            <div className="flex items-center gap-4 text-zinc-400 mr-2">
              <button onClick={() => setShowLyrics(true)} className="hover:text-white transition-colors" title="Lyrics">
                <Mic2 size={22} />
              </button>
              <button onClick={() => setShowQueue(true)} className="hover:text-white transition-colors" title="Queue">
                <ListMusic size={22} />
              </button>
            </div>
          </div>

          {/* Swipeable Main Area */}
          <div
            className="flex-1 flex flex-col w-full relative z-10"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={transformStyle}
          >
            {/* Artwork */}
            <div className="relative z-10 flex-1 flex items-center justify-center px-10 py-4">
              <div className="w-full max-w-[320px] aspect-square rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
                {currentTrack.coverArtUrl ? (
                  <img 
                    src={currentTrack.coverArtUrl} 
                    alt="Cover" 
                    className="w-full h-full object-cover pointer-events-none" 
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
            <div className="relative h-1.5 w-full flex items-center mb-1.5 cursor-pointer">
              <input 
                type="range" 
                min={0} 
                max={duration || 100} 
                value={progress || 0}
                onChange={(e) => seek(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
              />
              <div className="absolute left-0 right-0 h-1 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full transition-[width] ease-linear duration-300"
                  style={{ width: `${(progress / (duration || 1)) * 100}%` }}
                />
              </div>
              <div 
                className="absolute w-3 h-3 bg-white rounded-full shadow-lg -ml-1.5 pointer-events-none transition-[left] ease-linear duration-300"
                style={{ left: `${(progress / (duration || 1)) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono tabular-nums">
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
              
              <button onClick={prev} className="text-zinc-200 hover:text-white p-3 md:p-4 active:scale-95 transition-all">
                <SkipBack size={32} fill="currentColor" />
              </button>
              
              <button 
                onClick={togglePlay} 
                className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-zinc-950 shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
              </button>
              
              <button onClick={next} className="text-zinc-200 hover:text-white p-3 md:p-4 active:scale-95 transition-all">
                <SkipForward size={32} fill="currentColor" />
              </button>

              <button onClick={toggleLoop} className={`p-2 transition-colors ${loopMode !== 'off' ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {loopMode === 'one' ? <Repeat1 size={22} /> : <Repeat size={22} />}
              </button>
            </div>
            
            {/* Bottom Controls */}
            <div className="w-full pb-4 pt-8">
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
