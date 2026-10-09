import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Heart, Music, Mic2, ListMusic, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, useDragControls } from 'framer-motion';
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
  const [isDraggingCarousel, setIsDraggingCarousel] = useState(false);

  return (
    <motion.div
      custom={direction}
      variants={swipeVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{
        x: { type: "spring", stiffness: 320, damping: 32 },
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 }
      }}
      onPointerDown={(e) => e.stopPropagation()}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.25}
      style={{ touchAction: 'none' }}
      onDragStart={() => setIsDraggingCarousel(true)}
      onDragEnd={(_e, { offset, velocity }) => {
        setIsDraggingCarousel(false);
        const swipeX = offset.x;
        const velX = velocity.x;
        if (swipeX < -40 || velX < -250) {
          onNext();
        } else if (swipeX > 40 || velX > 250) {
          onPrev();
        }
      }}
      className="absolute inset-0 cursor-grab active:cursor-grabbing select-none"
    >
      {/* Dynamic Ambient Colored Glow Behind Cover Art */}
      {track.coverArtUrl && (
        <div
          className="absolute -inset-3 rounded-[36px] opacity-40 blur-2xl pointer-events-none transition-opacity duration-700 scale-95"
          style={{
            backgroundImage: `url(${track.coverArtUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}

      {/* Previous Cover Ghost - only visible while actively dragging */}
      {hasMultiple && prevTrack && (
        <div
          className={`absolute top-0 w-full h-full rounded-[28px] overflow-hidden shadow-2xl border border-white/[0.08] transition-opacity duration-200 pointer-events-none ${
            isDraggingCarousel ? 'opacity-70' : 'opacity-0'
          }`}
          style={{ left: 'calc(-100% - 24px)' }}
        >
          <img
            src={prevTrack.coverArtUrl}
            alt="Previous Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/10" />
        </div>
      )}

      {/* Current Main Cover — Machined Double-Bezel Hardware Enclosure */}
      <div className="w-full h-full rounded-[28px] p-1 bg-white/[0.04] border border-white/[0.1] shadow-[0_24px_60px_-12px_rgba(0,0,0,0.85),0_8px_24px_rgba(0,0,0,0.5)] relative">
        <div className="w-full h-full rounded-[24px] overflow-hidden relative bg-zinc-950">
          {track.coverArtUrl ? (
            <img
              src={track.coverArtUrl}
              alt={track.title}
              className="w-full h-full object-cover pointer-events-none select-none"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
              <Music size={48} className="text-zinc-700" />
            </div>
          )}
          {/* Subtle physical specular glass reflection sheen */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/25 via-transparent to-white/15 pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-2/5 bg-gradient-to-b from-white/15 via-white/[0.03] to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Next Cover Ghost - only visible while actively dragging */}
      {hasMultiple && nextTrack && (
        <div
          className={`absolute top-0 w-full h-full rounded-[28px] overflow-hidden shadow-2xl border border-white/[0.08] transition-opacity duration-200 pointer-events-none ${
            isDraggingCarousel ? 'opacity-70' : 'opacity-0'
          }`}
          style={{ left: 'calc(100% + 24px)' }}
        >
          <img
            src={nextTrack.coverArtUrl}
            alt="Next Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/10" />
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



  // ─── Swipe & animation state ───
  const dragControls = useDragControls();
  const [direction, setDirection] = useState(1);
  const swipeLockRef = useRef(false);
  const prevIndexRef = useRef(currentIndex);

  const currentTrack = currentIndex >= 0 ? queue[currentIndex] : null;

  // Sync direction on external or autoplay track changes
  useEffect(() => {
    if (currentIndex !== prevIndexRef.current) {
      let d = currentIndex > prevIndexRef.current ? 1 : -1;
      if (currentIndex === 0 && prevIndexRef.current === queue.length - 1) d = 1;
      if (currentIndex === queue.length - 1 && prevIndexRef.current === 0) d = -1;
      setDirection(d);
      prevIndexRef.current = currentIndex;
    }
  }, [currentIndex, queue.length]);

  // Reset y drag offset whenever modal is opened
  useEffect(() => {
    if (isExpanded) {
      y.set(0);
    }
  }, [isExpanded, y]);

  const handleNext = useCallback(() => {
    if (queue.length <= 1 || swipeLockRef.current) return;
    swipeLockRef.current = true;
    setDirection(1);
    next();
    setTimeout(() => { swipeLockRef.current = false; }, 320);
  }, [queue.length, next]);

  const handlePrev = useCallback(() => {
    if (queue.length <= 1 || swipeLockRef.current) return;
    swipeLockRef.current = true;
    setDirection(-1);
    prev();
    setTimeout(() => { swipeLockRef.current = false; }, 320);
  }, [queue.length, prev]);

  // Smart previous track logic: if playing for more than 3s, rewind to start; else skip track
  const handleSmartPrev = useCallback(() => {
    if (progress > 3) {
      seek(0);
      setLocalProgress(0);
    } else {
      handlePrev();
    }
  }, [progress, seek, handlePrev]);

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
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.8 }}
            onDragEnd={(_e, info) => {
              if (info.offset.y > 100 || (info.offset.y > 20 && info.velocity.y > 500)) {
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

          {/* Ambient Living Mesh Background */}
          {currentTrack?.coverArtUrl && (
            <motion.div style={{ opacity: overlayOpacity }} className="absolute inset-0 pointer-events-none overflow-hidden">
              {/* Pulsing vibrant artwork aura */}
              <motion.div
                className="absolute -inset-10 transition-all duration-1000 ease-out"
                animate={{
                  scale: isPlaying ? [1.15, 1.25, 1.15] : 1.15,
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{
                  opacity: bgOpacity,
                  backgroundImage: `url(${currentTrack.coverArtUrl})`,
                  backgroundPosition: 'center',
                  backgroundSize: 'cover',
                  filter: 'blur(75px) saturate(240%) brightness(0.7)'
                }}
              />
              {/* Radial subtle darkening at center to make cover pop */}
              <div className="absolute inset-0 bg-radial-[circle_at_center,transparent_0%,rgba(0,0,0,0.5)_100%]" />
              {/* Smooth cinematic vignette from top to dark bottom */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-[#050507]/65 to-[#050507]/98" />
              {/* Tactile micro-noise for analog depth */}
              <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.018]" />
            </motion.div>
          )}

          {/* Top Drag Handle Bar */}
          <div 
            className="w-full pt-3 pb-1 flex justify-center cursor-grab active:cursor-grabbing touch-none select-none z-20 shrink-0"
            onPointerDown={(e) => dragControls.start(e)}
          >
            <div className="w-10 h-1.5 bg-white/20 rounded-full hover:bg-white/40 transition-colors pointer-events-none" />
          </div>

          {/* Header — Apple Music style contextual pill */}
          <motion.div 
            style={{ opacity: fadeOpacity }} 
            className="relative z-10 flex items-center justify-between px-6 pb-2 shrink-0 cursor-grab active:cursor-grabbing touch-none select-none"
            onPointerDown={(e) => dragControls.start(e)}
          >
            <button 
              onClick={() => setIsExpanded(false)} 
              onPointerDown={(e) => e.stopPropagation()}
              className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors active:scale-90 cursor-pointer"
            >
              <ChevronDown size={22} />
            </button>
            <div className="flex flex-col items-center pointer-events-none">
              <span className="text-[10px] font-bold tracking-[0.22em] uppercase text-zinc-400">Playing From</span>
              <span className="text-[12px] font-semibold text-white/90 tracking-tight mt-0.5 max-w-[180px] truncate">
                {queue.length > 0 ? "Queue" : "Library"}
              </span>
            </div>
            <div className="flex items-center gap-1 text-zinc-400" onPointerDown={(e) => e.stopPropagation()}>
              <button 
                onClick={() => setShowLyrics(true)} 
                className="w-9 h-9 rounded-full flex items-center justify-center hover:text-white hover:bg-white/[0.08] transition-colors active:scale-90 cursor-pointer" 
                title="Lyrics"
              >
                <Mic2 size={18} />
              </button>
              <button 
                onClick={() => setShowQueue(true)} 
                className="w-9 h-9 rounded-full flex items-center justify-center hover:text-white hover:bg-white/[0.08] transition-colors active:scale-90 cursor-pointer" 
                title="Queue"
              >
                <ListMusic size={18} />
              </button>
            </div>
          </motion.div>

          {/* ═══ Swipeable Content Area ═══ */}
          <div
            className="flex-1 flex flex-col min-h-0 relative z-10 select-none"
          >
            <div className="flex-1 min-h-0 flex items-center justify-center px-8 py-2">
              <motion.div style={{ scale: imageScale }} className="w-full max-w-[330px] aspect-square relative mx-auto my-auto">
                <AnimatePresence initial={false} custom={direction}>
                  <CarouselItem
                    key={currentTrack.id}
                    track={currentTrack}
                    prevTrack={queue[currentIndex > 0 ? currentIndex - 1 : queue.length - 1]}
                    nextTrack={queue[currentIndex < queue.length - 1 ? currentIndex + 1 : 0]}
                    hasMultiple={queue.length > 1}
                    direction={direction}
                    onNext={handleNext}
                    onPrev={handlePrev}
                  />
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Track Info — fixed height, elegant typography, lossless badge */}
            <motion.div 
              style={{ opacity: fadeOpacity }} 
              className="shrink-0 px-6 py-1.5 flex items-center justify-between cursor-grab active:cursor-grabbing touch-none select-none"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="flex flex-col overflow-hidden mr-3 min-w-0 flex-1 pointer-events-none">
                <span className="text-[22px] font-bold text-white truncate tracking-tight leading-tight">{currentTrack.title}</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-zinc-400 truncate text-[14px] font-medium leading-none">{currentTrack.artist}</span>
                  <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase bg-white/[0.08] text-zinc-300 rounded border border-white/[0.08]">
                    Lossless
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0" onPointerDown={(e) => e.stopPropagation()}>
                <button
                  onClick={() => toggleLikedSong(currentTrack)}
                  className={`p-2.5 transition-all active:scale-125 rounded-full ${(likedSongs || []).some(t => t.id === currentTrack.id)
                      ? 'text-rose-500 bg-rose-500/10'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  title="Favorite"
                >
                  <Heart 
                    size={22} 
                    className={(likedSongs || []).some(t => t.id === currentTrack.id) ? 'fill-rose-500 text-rose-500 filter drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]' : ''} 
                  />
                </button>
                <div onClick={e => e.stopPropagation()}>
                  <TrackContextMenu 
                    track={currentTrack} 
                    iconSize={22}
                    buttonClassName="p-2.5 text-zinc-400 hover:text-white hover:bg-white/[0.06] rounded-full transition-colors active:scale-90 opacity-100 cursor-pointer" 
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* ═══ MiniLyrics — sits above controls ═══ */}
          <motion.div style={{ opacity: fadeOpacity }} className="relative z-10 shrink-0 px-6 pt-1 pb-1">
            {currentTrack && (
              <MiniLyrics
                currentTrack={currentTrack}
                progress={progress}
                onClick={() => setShowLyrics(true)}
              />
            )}
          </motion.div>

          {/* ═══ Fixed Bottom Controls: Progress + Buttons ═══ */}
          <motion.div style={{ opacity: fadeOpacity }} className="relative z-10 shrink-0 px-6 pb-6 pt-2">
            {/* Progress Bar with Tactile Scrubber & Floating Time Bubble */}
            <div
              className="mb-3 group relative select-none"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div className="relative h-8 w-full flex items-center cursor-pointer">
                {/* Floating Seek Time Bubble when dragging (prevents thumb blocking the time) */}
                {isDragging && (
                  <div 
                    className="absolute -top-7 px-2.5 py-0.5 rounded-full bg-white text-zinc-950 font-mono text-[11px] font-bold shadow-[0_4px_16px_rgba(0,0,0,0.6)] pointer-events-none z-30 -translate-x-1/2 tracking-wider"
                    style={{ left: `${Math.min(93, Math.max(7, (displayProgress / (duration || 1)) * 100))}%` }}
                  >
                    {formatTime(displayProgress)}
                  </div>
                )}

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
                  className="absolute inset-0 w-full h-full opacity-0 z-30 cursor-pointer"
                  style={{ touchAction: 'none' }}
                />

                {/* Track Background */}
                <div className="absolute left-0 right-0 h-1.5 group-hover:h-2 bg-white/[0.08] rounded-full overflow-hidden transition-all duration-200" />

                {/* Filled Track with Luminous White */}
                <div
                  className={`absolute left-0 h-1.5 group-hover:h-2 bg-gradient-to-r from-white/90 to-white rounded-full pointer-events-none transition-all ${isDragging ? 'duration-0' : 'duration-100 ease-linear'} shadow-[0_0_12px_rgba(255,255,255,0.4)]`}
                  style={{ width: `${(displayProgress / (duration || 1)) * 100}%` }}
                />

                {/* Tactile Scrubber Knob with Apple-style ambient shadow */}
                <div
                  className={`absolute w-3.5 h-3.5 bg-white rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.7),0_0_12px_rgba(255,255,255,0.6)] -ml-1.75 pointer-events-none transition-transform duration-150 ${isDragging ? 'scale-150 ring-4 ring-white/20' : 'scale-100 group-hover:scale-125'}`}
                  style={{ left: `${(displayProgress / (duration || 1)) * 100}%` }}
                />
              </div>

              {/* Time Indicators with monospace numbers for zero jitter */}
              <div className="flex justify-between text-[11px] text-zinc-400 font-mono tracking-wider tabular-nums font-medium -mt-1 px-0.5">
                <span>{formatTime(displayProgress)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Playback Controls — Iconic Elevated Tactile Action Bar */}
            <div className="flex items-center justify-between pt-1">
              <button 
                onClick={toggleShuffle} 
                className={`relative p-3 rounded-full transition-all active:scale-90 cursor-pointer ${isShuffled ? 'text-white bg-white/10' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05]'}`}
                title="Shuffle"
              >
                <Shuffle size={20} />
                {isShuffled && <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]" />}
              </button>

              <button 
                onClick={handleSmartPrev} 
                className="text-zinc-300 hover:text-white p-3 rounded-full hover:bg-white/[0.08] active:scale-90 transition-all cursor-pointer flex items-center justify-center"
                title="Previous Track"
              >
                <SkipBack size={26} fill="currentColor" />
              </button>

              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-[0_10px_30px_rgba(255,255,255,0.22),0_4px_12px_rgba(0,0,0,0.4)] hover:shadow-[0_14px_40px_rgba(255,255,255,0.35)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause size={28} fill="currentColor" />
                ) : (
                  <Play size={28} fill="currentColor" className="ml-1" />
                )}
              </motion.button>

              <button 
                onClick={handleNext} 
                className="text-zinc-300 hover:text-white p-3 rounded-full hover:bg-white/[0.08] active:scale-90 transition-all cursor-pointer flex items-center justify-center"
                title="Next Track"
              >
                <SkipForward size={26} fill="currentColor" />
              </button>

              <button 
                onClick={toggleLoop} 
                className={`relative p-3 rounded-full transition-all active:scale-90 cursor-pointer ${loopMode !== 'off' ? 'text-white bg-white/10' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05]'}`}
                title={`Repeat: ${loopMode}`}
              >
                {loopMode === 'one' ? <Repeat1 size={20} /> : <Repeat size={20} />}
                {loopMode !== 'off' && <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]" />}
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
          className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shrink-0 active:scale-90 hover:scale-105 shadow-md transition-all duration-200 mr-1"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
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
