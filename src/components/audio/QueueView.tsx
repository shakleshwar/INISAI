import { X, Play, Pause, Trash2, ListMusic, SkipBack, SkipForward, GripVertical } from 'lucide-react';
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
  const { queue, currentIndex, isPlaying, togglePlay, prev, next, playTrack, removeFromQueue, clearQueue, shuffleOrder, isShuffled, reorderNextUp } = useAudioStore();

  const currentTrack = currentIndex >= 0 ? queue[currentIndex] : null;

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
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#030304]/90 backdrop-blur-[30px] animate-fade-in overflow-hidden">
      {/* Background artwork blur */}
      {currentTrack?.coverArtUrl && (
        <>
          <div 
            className="absolute inset-0 opacity-30 pointer-events-none scale-110 transition-all duration-1000 mix-blend-screen"
            style={{ 
              backgroundImage: `url(${currentTrack.coverArtUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(100px) saturate(150%)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#030304]/60 via-[#030304]/80 to-[#030304] pointer-events-none" />
        </>
      )}

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-8 py-8 md:px-12 md:py-10">
        <h2 className="text-3xl font-black text-white flex items-center gap-4 tracking-tight">
          <ListMusic size={28} className="text-white" />
          Queue
        </h2>
        <button 
          onClick={onClose}
          className="p-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-full text-white transition-all duration-300 active:scale-90"
        >
          <X size={24} />
        </button>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto px-8 md:px-12 pb-32 custom-scrollbar">
        <div className="max-w-4xl mx-auto">
          {/* Now Playing */}
          {currentTrack && (
            <div className="mb-12">
              <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
                Now Playing
              </h3>
              <div className="flex items-center gap-5 p-4 md:p-5 rounded-2xl bg-white/10 border border-white/20 shadow-[0_8px_32px_rgba(255,255,255,0.05)] group transform-style-3d hover:[transform:rotateX(2deg)_rotateY(-2deg)_scale(1.01)] transition-all duration-500 cursor-pointer" onClick={onClose}>
                <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.4)] shrink-0 border border-white/[0.06]">
                  {currentTrack.coverArtUrl ? (
                    <img src={currentTrack.coverArtUrl} alt={currentTrack.title} className="w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                      <ListMusic size={32} className="text-zinc-600" />
                    </div>
                  )}
                  {isPlaying && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                      <div className="flex items-end gap-[4px] h-5">
                        {[0,1,2].map(i => (
                          <div key={i} className="w-[3px] rounded-full bg-white eq-bar shadow-[0_0_8px_rgba(255,255,255,0.4)]" style={{ height: '100%' }} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-xl md:text-2xl font-bold text-white truncate tracking-tight">{currentTrack.title}</p>
                  <p className="text-[15px] text-zinc-300 font-medium truncate mt-1">{currentTrack.artist}</p>
                </div>
                
                {/* Transport Controls in Queue */}
                <div className="hidden sm:flex items-center gap-4 bg-white/5 border border-white/10 rounded-full px-4 py-2 shrink-0 mr-4" onClick={(e) => e.stopPropagation()}>
                  <button onClick={prev} className="text-zinc-400 hover:text-white transition-colors active:scale-90">
                    <SkipBack size={18} fill="currentColor" />
                  </button>
                  <button onClick={togglePlay} className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-all active:scale-95 shadow-[0_0_16px_rgba(255,255,255,0.2)]">
                    {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
                  </button>
                  <button onClick={next} className="text-zinc-400 hover:text-white transition-colors active:scale-90">
                    <SkipForward size={18} fill="currentColor" />
                  </button>
                </div>

                {currentTrack.duration && (
                  <div className="text-[13px] text-white/70 font-mono-nums font-bold pr-2 hidden sm:block">
                    {formatTime(currentTrack.duration)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Next In Queue */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Next Up</h3>
              {nextUpIndices.length > 0 && (
                <button 
                  onClick={() => clearQueue()}
                  className="text-[11px] font-bold text-red-400 hover:text-red-300 transition-colors bg-red-400/10 hover:bg-red-400/20 border border-red-400/20 px-4 py-2 rounded-full uppercase tracking-wider active:scale-95"
                >
                  Clear Queue
                </button>
              )}
            </div>

            {nextUpIndices.length === 0 ? (
              <div className="text-center py-20 border border-white/[0.04] rounded-2xl bg-[var(--color-surface-50)]/50 backdrop-blur-md">
                <p className="text-[15px] font-bold text-zinc-400">Your queue is empty.</p>
                <p className="text-[13px] font-medium text-zinc-500 mt-1">Add songs to play them next!</p>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="queue-list">
                  {(provided) => (
                    <div 
                      className="space-y-2"
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
                                className={`group flex items-center gap-3 md:gap-4 px-2 md:px-4 py-3 md:py-4 rounded-2xl cursor-pointer transition-all duration-300 ${snapshot.isDragging ? 'bg-white/10 shadow-2xl scale-[1.02] border-white/20' : 'hover:bg-white/[0.04] border-transparent hover:border-white/[0.06] library-card-appear hover:shadow-lg'} border`}
                                style={{ 
                                  ...provided.draggableProps.style,
                                  animationDelay: snapshot.isDragging ? '0ms' : `${displayIdx * 20}ms` 
                                }}
                                onClick={() => playTrack(originalIndex)}
                              >
                                <div 
                                  {...provided.dragHandleProps} 
                                  className="p-2 text-zinc-600 hover:text-white cursor-grab active:cursor-grabbing opacity-50 group-hover:opacity-100 transition-opacity md:w-8 flex justify-center shrink-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <GripVertical size={16} />
                                </div>
                                
                                <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0 border border-white/[0.06] group-hover:bg-white/10 group-hover:border-white/20 transition-all relative overflow-hidden hidden sm:flex">
                                  <span className="text-[13px] font-mono-nums font-bold text-zinc-500 group-hover:opacity-0 transition-opacity tabular-nums">{displayIdx + 1}</span>
                                  <Play size={14} className="absolute text-white opacity-0 group-hover:opacity-100 transition-opacity ml-1" fill="currentColor" />
                                </div>
                                
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl overflow-hidden bg-zinc-900 shrink-0 shadow-md border border-white/[0.04]">
                                  {track.coverArtUrl ? (
                                    <img src={track.coverArtUrl} alt={track.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <ListMusic size={18} className="text-zinc-700" />
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex-1 min-w-0 pr-2 md:pr-4">
                                  <p className="font-bold text-[14px] md:text-[15px] tracking-tight text-white truncate group-hover:text-white transition-colors">
                                    {track.title}
                                  </p>
                                  <p className="text-[12px] md:text-[13px] font-medium text-zinc-500 truncate mt-0.5 group-hover:text-zinc-400 transition-colors">
                                    {track.artist}
                                  </p>
                                </div>
                                
                                {track.duration && (
                                  <div className="hidden md:block text-[13px] text-zinc-600 font-mono-nums font-bold pr-4 group-hover:text-zinc-400 transition-colors">
                                    {formatTime(track.duration)}
                                  </div>
                                )}

                                <button 
                                  onClick={(e) => { e.stopPropagation(); removeFromQueue(originalIndex); }}
                                  className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-all md:opacity-0 group-hover:opacity-100 active:scale-90"
                                  title="Remove from queue"
                                >
                                  <Trash2 size={18} />
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
