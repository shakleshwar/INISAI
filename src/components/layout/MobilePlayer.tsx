import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Heart, Music, Mic2, ListMusic, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useAudioStore } from '../../store/useAudioStore';
import { LyricsView } from '../audio/LyricsView';
import { QueueView } from '../audio/QueueView';
import { MiniLyrics } from '../audio/MiniLyrics';
import { TrackContextMenu } from '../ui/TrackContextMenu';
import { useKeyboardOpen } from '../../hooks/useKeyboardOpen';
import type { Track } from '../../types';

const swipeVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 'calc(100% + 24px)' : 'calc(-100% - 24px)',
    opacity: 1,
    scale: 1,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 'calc(100% + 24px)' : 'calc(-100% - 24px)',
    opacity: 1,
    scale: 1,
  })
};

function CarouselItem({
  track,
  prevTrack,
  nextTrack,
  hasMultiple,
  direction,
  onNext,
  onPrev
}: {
  track: Track;
  prevTrack: Track | null;
  nextTrack: Track | null;
  hasMultiple: boolean;
  direction: number;
  onNext: () => void;
  onPrev: () => void;
}) {
  return (
    <motion.div
      custom={direction}
      variants={swipeVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 }
      }}
      onPointerDown={(e) => e.stopPropagation()}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={1}
      onDragEnd={(_e, { offset, velocity }) => {
        const swipe = offset.x;
        if (swipe < -60 || velocity.x < -400) {
          onNext();
        } else if (swipe > 60 || velocity.x > 400) {
          onPrev();
        }
      }}
      className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl border border-white/[0.05] cursor-grab active:cursor-grabbing"
    >
      {/* Previous Cover Ghost */}
      {hasMultiple && prevTrack && (
        <div
          className="absolute top-0 w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-white/[0.05]"
          style={{ left: 'calc(-100% - 24px)' }}
        >
          <img
            src={prevTrack.coverArtUrl}
            alt="Previous Cover"
            className="w-full h-full object-cover pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 pointer-events-none" />
        </div>
      )}

      {/* Current Cover */}
      {track.coverArtUrl ? (
        <img
          src={track.coverArtUrl}
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

      {/* Next Cover Ghost */}
      {hasMultiple && nextTrack && (
        <div
          className="absolute top-0 w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-white/[0.05]"
          style={{ left: 'calc(100% + 24px)' }}
        >
          <img
            src={nextTrack.coverArtUrl}
            alt="Next Cover"
            className="w-full h-full object-cover pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 pointer-events-none" />
        </div>
      )}
    </motion.div>
  );
}

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

  // ─── Drag physics transitions ───
  const y = useMotionValue(0);
  const fadeOpacity = useTransform(y, [0, 150], [1, 0]);
  const imageScale = useTransform(y, [0, 300], [1, 0.8]);
  const bgOpacity = useTransform(y, [0, 300], [0.6, 0]);
  const overlayOpacity = useTransform(y, [0, 200], [1, 0]);
  const playerScale = useTransform(y, [0, 300], [1, 0.9]);
  const playerRadius = useTransform(y, [0, 100], ["0px", "32px"]);
  const playerShadow = useTransform(y, [0, 100], ["0px 0px 0px rgba(0,0,0,0)", "0px -10px 40px rgba(0,0,0,0.8)"]);


  const { queue, currentIndex, isPlaying, progress, duration, togglePlay, next, prev, seek, isShuffled, loopMode, toggleShuffle, toggleLoop, likedSongs, toggleLikedSong } = useAudioStore();

  // The progress value used by the slider visual — either local (dragging) or live
  const displayProgress = isDragging ? localProgress : progress;

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



  // Track swipe direction for AnimatePresence
  const [optimisticIndex, setOptimisticIndex] = useState<number | null>(null);

  useEffect(() => {
    if (optimisticIndex !== null && optimisticIndex === currentIndex) {
      setOptimisticIndex(null);
    }
  }, [currentIndex, optimisticIndex]);

  const displayIndex = optimisticIndex !== null ? optimisticIndex : currentIndex;
  const currentTrack = displayIndex >= 0 ? queue[displayIndex] : null;
  const realTrack = currentIndex >= 0 ? queue[currentIndex] : null;

  const prevIndexRef = useRef(displayIndex);
  let direction = displayIndex > prevIndexRef.current ? 1 : -1;
  if (displayIndex === 0 && prevIndexRef.current === queue.length - 1) direction = 1;
  if (displayIndex === queue.length - 1 && prevIndexRef.current === 0) direction = -1;

  useEffect(() => {
    prevIndexRef.current = displayIndex;
  }, [displayIndex]);

  const handleNext = useCallback(() => {
    if (queue.length <= 1) return;
    const nextIdx = displayIndex < queue.length - 1 ? displayIndex + 1 : 0;
    setOptimisticIndex(nextIdx);
    setTimeout(() => {
      next();
    }, 250);
  }, [displayIndex, queue.length, next]);

  const handlePrev = useCallback(() => {
    if (queue.length <= 1) return;
    const prevIdx = displayIndex > 0 ? displayIndex - 1 : queue.length - 1;
    setOptimisticIndex(prevIdx);
    setTimeout(() => {
      prev();
    }, 250);
  }, [displayIndex, queue.length, prev]);

  if (!currentTrack) return null;

  return (
    <>
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            key="expanded-player"
            style={{ 
              y,
              scale: playerScale,
              borderRadius: playerRadius,
              boxShadow: playerShadow
            }}
            drag="y"
            dragDirectionLock
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.8 }}
            onDragEnd={(_e, info) => {
              if (info.offset.y > 100 || info.velocity.y > 400) {
                setIsExpanded(false);
                setShowLyrics(false);
                setShowQueue(false);
              }
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            className="md:hidden fixed inset-0 bg-[var(--color-surface-50)] z-50 flex flex-col overflow-hidden"
          >

          {/* Premium Dynamic Background */}
          {realTrack?.coverArtUrl && (
            <motion.div style={{ opacity: overlayOpacity }} className="absolute inset-0 pointer-events-none">
              {/* Vibrant base blur */}
              <motion.div
                className="absolute inset-0 scale-125 transition-all duration-1000 ease-out"
                style={{
                  opacity: bgOpacity,
                  backgroundImage: `url(${realTrack.coverArtUrl})`,
                  backgroundPosition: 'center',
                  backgroundSize: 'cover',
                  filter: 'blur(60px) saturate(200%) brightness(0.8)'
                }}
              />
              {/* Frosted material + gradient for readability */}
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[30px]" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-[#030304]/60 to-[#030304]/95" />
            </motion.div>
          )}

          {/* Header — compact */}
          <motion.div style={{ opacity: fadeOpacity }} className="relative z-10 flex items-center justify-between px-6 pt-3 pb-1 shrink-0">
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
          </motion.div>

          {/* ═══ Swipeable Content Area ═══ */}
          <div
            className="flex-1 flex flex-col min-h-0 relative z-10 select-none"
            style={{ touchAction: 'pan-y' }}
          >
            <div className="flex-1 min-h-0 flex items-center justify-center px-8 py-2">
              <motion.div style={{ scale: imageScale }} className="w-full max-w-[340px] aspect-square relative mx-auto my-auto">
                <AnimatePresence initial={false} custom={direction}>
                  <CarouselItem
                    key={currentTrack.id}
                    track={currentTrack}
                    prevTrack={queue[displayIndex > 0 ? displayIndex - 1 : queue.length - 1]}
                    nextTrack={queue[displayIndex < queue.length - 1 ? displayIndex + 1 : 0]}
                    hasMultiple={queue.length > 1}
                    direction={direction}
                    onNext={handleNext}
                    onPrev={handlePrev}
                  />
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Track Info — fixed height, no overlap */}
            <motion.div style={{ opacity: fadeOpacity }} className="shrink-0 px-6 py-1 flex items-center justify-between">
              <div className="flex flex-col overflow-hidden mr-3 min-w-0 flex-1">
                <span className="text-xl font-bold text-white truncate tracking-tight">{currentTrack.title}</span>
                <span className="text-zinc-400 truncate mt-0.5 text-[14px] font-medium">{currentTrack.artist}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => toggleLikedSong(currentTrack)}
                  className={`p-2 transition-all active:scale-90 rounded-full ${(likedSongs || []).some(t => t.id === currentTrack.id)
                      ? 'text-white bg-white/10'
                      : 'text-zinc-500 hover:text-white hover:bg-white/[0.05]'
                    }`}
                >
                  <Heart size={22} className={(likedSongs || []).some(t => t.id === currentTrack.id) ? 'fill-white text-white' : ''} />
                </button>
                <div onClick={e => e.stopPropagation()}>
                  <TrackContextMenu 
                    track={currentTrack} 
                    iconSize={22}
                    buttonClassName="p-2 text-zinc-500 hover:text-white hover:bg-white/[0.05] rounded-full transition-colors active:scale-90 opacity-100" 
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* ═══ MiniLyrics — sits above controls ═══ */}
          <motion.div style={{ opacity: fadeOpacity }} className="relative z-10 shrink-0 px-6 pt-1 pb-1">
            {realTrack && (
              <MiniLyrics
                currentTrack={realTrack}
                progress={progress}
                onClick={() => setShowLyrics(true)}
              />
            )}
          </motion.div>

          {/* ═══ Fixed Bottom Controls: Progress + Buttons ═══ */}
          <motion.div style={{ opacity: fadeOpacity }} className="relative z-10 shrink-0 px-6 pb-5 pt-1">
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

              <button onClick={handlePrev} className="text-zinc-300 hover:text-white p-2 active:scale-90 transition-all">
                <SkipBack size={28} fill="currentColor" />
              </button>

              <button
                onClick={togglePlay}
                className="w-14 h-14 rounded-full bg-transparent text-white flex items-center justify-center active:scale-95 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
              >
                {isPlaying ? <Pause size={26} fill="currentColor" /> : <Play size={26} fill="currentColor" className="ml-1" />}
              </button>

              <button onClick={handleNext} className="text-zinc-300 hover:text-white p-2 active:scale-90 transition-all">
                <SkipForward size={28} fill="currentColor" />
              </button>

              <button onClick={toggleLoop} className={`p-2 rounded-full transition-all active:scale-95 ${loopMode !== 'off' ? 'text-white bg-white/10' : 'text-zinc-500 hover:bg-white/[0.05]'}`}>
                {loopMode === 'one' ? <Repeat1 size={20} /> : <Repeat size={20} />}
              </button>
            </div>
          </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mini Player */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div 
            key="mini-player"
            initial={{ y: 50, opacity: 0 }}
            animate={{ 
              y: isKeyboardOpen ? 150 : 0, 
              opacity: isKeyboardOpen ? 0 : 1 
            }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="md:hidden fixed bottom-[100px] left-2 right-2 z-40 glass-surface-elevated rounded-2xl overflow-hidden cursor-pointer"
            onClick={() => setIsExpanded(true)}
          >
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlays */}
      {showLyrics && <LyricsView onClose={() => setShowLyrics(false)} />}
      {showQueue && <QueueView onClose={() => setShowQueue(false)} />}
    </>
  );
}
