import { useAudioStore } from '../../store/useAudioStore';
import { Play, Music, ListMusic } from 'lucide-react';
import { useState } from 'react';

export function RightSidebar() {
  const { queue, currentIndex, playTrack } = useAudioStore();
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return (
      <div className="w-14 border-l border-white/[0.04] bg-[var(--color-surface-50)]/80 backdrop-blur-sm flex flex-col items-center py-6 hidden xl:flex shrink-0 transition-all duration-300">
        <button 
          onClick={() => setIsOpen(true)} 
          className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-zinc-500 hover:text-white transition-all duration-300 border border-transparent hover:border-white/[0.06] shadow-sm hover:shadow-md cursor-pointer" 
          title="Expand Queue"
        >
          <ListMusic size={18} className="transition-transform duration-300 hover:scale-110" />
        </button>
      </div>
    );
  }

  const currentTrack = currentIndex >= 0 ? queue[currentIndex] : null;
  const nextTracks = queue.slice(currentIndex + 1, currentIndex + 11); // Show next 10

  return (
    <aside className="w-[280px] bg-[var(--color-surface-50)]/80 backdrop-blur-sm hidden xl:flex flex-col h-full shrink-0 border-l border-white/[0.04] z-10 relative transition-all duration-300">
      <div className="px-6 py-5 flex items-center justify-between border-b border-white/[0.02]">
        <h2 className="text-[10px] font-bold tracking-[0.18em] uppercase text-zinc-500">Coming Next</h2>
        <button 
          onClick={() => setIsOpen(false)} 
          className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-all duration-300 cursor-pointer"
        >
          <ListMusic size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-6 pt-4">
        {/* Now Playing Mini Card */}
        {currentTrack && (
          <div className="mb-6 p-4 rounded-2xl glass-surface-elevated border border-white/[0.08] relative overflow-hidden group">
            {/* Dynamic blurred background based on artwork if we had it, but using a brand subtle glow instead */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] text-white font-bold uppercase tracking-wider flex items-center gap-2">
                  Now Playing
                </p>
                {/* Micro EQ animation */}
                <div className="flex items-end gap-[2px] h-3">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-[2px] rounded-full bg-white eq-bar" style={{ height: '100%' }} />
                  ))}
                </div>
              </div>
              
              <div className="aspect-square rounded-xl bg-zinc-900 shadow-xl overflow-hidden border border-white/10 mb-3 relative group-hover:shadow-[0_8px_24px_rgba(255,255,255,0.15)] transition-all duration-500">
                {currentTrack.coverArtUrl ? (
                  <img src={currentTrack.coverArtUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Music size={24} className="text-zinc-600" /></div>
                )}
                {/* Glare effect */}
                <div className="absolute inset-0 glare-effect pointer-events-none" />
              </div>
              <h3 className="font-semibold text-white text-[13px] truncate drop-shadow-sm">{currentTrack.title}</h3>
              <p className="text-[11px] text-zinc-400 truncate mt-0.5 font-medium">{currentTrack.artist}</p>
            </div>
          </div>
        )}

        {/* Up Next List */}
        <div className="space-y-1 relative">
          {/* Subtle line connecting queue items */}
          {nextTracks.length > 0 && (
            <div className="absolute left-6 top-4 bottom-4 w-px bg-white/[0.03] z-0" />
          )}
          
          {nextTracks.map((track, idx) => (
            <div 
              key={track.id + idx}
              className="relative z-10 flex items-center gap-3.5 p-2 rounded-xl hover:bg-white/[0.04] cursor-pointer group transition-all duration-300 hover:pl-3"
              onClick={() => playTrack(currentIndex + 1 + idx)}
            >
              <div className="w-10 h-10 rounded-[10px] bg-zinc-900 shrink-0 overflow-hidden relative border border-white/[0.05] shadow-sm group-hover:border-white/10 group-hover:shadow-md transition-all duration-300">
                {track.coverArtUrl ? (
                  <img src={track.coverArtUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Music size={14} className="text-zinc-600" /></div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 backdrop-blur-[2px]">
                  <Play size={14} fill="currentColor" className="text-white ml-0.5 scale-75 group-hover:scale-100 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                </div>
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center h-10">
                <p className="text-[13px] font-medium text-zinc-300 group-hover:text-white truncate transition-colors duration-300">{track.title}</p>
                <p className="text-[11px] text-zinc-500 group-hover:text-zinc-400 truncate mt-0.5 transition-colors duration-300">{track.artist}</p>
              </div>
            </div>
          ))}
          {nextTracks.length === 0 && (
            <div className="text-center py-12 text-zinc-500 text-[13px] font-medium border border-dashed border-white/[0.05] rounded-xl bg-white/[0.01]">
              Queue is empty
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
