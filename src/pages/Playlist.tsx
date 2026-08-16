import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { Play, Pause, Music, Disc3, ChevronLeft } from 'lucide-react';
import { useAudioStore } from '../store/useAudioStore';
import { TrackContextMenu } from '../components/ui/TrackContextMenu';

export function Playlist() {
  const { id } = useParams<{ id: string }>();
  const { playlists, queue, currentIndex, isPlaying, setQueue, playTrack, play, pause } = useAudioStore();

  const playlist = playlists.find(p => p.id === id);
  const navigate = useNavigate();

  if (!playlist) {
    return <Navigate to="/" replace />;
  }

  const handlePlay = (index: number) => {
    const isSameQueue = queue.length === playlist.tracks.length && queue[0]?.id === playlist.tracks[0]?.id;
    if (!isSameQueue) {
      setQueue(playlist.tracks);
    }
    
    if (currentIndex === index && isPlaying && isSameQueue) {
      pause();
    } else if (currentIndex === index && !isPlaying && isSameQueue) {
      play();
    } else {
      playTrack(index);
    }
  };

  const handlePlayAll = () => {
    if (playlist.tracks.length === 0) return;
    setQueue(playlist.tracks);
    playTrack(0);
  };

  const formatDuration = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="animate-fade-in pb-32 md:pb-10">
      {/* Mobile Back Button */}
      <div className="md:hidden sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-white/[0.02] px-4 py-3">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={24} />
          <span className="font-semibold text-sm">Back</span>
        </button>
      </div>

      {/* Header */}
      <div className="relative overflow-hidden pt-8 md:pt-12 pb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-zinc-950 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-20 left-10 w-[300px] h-[300px] bg-purple-600/20 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative px-6 md:px-10 flex flex-col md:flex-row items-center md:items-end gap-8">
          <div className="w-48 h-48 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0_20px_40px_rgba(99,102,241,0.4)] flex items-center justify-center shrink-0 border border-white/20 transform-style-3d hover:[transform:rotateX(10deg)_rotateY(-10deg)_scale(1.02)] transition-all duration-500 overflow-hidden">
            {playlist.tracks.length > 0 && playlist.tracks[0].coverArtUrl ? (
               <img src={playlist.tracks[0].coverArtUrl} alt="Playlist Cover" className="w-full h-full object-cover blur-sm opacity-50 absolute inset-0" />
            ) : null}
            <Disc3 size={72} strokeWidth={1.5} className="text-white drop-shadow-2xl relative z-10" />
          </div>
          <div className="text-center md:text-left relative z-10">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-3 drop-shadow-sm">Playlist</p>
            <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/70 tracking-tight mb-4 drop-shadow-xl">{playlist.name}</h1>
            <p className="text-zinc-400 font-medium">
              {playlist.tracks.length} {playlist.tracks.length === 1 ? 'song' : 'songs'}
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 md:px-10 py-6 flex items-center gap-6 relative z-10 border-b border-white/[0.02]">
        <button 
          onClick={handlePlayAll}
          disabled={playlist.tracks.length === 0}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white hover:scale-105 hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none cursor-pointer group"
        >
          <Play size={28} fill="currentColor" className="ml-1.5 group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Song List */}
      <div className="px-6 md:px-10 mt-6">
        {playlist.tracks.length === 0 ? (
          <div className="text-center py-32 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
              <Disc3 size={40} className="text-zinc-500" />
            </div>
            <h2 className="text-2xl font-black text-white">This playlist is empty</h2>
            <p className="text-zinc-500 mt-2 font-medium">Search for songs and add them to your new playlist!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {playlist.tracks.map((track, idx) => {
              const isCurrentlyPlaying = queue[currentIndex]?.id === track.id && isPlaying;
              
              return (
                <div 
                  key={track.id + idx}
                  onClick={() => handlePlay(idx)}
                  className={`group flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 hover:-translate-y-0.5 ${
                    isCurrentlyPlaying 
                      ? 'bg-blue-500/[0.08] border border-blue-500/20 shadow-[0_4px_20px_rgba(59,130,246,0.1)]' 
                      : 'hover:bg-white/[0.04] border border-transparent hover:shadow-lg'
                  }`}
                >
                  <span className={`w-8 text-center text-base font-medium tabular-nums ${isCurrentlyPlaying ? 'text-blue-400' : 'text-zinc-500 group-hover:text-white transition-colors'}`}>
                    {idx + 1}
                  </span>
                  
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-800 shrink-0 shadow-md relative">
                    {track.coverArtUrl ? (
                      <img src={track.coverArtUrl} alt={track.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music size={20} className="text-zinc-600" />
                      </div>
                    )}
                    <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-300 ${isCurrentlyPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 backdrop-blur-[2px]'}`}>
                      {isCurrentlyPlaying ? <Pause size={20} fill="white" className="text-white drop-shadow-md" /> : <Play size={20} fill="white" className="ml-1 text-white drop-shadow-md" />}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0 pr-4">
                    <p className={`font-bold text-base truncate transition-colors ${isCurrentlyPlaying ? 'text-blue-400' : 'text-white group-hover:text-blue-400'}`}>
                      {track.title}
                    </p>
                    <p className="text-sm text-zinc-400 truncate mt-0.5 font-medium group-hover:text-zinc-300 transition-colors">
                      {track.artist}
                    </p>
                  </div>
                  
                  {track.duration && (
                    <div className="hidden md:block text-sm text-zinc-500 font-medium tabular-nums pr-2 group-hover:text-zinc-300 transition-colors">
                      {formatDuration(track.duration)}
                    </div>
                  )}

                  {/* 3-Dot Context Menu */}
                  <div onClick={e => e.stopPropagation()} className="ml-2">
                    <TrackContextMenu track={track} />
                  </div>
                </div>);
            })}
          </div>
        )}
      </div>
    </div>
  );
}
