import { useParams, Navigate } from 'react-router-dom';
import { Play, Pause, Music, Disc3 } from 'lucide-react';
import { useAudioStore } from '../store/useAudioStore';
import { TrackContextMenu } from '../components/ui/TrackContextMenu';

export function Playlist() {
  const { id } = useParams<{ id: string }>();
  const { playlists, queue, currentIndex, isPlaying, setQueue, playTrack, play, pause } = useAudioStore();

  const playlist = playlists.find(p => p.id === id);

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
    <div className="animate-fade-in pb-32 md:pb-10 min-h-screen bg-[#030304]">
      {/* Header */}
      <div className="relative overflow-hidden pt-12 md:pt-24 pb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] via-white/[0.02] to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-20 left-10 w-[300px] h-[300px] bg-white/[0.02] rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative px-6 md:px-10 flex flex-col md:flex-row items-center md:items-end gap-10 max-w-[1400px] mx-auto">
          <div className="w-56 h-56 rounded-[32px] bg-gradient-to-br from-white/10 to-transparent shadow-[0_24px_64px_rgba(255,255,255,0.1)] flex items-center justify-center shrink-0 border border-white/[0.08] transform-style-3d hover:[transform:rotateX(5deg)_rotateY(-5deg)_scale(1.02)] transition-all duration-500 overflow-hidden relative group">
            <div className={`absolute inset-0 bg-black/20 mix-blend-overlay z-10`} />
            {playlist.tracks.length > 0 && playlist.tracks[0].coverArtUrl ? (
               <img src={playlist.tracks[0].coverArtUrl} alt="Playlist Cover" className="w-full h-full object-cover blur-md opacity-40 absolute inset-0 transition-all duration-700 group-hover:scale-110 group-hover:opacity-60" />
            ) : null}
            <Disc3 size={80} strokeWidth={1.5} className="text-white drop-shadow-xl relative z-20" />
          </div>
          <div className="text-center md:text-left relative z-10">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white mb-4 drop-shadow-sm">Playlist</p>
            <h1 className="text-6xl md:text-[6.5rem] font-black text-white tracking-tighter mb-4 drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)] leading-none">{playlist.name}</h1>
            <p className="text-zinc-400 font-bold tracking-widest uppercase text-xs">
              {playlist.tracks.length} {playlist.tracks.length === 1 ? 'song' : 'songs'}
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 md:px-10 py-6 max-w-[1400px] mx-auto flex items-center gap-6 relative z-10 border-b border-white/[0.04]">
        <button 
          onClick={handlePlayAll}
          disabled={playlist.tracks.length === 0}
          className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-zinc-950 hover:scale-105 active:scale-95 hover:shadow-[0_8px_32px_rgba(255,255,255,0.2)] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none cursor-pointer group shadow-xl"
        >
          <Play size={32} fill="currentColor" className="ml-1.5" />
        </button>
      </div>

      {/* Song List */}
      <div className="px-6 md:px-10 mt-6 max-w-[1400px] mx-auto pb-24">
        {playlist.tracks.length === 0 ? (
          <div className="text-center py-32 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-white/[0.02] border border-white/[0.04] flex items-center justify-center mb-6 shadow-xl">
              <Disc3 size={40} className="text-zinc-500" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">This playlist is empty</h2>
            <p className="text-[15px] text-zinc-500 mt-3 font-medium">Search for songs and add them to your new playlist!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {playlist.tracks.map((track, idx) => {
              const playing = queue[currentIndex]?.id === track.id && isPlaying;
              
              return (
                <div 
                  key={track.id + idx}
                  onClick={() => handlePlay(idx)}
                  className={`group flex items-center gap-4 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-300 library-card-appear ${
                    playing 
                      ? 'bg-white/[0.06] shadow-sm' 
                      : 'hover:bg-white/[0.04]'
                  }`}
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <div className={`w-6 text-right text-base font-bold shrink-0 ${playing ? 'text-white' : 'text-zinc-500 group-hover:hidden'}`}>
                    {playing ? (
                      <div className="flex items-end justify-center gap-[3px] h-4 mx-auto">
                        {[0,1,2].map(i => (
                          <div key={i} className="w-[3px] rounded-full bg-white eq-bar" style={{ height: '100%' }} />
                        ))}
                      </div>
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <div className={`w-6 text-right hidden shrink-0 ${playing ? 'hidden' : 'group-hover:block'}`}>
                    <Play size={18} fill="currentColor" className="text-white" />
                  </div>
                  
                  <div className="w-12 h-12 rounded-md overflow-hidden bg-zinc-900 shrink-0 border border-white/[0.04] relative">
                    {track.coverArtUrl ? (
                      <img src={track.coverArtUrl} alt={track.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music size={18} className="text-zinc-600" />
                      </div>
                    )}
                    <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-300 backdrop-blur-[2px] ${playing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      {playing ? <Pause size={20} fill="white" className="drop-shadow-md" /> : <Play size={20} fill="white" className="ml-1 drop-shadow-md" />}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0 pr-4">
                    <p className={`font-bold text-[15px] truncate transition-colors ${playing ? 'text-white' : 'text-zinc-100 group-hover:text-white'}`}>
                      {track.title}
                    </p>
                    <p className="text-[13px] text-zinc-400 truncate mt-0.5 font-medium group-hover:text-zinc-300 transition-colors">
                      {track.artist}
                    </p>
                  </div>
                  
                  {track.duration && (
                    <div className="hidden md:block text-[13px] text-zinc-500 font-medium tabular-nums pr-4 group-hover:text-zinc-300 transition-colors">
                      {formatDuration(track.duration)}
                    </div>
                  )}

                  {/* 3-Dot Context Menu */}
                  <div onClick={e => e.stopPropagation()} className="ml-2 pr-2">
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
