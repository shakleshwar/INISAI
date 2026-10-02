import { useState, useCallback } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  Trash2, 
  ListMusic, 
  SkipBack, 
  SkipForward, 
  GripVertical, 
  Shuffle, 
  Repeat, 
  Repeat1, 
  Heart,
  Volume2,
  Volume1,
  VolumeX
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { useAudioStore } from '../../store/useAudioStore';

interface QueueViewProps {
  onClose: () => void;
}

function formatTime(seconds: number) {
  if (isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function QueueView({ onClose }: QueueViewProps) {
  const { 
    queue, 
    currentIndex, 
    isPlaying, 
    progress,
    duration,
    seek,
    volume,
    setVolume,
    togglePlay, 
    prev, 
    next, 
    playTrack, 
    removeFromQueue, 
    clearQueue, 
    shuffleOrder, 
    isShuffled, 
    toggleShuffle, 
    loopMode, 
    toggleLoop, 
    reorderNextUp,
    likedSongs,
    toggleLikedSong
  } = useAudioStore();

  // Scrubber drag handling without playback jitter
  const [isDragging, setIsDragging] = useState(false);
  const [localProgress, setLocalProgress] = useState(0);

  const displayProgress = isDragging ? localProgress : progress;

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
  const isLiked = currentTrack ? likedSongs.some(t => t.id === currentTrack.id) : false;
  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  // Next up tracks
  const nextUpIndices: number[] = [];
  if (queue.length > 0) {
    if (isShuffled) {
      const pos = shuffleOrder.indexOf(currentIndex);
      if (pos >= 0) {
        for (let i = pos + 1; i < shuffleOrder.length; i++) {
          nextUpIndices.push(shuffleOrder[i]);
        }
      }
    } else {
      for (let i = currentIndex + 1; i < queue.length; i++) {
        nextUpIndices.push(i);
      }
    }
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    reorderNextUp(result.source.index, result.destination.index);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#030304]/95 backdrop-blur-[40px] animate-fade-in overflow-hidden select-none">
      {/* Background artwork blur */}
      {currentTrack?.coverArtUrl && (
        <>
          <div 
            className="absolute inset-0 opacity-25 pointer-events-none scale-125 transition-all duration-1000 ease-out"
            style={{ 
              backgroundImage: `url(${currentTrack.coverArtUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(90px) saturate(180%)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#030304]/50 via-[#030304]/80 to-[#030304] pointer-events-none" />
        </>
      )}

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-5 sm:px-8 md:px-12 py-4 sm:py-5 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white shadow-sm">
            <ListMusic size={20} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-none">
              Queue
            </h2>
            <p className="text-[12px] text-zinc-400 font-medium mt-1">
              {nextUpIndices.length === 1 ? '1 track next' : `${nextUpIndices.length} tracks next`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          {nextUpIndices.length > 0 && (
            <button 
              onClick={clearQueue}
              className="text-[12px] font-semibold text-red-400 hover:text-red-300 transition-colors bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full active:scale-95 shadow-sm"
              title="Clear all upcoming tracks"
            >
              Clear Queue
            </button>
          )}

          <button 
            onClick={onClose}
            className="w-10 h-10 bg-white/[0.06] hover:bg-white/10 active:scale-90 border border-white/[0.08] rounded-full text-zinc-300 hover:text-white flex items-center justify-center transition-all duration-200"
            aria-label="Close Queue"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Side: Now Playing Hero & Track Controls */}
        <div className="w-full lg:w-[42%] xl:w-[38%] shrink-0 flex flex-col px-4 sm:px-6 md:px-8 lg:px-10 pt-3 sm:pt-4 lg:pt-0 pb-3 lg:pb-8 lg:h-full lg:justify-center lg:border-r border-white/[0.06] lg:overflow-y-auto custom-scrollbar">
          {currentTrack ? (
            <>
              {/* MOBILE Now Playing Card (< lg) */}
              <div className="block lg:hidden w-full max-w-[480px] mx-auto">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#ff3366] animate-pulse shadow-[0_0_8px_rgba(255,51,102,0.6)]" />
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Now Playing</span>
                </div>

                <div className="w-full rounded-2xl bg-white/[0.06] border border-white/[0.1] shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl p-3.5 flex flex-col gap-2.5">
                  {/* Top Row: Cover + Info + Like */}
                  <div className="flex items-center gap-3.5 w-full">
                    {/* Artwork */}
                    <div 
                      className="relative w-13 h-13 sm:w-14 sm:h-14 rounded-xl overflow-hidden shadow-md shrink-0 border border-white/10 cursor-pointer active:scale-95 transition-transform"
                      onClick={onClose}
                      title="Tap to return to player"
                    >
                      {currentTrack.coverArtUrl ? (
                        <img src={currentTrack.coverArtUrl} alt={currentTrack.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                          <ListMusic size={22} className="text-zinc-600" />
                        </div>
                      )}
                      {isPlaying && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                          <div className="flex items-end gap-[2.5px] h-3.5">
                            {[0, 1, 2].map(i => (
                              <div key={i} className="w-[2.5px] rounded-full bg-white eq-bar shadow-[0_0_6px_rgba(255,255,255,0.6)]" style={{ height: '100%' }} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Title & Artist */}
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={onClose}
                      title="Tap to return to player"
                    >
                      <p className="text-[15px] font-bold text-white truncate tracking-tight">
                        {currentTrack.title}
                      </p>
                      <p className="text-[13px] text-zinc-400 font-medium truncate mt-0.5">
                        {currentTrack.artist}
                      </p>
                    </div>

                    {/* Like Button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleLikedSong(currentTrack); }}
                      className={`p-2 rounded-full transition-all active:scale-90 ${
                        isLiked ? 'text-[#ff3366]' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                      aria-label="Like track"
                    >
                      <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  {/* Middle Row: Track Scrubber / Progress Bar on Mobile */}
                  <div className="w-full flex flex-col gap-1 px-0.5 pt-1">
                    <div className="relative h-4 flex items-center cursor-pointer touch-none">
                      <input 
                        type="range" 
                        min={0} 
                        max={duration || 100} 
                        value={displayProgress}
                        onMouseDown={handleSliderStart}
                        onTouchStart={handleSliderStart}
                        onChange={(e) => handleSliderChange(Number(e.target.value))}
                        onMouseUp={handleSliderEnd}
                        onTouchEnd={handleSliderEnd}
                        className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
                      />
                      <div className="absolute left-0 right-0 h-1 bg-white/10 rounded-full" />
                      <div 
                        className="absolute left-0 h-1 bg-white rounded-full pointer-events-none" 
                        style={{ width: `${Math.min(100, (displayProgress / (duration || 1)) * 100)}%` }} 
                      />
                      <div 
                        className={`absolute w-3 h-3 bg-white rounded-full shadow-md pointer-events-none -ml-1.5 ${isDragging ? 'scale-125' : 'scale-100'} transition-transform`}
                        style={{ left: `${Math.min(100, (displayProgress / (duration || 1)) * 100)}%` }} 
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-zinc-400 tabular-nums font-medium">
                      <span>{formatTime(displayProgress)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Bottom Row: Transport Controls */}
                  <div className="flex items-center justify-between w-full pt-1.5 border-t border-white/[0.06]">
                    <button 
                      onClick={toggleShuffle} 
                      className={`p-2 transition-all active:scale-90 rounded-full ${
                        isShuffled ? 'text-[#ff3366] bg-[#ff3366]/10' : 'text-zinc-400 hover:text-white'
                      }`}
                      title="Shuffle"
                    >
                      <Shuffle size={18} />
                    </button>

                    <div className="flex items-center gap-4">
                      <button 
                        onClick={prev} 
                        className="p-1.5 text-zinc-300 hover:text-white transition-all active:scale-90"
                        title="Previous"
                      >
                        <SkipBack size={22} fill="currentColor" />
                      </button>

                      <button 
                        onClick={togglePlay} 
                        className="w-11 h-11 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_16px_rgba(255,255,255,0.25)]"
                        title={isPlaying ? "Pause" : "Play"}
                      >
                        {isPlaying ? (
                          <Pause size={18} fill="currentColor" />
                        ) : (
                          <Play size={18} fill="currentColor" className="ml-0.5" />
                        )}
                      </button>

                      <button 
                        onClick={next} 
                        className="p-1.5 text-zinc-300 hover:text-white transition-all active:scale-90"
                        title="Next"
                      >
                        <SkipForward size={22} fill="currentColor" />
                      </button>
                    </div>

                    <button 
                      onClick={toggleLoop} 
                      className={`p-2 transition-all active:scale-90 rounded-full ${
                        loopMode !== 'off' ? 'text-[#ff3366] bg-[#ff3366]/10' : 'text-zinc-400 hover:text-white'
                      }`}
                      title="Repeat"
                    >
                      {loopMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* DESKTOP Now Playing View (lg:flex) */}
              <div className="hidden lg:flex flex-col items-center justify-center w-full max-w-[380px] mx-auto py-4">
                <div className="w-full flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-[#ff3366] animate-pulse shadow-[0_0_8px_rgba(255,51,102,0.6)]" />
                  <span className="text-[12px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Now Playing</span>
                </div>

                {/* Artwork */}
                <div className="relative w-full aspect-square rounded-3xl overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.65)] border border-white/10 group mb-5">
                  {currentTrack.coverArtUrl ? (
                    <img 
                      src={currentTrack.coverArtUrl} 
                      alt={currentTrack.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                      <ListMusic size={64} className="text-zinc-700" />
                    </div>
                  )}
                  {isPlaying && (
                    <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1.5 shadow-lg">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="w-[3px] rounded-full bg-white eq-bar shadow-[0_0_6px_rgba(255,255,255,0.6)]" style={{ height: '14px' }} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Track Info + Like */}
                <div className="w-full flex items-center justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-2xl font-bold text-white tracking-tight truncate">
                      {currentTrack.title}
                    </h3>
                    <p className="text-base text-zinc-400 font-medium truncate mt-0.5">
                      {currentTrack.artist}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleLikedSong(currentTrack)}
                    className={`p-3 rounded-full transition-all hover:scale-110 active:scale-95 hover:bg-white/[0.08] ${
                      isLiked ? 'text-[#ff3366]' : 'text-zinc-500 hover:text-white'
                    }`}
                    title={isLiked ? "Unlike" : "Like"}
                  >
                    <Heart size={24} fill={isLiked ? 'currentColor' : 'none'} />
                  </button>
                </div>

                {/* Track Progress Scrubber */}
                <div className="w-full flex flex-col gap-1.5 mb-5 group">
                  <div className="relative h-6 flex items-center cursor-pointer touch-none">
                    <input 
                      type="range" 
                      min={0} 
                      max={duration || 100} 
                      value={displayProgress}
                      onMouseDown={handleSliderStart}
                      onTouchStart={handleSliderStart}
                      onChange={(e) => handleSliderChange(Number(e.target.value))}
                      onMouseUp={handleSliderEnd}
                      onTouchEnd={handleSliderEnd}
                      className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
                    />
                    {/* Background Track */}
                    <div className="absolute left-0 right-0 h-1.5 bg-white/10 rounded-full group-hover:h-2 transition-all duration-200" />
                    {/* Filled Track */}
                    <div 
                      className="absolute left-0 h-1.5 bg-white rounded-full pointer-events-none group-hover:h-2 transition-all duration-200"
                      style={{ width: `${Math.min(100, (displayProgress / (duration || 1)) * 100)}%` }}
                    />
                    {/* Draggable Knob */}
                    <div 
                      className={`absolute w-3.5 h-3.5 bg-white rounded-full shadow-lg pointer-events-none -ml-[7px] ${
                        isDragging ? 'scale-125 opacity-100' : 'scale-75 opacity-0 group-hover:opacity-100 group-hover:scale-100'
                      } transition-all duration-150`}
                      style={{ left: `${Math.min(100, (displayProgress / (duration || 1)) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-mono font-medium text-zinc-400 tabular-nums">
                    <span>{formatTime(displayProgress)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Transport Controls */}
                <div className="flex items-center justify-between w-full px-2 mb-5">
                  <button 
                    onClick={toggleShuffle} 
                    className={`p-3 rounded-full transition-all hover:scale-110 active:scale-95 ${
                      isShuffled ? 'text-[#ff3366] bg-[#ff3366]/10' : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                    }`}
                    title="Shuffle"
                  >
                    <Shuffle size={22} />
                  </button>

                  <button 
                    onClick={prev} 
                    className="p-2 text-zinc-300 hover:text-white transition-all hover:scale-110 active:scale-90"
                    title="Previous track"
                  >
                    <SkipBack size={28} fill="currentColor" />
                  </button>

                  <button 
                    onClick={togglePlay} 
                    className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_24px_rgba(255,255,255,0.35)]"
                    title={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <Pause size={24} fill="currentColor" />
                    ) : (
                      <Play size={24} fill="currentColor" className="ml-1" />
                    )}
                  </button>

                  <button 
                    onClick={next} 
                    className="p-2 text-zinc-300 hover:text-white transition-all hover:scale-110 active:scale-90"
                    title="Next track"
                  >
                    <SkipForward size={28} fill="currentColor" />
                  </button>

                  <button 
                    onClick={toggleLoop} 
                    className={`p-3 rounded-full transition-all hover:scale-110 active:scale-95 ${
                      loopMode !== 'off' ? 'text-[#ff3366] bg-[#ff3366]/10' : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                    }`}
                    title="Repeat"
                  >
                    {loopMode === 'one' ? <Repeat1 size={22} /> : <Repeat size={22} />}
                  </button>
                </div>

                {/* Volume Control */}
                <div className="flex items-center gap-3 w-full max-w-[280px] pt-1 text-zinc-400">
                  <button 
                    onClick={() => setVolume(volume === 0 ? 1 : 0)}
                    className="hover:text-white transition-colors p-1"
                    title={volume === 0 ? "Unmute" : "Mute"}
                  >
                    <VolumeIcon size={18} />
                  </button>
                  <div className="flex-1 relative h-5 flex items-center cursor-pointer group/vol">
                    <input 
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
                    />
                    <div className="absolute left-0 right-0 h-1 bg-white/10 rounded-full group-hover/vol:h-1.5 transition-all" />
                    <div 
                      className="absolute left-0 h-1 bg-zinc-300 group-hover/vol:bg-white rounded-full pointer-events-none group-hover/vol:h-1.5 transition-all" 
                      style={{ width: `${volume * 100}%` }} 
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="w-full text-center py-10">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-3 text-zinc-500">
                <ListMusic size={24} />
              </div>
              <p className="text-zinc-400 font-medium text-sm">No track currently playing</p>
            </div>
          )}
        </div>

        {/* Right Side: Clean Queue List (Removed next up layer) */}
        <div className="w-full lg:w-[58%] xl:w-[62%] flex-1 min-h-0 flex flex-col overflow-y-auto custom-scrollbar px-4 sm:px-6 md:px-10 lg:px-10 pt-4 lg:pt-8 pb-32 lg:pb-12">
          <div className="w-full max-w-4xl mx-auto">
            {nextUpIndices.length === 0 ? (
              <div className="text-center py-24 px-4 border border-white/[0.04] rounded-2xl bg-white/[0.02] backdrop-blur-md">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-3 text-zinc-500">
                  <ListMusic size={24} />
                </div>
                <p className="text-[15px] font-bold text-zinc-300">Your queue is empty</p>
                <p className="text-[13px] font-medium text-zinc-500 mt-1">Add songs from Search or Library to play them next!</p>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="queue-list">
                  {(provided) => (
                    <div 
                      className="space-y-1.5 sm:space-y-2"
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                    >
                      {nextUpIndices.map((originalIndex, displayIdx) => {
                        const track = queue[originalIndex];
                        if (!track) return null;

                        return (
                          <Draggable key={`${track.id}-${originalIndex}-${displayIdx}`} draggableId={`${track.id}-${originalIndex}-${displayIdx}`} index={displayIdx}>
                            {(provided, snapshot) => (
                              <div 
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`group flex items-center gap-2.5 sm:gap-3.5 px-2.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl cursor-pointer transition-all duration-200 ${
                                  snapshot.isDragging 
                                    ? 'bg-white/15 shadow-2xl scale-[1.02] border-white/20 z-50' 
                                    : 'hover:bg-white/[0.05] border-transparent hover:border-white/[0.06] active:bg-white/[0.08]'
                                } border`}
                                onClick={() => playTrack(originalIndex)}
                              >
                                {/* Drag Handle */}
                                <div 
                                  {...provided.dragHandleProps} 
                                  className="p-1.5 text-zinc-600 hover:text-white cursor-grab active:cursor-grabbing opacity-50 group-hover:opacity-100 transition-opacity touch-none shrink-0"
                                  onClick={(e) => e.stopPropagation()}
                                  title="Drag to reorder"
                                >
                                  <GripVertical size={16} />
                                </div>
                                
                                {/* Number / Hover Play (Desktop/Tablet) */}
                                <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0 border border-white/[0.06] group-hover:bg-white/10 group-hover:border-white/20 transition-all relative overflow-hidden hidden sm:flex">
                                  <span className="text-[12px] font-mono font-medium text-zinc-400 group-hover:opacity-0 transition-opacity tabular-nums">
                                    {displayIdx + 1}
                                  </span>
                                  <Play size={12} className="absolute text-white opacity-0 group-hover:opacity-100 transition-opacity ml-0.5" fill="currentColor" />
                                </div>
                                
                                {/* Artwork */}
                                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-zinc-900 shrink-0 shadow-sm border border-white/[0.06]">
                                  {track.coverArtUrl ? (
                                    <img src={track.coverArtUrl} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <ListMusic size={18} className="text-zinc-700" />
                                    </div>
                                  )}
                                </div>
                                
                                {/* Track Info */}
                                <div className="flex-1 min-w-0 pr-2">
                                  <p className="font-semibold text-[14px] sm:text-[15px] tracking-tight text-white truncate group-hover:text-white transition-colors">
                                    {track.title}
                                  </p>
                                  <p className="text-[12px] sm:text-[13px] font-medium text-zinc-400 truncate mt-0.5 group-hover:text-zinc-300 transition-colors">
                                    {track.artist}
                                  </p>
                                </div>
                                
                                {/* Duration */}
                                {track.duration && (
                                  <div className="hidden sm:block text-[12px] text-zinc-500 font-mono font-medium pr-2 group-hover:text-zinc-400 transition-colors tabular-nums">
                                    {formatTime(track.duration)}
                                  </div>
                                )}

                                {/* Remove Track Button */}
                                <button 
                                  onClick={(e) => { e.stopPropagation(); removeFromQueue(originalIndex); }}
                                  className="w-9 h-9 rounded-full flex shrink-0 items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-all active:scale-90"
                                  title="Remove from queue"
                                  aria-label="Remove from queue"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
