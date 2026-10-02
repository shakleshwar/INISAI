import { Play, Pause, Music, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TrackContextMenu } from '../../components/ui/TrackContextMenu';
import type { Track } from '../../types';

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '3:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface TopTracksListProps {
  regionLabel: string;
  isTrendingLoading: boolean;
  rankedTracks: Track[];
  likedSongs: Track[];
  onPlayTrack: (index: number) => void;
  isTrackPlaying: (index: number) => boolean;
  toggleLikedSong: (track: Track) => void;
}

export function TopTracksList({
  regionLabel,
  isTrendingLoading,
  rankedTracks,
  likedSongs,
  onPlayTrack,
  isTrackPlaying,
  toggleLikedSong
}: TopTracksListProps) {
  const navigate = useNavigate();

  if (rankedTracks.length === 0) return null;

  return (
    <section className={`transition-opacity duration-500 ${isTrendingLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
      <h2 className="text-[12px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.5)]"/>
        Top {regionLabel}
      </h2>
      <div className="space-y-1">
        {rankedTracks.map((track, index) => {
          const playing = isTrackPlaying(index);
          const isLiked = (likedSongs || []).some(t => t.id === track.id);
          
          return (
            <div 
              key={track.id + 'rank' + index}
              onClick={() => onPlayTrack(index)}
              className={`group flex items-center gap-4 px-3 py-2.5 md:py-3 rounded-2xl cursor-pointer transition-all duration-300 library-card-appear ${
                playing 
                  ? 'bg-white/10 border border-white/20 shadow-[0_4px_20px_rgba(255,255,255,0.1)]' 
                  : 'hover:bg-white/[0.03] border border-transparent hover:border-white/[0.04]'
              }`}
              style={{ animationDelay: `${index * 15}ms` }}
            >
              {/* Rank Number or Equalizer */}
              <div className="w-8 flex justify-center shrink-0">
                {playing ? (
                  <div className="flex items-end justify-center gap-[2px] h-4 mx-auto">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-[2px] rounded-full bg-white eq-bar" style={{ height: '100%' }} />
                    ))}
                  </div>
                ) : (
                  <span className={`text-[15px] font-mono font-semibold ${index < 3 ? 'text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.5)]' : 'text-zinc-600 group-hover:text-zinc-400'} transition-colors`}>
                    {index + 1}
                  </span>
                )}
              </div>
              
              {/* Artwork */}
              <div className="w-[52px] h-[52px] md:w-14 md:h-14 rounded-xl overflow-hidden bg-zinc-900 shrink-0 shadow-md border border-white/[0.06] relative">
                {track.coverArtUrl ? (
                  <img src={track.coverArtUrl} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" loading="lazy"/>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music size={20} className="text-zinc-700"/>
                  </div>
                )}
                <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 backdrop-blur-[2px] ${playing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  {playing ? <Pause size={20} fill="white" className="drop-shadow-lg"/> : <Play size={20} fill="white" className="ml-1 drop-shadow-lg scale-90 group-hover:scale-100 transition-transform duration-300"/>}
                </div>
              </div>

              {/* Track Info */}
              <div className="flex-1 min-w-0 pr-4">
                <p className={`font-bold text-[15px] tracking-tight truncate transition-colors ${playing ? 'text-white' : 'text-zinc-100 group-hover:text-white'}`}>
                  {track.title}
                </p>
                <p 
                  className="text-[13px] font-medium text-zinc-500 truncate mt-0.5 group-hover:text-zinc-400 transition-colors hover:underline hover:text-white cursor-pointer inline-block"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/albums', { state: { artist: track.artist } });
                  }}
                >
                  {track.artist}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 md:gap-3">
                <button 
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 md:opacity-0 group-hover:opacity-100 ${
                    isLiked 
                      ? 'text-white bg-white/10 md:opacity-100' 
                      : 'text-zinc-500 hover:text-white hover:bg-white/[0.06]'
                  }`}
                  onClick={(e) => { e.stopPropagation(); toggleLikedSong?.(track); }}
                >
                  <Heart size={18} className={isLiked ? "fill-white" : ""} />
                </button>
                <span className="text-[12px] font-medium font-mono text-zinc-600 tabular-nums w-10 text-right group-hover:text-zinc-400 transition-colors hidden sm:block">
                  {formatDuration(track.duration || 0)}
                </span>
                <div onClick={e => e.stopPropagation()} className="md:opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <TrackContextMenu track={track} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
