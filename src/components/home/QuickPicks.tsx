import { Play, Music, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Track } from '../../types';

interface QuickPicksProps {
  tracks: Track[];
  likedSongs?: Track[];
  onPlayTrack: (index: number) => void;
  isTrackPlaying: (index: number) => boolean;
  toggleLikedSong?: (track: Track) => void;
}

export function QuickPicks({
  tracks,
  likedSongs = [],
  onPlayTrack,
  isTrackPlaying,
  toggleLikedSong
}: QuickPicksProps) {
  const navigate = useNavigate();
  if (!tracks || tracks.length < 4) return null;

  // Pick 6 tracks
  const picks = tracks.slice(0, 6);

  return (
    <section className="mt-4 mb-8 sm:mb-12">
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
          <h2 className="text-[12px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Quick Picks</h2>
        </div>
        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest hidden sm:inline-block">
          Tap to play
        </span>
      </div>

      {/* Grid: 2 cols on mobile, 3 cols on tablet/desktop */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3.5">
        {picks.map((track, index) => {
          const playing = isTrackPlaying(index);
          const isLiked = likedSongs.some(t => t.id === track.id);

          return (
            <div
              key={track.id + '-qp-' + index}
              onClick={() => onPlayTrack(index)}
              className={`group relative flex items-center gap-3 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl cursor-pointer select-none transition-all duration-300 active:scale-[0.98] ${
                playing
                  ? 'bg-white/[0.09] border border-white/20 shadow-[0_4px_24px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.15)] ring-1 ring-white/10'
                  : 'bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] hover:border-white/[0.12] hover:shadow-[0_8px_20px_rgba(0,0,0,0.4)]'
              }`}
            >
              {/* Artwork Container */}
              <div className="w-[46px] h-[46px] sm:w-[52px] sm:h-[52px] rounded-lg sm:rounded-xl overflow-hidden bg-zinc-900 shrink-0 relative shadow-md ring-1 ring-white/[0.08]">
                {track.coverArtUrl ? (
                  <img
                    src={track.coverArtUrl}
                    alt={track.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                    <Music size={18} className="text-zinc-600" />
                  </div>
                )}

                {/* Play/Pause state or Live EQ */}
                <div
                  className={`absolute inset-0 bg-black/45 backdrop-blur-[1px] flex items-center justify-center transition-opacity duration-200 ${
                    playing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                >
                  {playing ? (
                    <div className="flex items-end justify-center gap-[2.5px] h-3.5">
                      {[0, 1, 2].map(i => (
                        <div
                          key={i}
                          className="w-[2.5px] rounded-full bg-white eq-bar"
                          style={{ height: '100%' }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                      <Play size={12} fill="currentColor" className="ml-0.5 text-black" />
                    </div>
                  )}
                </div>
              </div>

              {/* Title & Artist */}
              <div className="min-w-0 flex-1 pr-1">
                <p
                  className={`font-bold text-[13px] sm:text-[14px] tracking-tight truncate leading-snug transition-colors ${
                    playing ? 'text-white' : 'text-zinc-200 group-hover:text-white'
                  }`}
                >
                  {track.title}
                </p>
                <p
                  className="text-[11px] sm:text-[12px] font-medium text-zinc-500 truncate mt-0.5 hover:text-zinc-300 hover:underline cursor-pointer"
                  onClick={e => {
                    e.stopPropagation();
                    navigate('/albums', { state: { artist: track.artist } });
                  }}
                >
                  {track.artist}
                </p>
              </div>

              {/* Favorite Action */}
              {toggleLikedSong && (
                <button
                  type="button"
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 active:scale-90 cursor-pointer ${
                    isLiked
                      ? 'text-white opacity-100'
                      : 'text-zinc-600 hover:text-zinc-300 opacity-0 group-hover:opacity-100'
                  }`}
                  onClick={e => {
                    e.stopPropagation();
                    toggleLikedSong(track);
                  }}
                  title={isLiked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
                >
                  <Heart size={14} className={isLiked ? 'fill-white text-white' : ''} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
