import { X, Play, Trash2, ListMusic } from 'lucide-react';
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
  const { queue, currentIndex, isPlaying, playTrack, removeFromQueue, clearQueue, shuffleOrder, isShuffled } = useAudioStore();

  const currentTrack = currentIndex >= 0 ? queue[currentIndex] : null;

  // Next up tracks
  const nextUpIndices = [];
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

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/80 backdrop-blur-3xl animate-in fade-in slide-in-from-bottom-10 duration-500 overflow-hidden">
      {/* Background artwork blur */}
      {currentTrack?.coverArtUrl && (
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none scale-110 transition-all duration-1000"
          style={{ 
            backgroundImage: `url(${currentTrack.coverArtUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(80px)',
          }}
        />
      )}

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-8 py-6">
        <h2 className="text-2xl font-black text-white flex items-center gap-3">
          <ListMusic size={24} className="text-blue-400" />
          Queue
        </h2>
        <button 
          onClick={onClose}
          className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-zinc-400 hover:text-white transition-all duration-300"
        >
          <X size={24} />
        </button>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto px-8 pb-32 no-scrollbar">
        <div className="max-w-4xl mx-auto">
          {/* Now Playing */}
          {currentTrack && (
            <div className="mb-10">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Now Playing</h3>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.04] border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.1)] group">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-lg shrink-0">
                  {currentTrack.coverArtUrl ? (
                    <img src={currentTrack.coverArtUrl} alt={currentTrack.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                      <ListMusic size={24} className="text-zinc-600" />
                    </div>
                  )}
                  {isPlaying && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                      <div className="flex items-end gap-[3px] h-4">
                        {[0,1,2].map(i => (
                          <div key={i} className="w-[3px] rounded-full bg-blue-400 eq-bar" style={{ height: '100%' }} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-bold text-blue-400 truncate">{currentTrack.title}</p>
                  <p className="text-sm text-zinc-400 truncate">{currentTrack.artist}</p>
                </div>
                {currentTrack.duration && (
                  <div className="text-sm text-zinc-500 font-medium tabular-nums pr-2">
                    {formatTime(currentTrack.duration)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Next In Queue */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Next Up</h3>
              {nextUpIndices.length > 0 && (
                <button 
                  onClick={() => clearQueue()}
                  className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors bg-red-400/10 px-3 py-1.5 rounded-full"
                >
                  Clear Queue
                </button>
              )}
            </div>

            {nextUpIndices.length === 0 ? (
              <div className="text-center py-16 border border-white/5 rounded-2xl bg-white/[0.02]">
                <p className="text-zinc-500 font-medium">Your queue is empty.</p>
                <p className="text-sm text-zinc-600 mt-1">Add songs to play them next!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {nextUpIndices.map((originalIndex, displayIdx) => {
                  const track = queue[originalIndex];
                  if (!track) return null;

                  return (
                    <div 
                      key={originalIndex + '-' + displayIdx}
                      className="group flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 hover:bg-white/[0.06] border border-transparent hover:border-white/5"
                      onClick={() => playTrack(originalIndex)}
                    >
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/5 group-hover:bg-white/10 transition-colors relative overflow-hidden">
                        <span className="text-xs font-bold text-zinc-500 group-hover:opacity-0 transition-opacity tabular-nums">{displayIdx + 1}</span>
                        <Play size={12} className="absolute text-white opacity-0 group-hover:opacity-100 transition-opacity ml-0.5" fill="currentColor" />
                      </div>
                      
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 shrink-0 shadow-md">
                        {track.coverArtUrl ? (
                          <img src={track.coverArtUrl} alt={track.title} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ListMusic size={16} className="text-zinc-600" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="font-bold text-sm text-white truncate group-hover:text-blue-400 transition-colors">
                          {track.title}
                        </p>
                        <p className="text-xs text-zinc-400 truncate mt-0.5 group-hover:text-zinc-300 transition-colors">
                          {track.artist}
                        </p>
                      </div>
                      
                      {track.duration && (
                        <div className="hidden md:block text-sm text-zinc-500 font-medium tabular-nums pr-2 group-hover:text-zinc-400 transition-colors">
                          {formatTime(track.duration)}
                        </div>
                      )}

                      <button 
                        onClick={(e) => { e.stopPropagation(); removeFromQueue(originalIndex); }}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                        title="Remove from queue"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
