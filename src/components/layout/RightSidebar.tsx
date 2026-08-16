import { useAudioStore } from '../../store/useAudioStore';
import { Play, Music, ListMusic } from 'lucide-react';
import { useState } from 'react';

export function RightSidebar() {
  const { queue, currentIndex, playTrack } = useAudioStore();
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return (
      <div className="w-12 border-l border-white/[0.02] bg-[#050505] flex flex-col items-center py-6 hidden xl:flex shrink-0">
        <button onClick={() => setIsOpen(true)} className="text-zinc-500 hover:text-white transition-colors" title="Expand Queue">
          <ListMusic size={20} />
        </button>
      </div>
    );
  }

  const currentTrack = currentIndex >= 0 ? queue[currentIndex] : null;
  const nextTracks = queue.slice(currentIndex + 1, currentIndex + 11); // Show next 10

  return (
    <aside className="w-[280px] bg-[#050505] hidden xl:flex flex-col h-full shrink-0 border-l border-white/[0.02] shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-10 relative">
      <div className="p-6 pb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold tracking-widest uppercase text-white">Coming Next</h2>
        <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
          <ListMusic size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-6">
        {/* Now Playing Mini Card */}
        {currentTrack && (
          <div className="mb-6 bg-gradient-to-br from-blue-900/10 to-purple-900/10 p-4 rounded-2xl border border-white/5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-500/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mb-3">Now Playing</p>
              <div className="aspect-square rounded-xl bg-zinc-800/50 shadow-lg overflow-hidden border border-white/5 mb-3">
                {currentTrack.coverArtUrl ? (
                  <img src={currentTrack.coverArtUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Music size={24} className="text-zinc-600" /></div>
                )}
              </div>
              <h3 className="font-bold text-white text-sm truncate">{currentTrack.title}</h3>
              <p className="text-xs text-zinc-400 truncate mt-0.5">{currentTrack.artist}</p>
            </div>
          </div>
        )}

        {/* Up Next List */}
        <div className="space-y-1">
          {nextTracks.map((track, idx) => (
            <div 
              key={track.id + idx}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors"
              onClick={() => playTrack(currentIndex + 1 + idx)}
            >
              <div className="w-10 h-10 rounded-md bg-zinc-800 shrink-0 overflow-hidden relative border border-white/5">
                {track.coverArtUrl ? (
                  <img src={track.coverArtUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Music size={14} className="text-zinc-600" /></div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Play size={14} fill="currentColor" className="text-white ml-0.5" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-200 group-hover:text-white truncate">{track.title}</p>
                <p className="text-[11px] text-zinc-500 truncate">{track.artist}</p>
              </div>
            </div>
          ))}
          {nextTracks.length === 0 && (
            <div className="text-center py-10 text-zinc-500 text-sm">
              Queue is empty
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
