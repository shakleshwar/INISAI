import { useState } from 'react';
import { Play, Pause, Music, Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TrackContextMenu } from '../../components/ui/TrackContextMenu';
import type { Track } from '../../types';

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '—';
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
  const [isExpanded, setIsExpanded] = useState(false);

  if (rankedTracks.length === 0) return null;

  const displayTracks = isExpanded ? rankedTracks : rankedTracks.slice(0, 6);

  return (
    <section className={`transition-opacity duration-500 ${isTrendingLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.6)]"/>
          <h2 className="text-[12px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
            Top Charts • {regionLabel}
          </h2>
        </div>
        {rankedTracks.length > 6 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-white/[0.04]"
          >
            <span>{isExpanded ? 'Show Less' : `View All (${rankedTracks.length})`}</span>
            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        )}
      </div>

      <div className="space-y-1">
        {displayTracks.map((track, index) => {
          const playing = isTrackPlaying(index);
          const isLiked = (likedSongs || []).some(t => t.id === track.id);
          const isTopThree = index < 3;
          
          return (
            <div 
              key={track.id + '-rank-' + index}
              onClick={() => onPlayTrack(index)}
              className={`group flex items-center gap-3 sm:gap-4 px-2.5 sm:px-3.5 py-2.5 rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-300 stagger-in ${
                playing 
                  ? 'bg-white/[0.08] border border-white/20 shadow-[0_4px_24px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.15)] ring-1 ring-white/10' 
                  : 'hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06]'
              }`}
              style={{ animationDelay: `${index * 25}ms` }}
            >
              {/* Rank Number or Equalizer */}
              <div className="w-6 sm:w-7 flex justify-center shrink-0">
                {playing ? (
                  <div className="flex items-end justify-center gap-[2.5px] h-3.5 mx-auto">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-[2.5px] rounded-full bg-white eq-bar" style={{ height: '100%' }} />
                    ))}
                  </div>
                ) : (
                  <span className={`text-[13px] sm:text-[14px] font-mono font-semibold tabular-nums transition-colors ${
                    isTopThree 
                      ? 'text-white' 
                      : 'text-zinc-600 group-hover:text-zinc-400'
                  }`}>
                    <span className="tabular-nums">{index + 1}</span>
                  </span>
                )}
              </div>
              
              {/* Artwork */}
              <div className="w-[46px] h-[46px] sm:w-[50px] sm:h-[50px] rounded-lg sm:rounded-xl overflow-hidden bg-zinc-900 shrink-0 shadow-md ring-1 ring-white/[0.08] relative">
                {track.coverArtUrl ? (
                  <img src={track.coverArtUrl} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" loading="lazy"/>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music size={18} className="text-zinc-700"/>
                  </div>
                )}
                <div className={`absolute inset-0 bg-black/45 backdrop-blur-[1px] flex items-center justify-center transition-opacity duration-200 ${playing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  {playing ? (
                    <Pause size={16} fill="white" className="drop-shadow-md text-white"/>
                  ) : (
                    <Play size={16} fill="white" className="ml-0.5 drop-shadow-md text-white scale-95 group-hover:scale-100 transition-transform"/>
                  )}
                </div>
              </div>

              {/* Track Info */}
              <div className="flex-1 min-w-0 pr-2">
                <p className={`font-bold text-[13px] sm:text-[14px] tracking-tight truncate leading-snug transition-colors ${playing ? 'text-white' : 'text-zinc-200 group-hover:text-white'}`}>
                  {track.title}
                </p>
                <p 
                  className="text-[11px] sm:text-[12px] font-medium text-zinc-500 truncate mt-0.5 group-hover:text-zinc-400 transition-colors hover:underline hover:text-white cursor-pointer inline-block"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/albums', { state: { artist: track.artist } });
                  }}
                >
                  {track.artist}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 sm:gap-2">
                <button 
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-150 active:scale-[0.96] cursor-pointer ${
                    isLiked 
                      ? 'text-white opacity-100' 
                      : 'text-zinc-600 hover:text-white md:opacity-0 group-hover:opacity-100 hover:bg-white/[0.06]'
                  }`}
                  onClick={(e) => { e.stopPropagation(); toggleLikedSong?.(track); }}
                  title={isLiked ? 'Remove from Liked' : 'Save to Liked'}
                >
                  <Heart size={15} className={isLiked ? "fill-white text-white" : ""} />
                </button>
                <span className="text-[11px] sm:text-[12px] font-medium font-mono text-zinc-600 tabular-nums w-10 text-right group-hover:text-zinc-400 transition-colors hidden sm:block">
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
