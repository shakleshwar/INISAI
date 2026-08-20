import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Volume1, Shuffle, Repeat, Repeat1, Heart, Music, Mic2, ListMusic, Download } from 'lucide-react';
import { useAudioStore } from '../../store/useAudioStore';
import { useState } from 'react';
import { LyricsView } from '../audio/LyricsView';
import { QueueView } from '../audio/QueueView';

function formatTime(seconds: number) {
  if (isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function BottomPlayer() {
  const { 
    queue, currentIndex, isPlaying, progress, duration, volume,
    togglePlay, next, prev, seek, setVolume,
    isShuffled, loopMode, toggleShuffle, toggleLoop,
    likedSongs, toggleLikedSong
  } = useAudioStore();

  const [showLyrics, setShowLyrics] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const currentTrack = currentIndex >= 0 ? queue[currentIndex] : null;

  if (!currentTrack) {
    return (
      <div className="hidden md:flex relative z-50 shrink-0 w-full h-[90px] bg-[#050505] border-t border-white/[0.05] items-center justify-center">
        <div className="flex items-center gap-4 px-6 py-2.5 rounded-full bg-white/[0.02] border border-white/5 opacity-80 hover:opacity-100 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-md rounded-full animate-pulse" />
            <Music size={14} className="text-blue-400 relative z-10" />
          </div>
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Select a track to start playing</span>
        </div>
      </div>
    );
  }

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  const percentage = duration ? (progress / duration) * 100 : 0;
  const volumePercentage = volume * 100;

  return (
    <div className="hidden md:block relative z-50 shrink-0 w-full bg-[#050505] border-t border-white/[0.05]">
      <div className="h-[90px] flex items-center justify-between px-6">
        {/* Left: Track Info */}
        <div className="flex items-center gap-4 w-[30%] min-w-[220px]">
          {currentTrack.coverArtUrl ? (
            <img src={currentTrack.coverArtUrl} alt="Cover" className="w-14 h-14 rounded-md object-cover shadow-lg border border-white/5" />
          ) : (
            <div className="w-14 h-14 rounded-md bg-zinc-900 border border-white/5 flex items-center justify-center shadow-lg">
              <Music size={20} className="text-zinc-600" />
            </div>
          )}
          <div className="flex flex-col overflow-hidden max-w-[200px]">
            <span className="text-sm font-bold text-white truncate">{currentTrack.title}</span>
            <span className="text-xs font-medium text-zinc-500 hover:text-white transition-colors cursor-pointer truncate mt-1">{currentTrack.artist}</span>
          </div>
          <Heart 
            size={18} 
            className={`transition-colors cursor-pointer shrink-0 ml-4 ${(likedSongs || []).some(t => t.id === currentTrack.id) ? 'text-blue-500 fill-blue-500 hover:text-blue-400' : 'text-zinc-600 hover:text-white'}`} 
            onClick={() => toggleLikedSong(currentTrack)}
          />
        </div>

        {/* Center: Controls + Seekbar (Image 3 layout) */}
        <div className="flex flex-col items-center justify-center flex-1 max-w-[700px] gap-3">
          <div className="flex items-center gap-8">
            <button 
              onClick={toggleShuffle} 
              className={`p-1.5 transition-colors ${isShuffled ? 'text-blue-500' : 'text-zinc-600 hover:text-white'}`}
            >
              <Shuffle size={18} />
            </button>
            
            <button onClick={prev} className="text-zinc-400 hover:text-white transition-colors p-2 active:scale-95">
              <SkipBack size={22} fill="currentColor" />
            </button>
            
            <button 
              onClick={togglePlay} 
              className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-black hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-95"
            >
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
            </button>
            
            <button onClick={next} className="text-zinc-400 hover:text-white transition-colors p-2 active:scale-95">
              <SkipForward size={22} fill="currentColor" />
            </button>

            <button 
              onClick={toggleLoop} 
              className={`p-1.5 transition-colors ${loopMode !== 'off' ? 'text-blue-500' : 'text-zinc-600 hover:text-white'}`}
            >
              {loopMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
            </button>
          </div>
          
          <div className="flex items-center gap-4 w-full text-[12px] font-medium text-zinc-500">
            <span className="w-10 text-right">{formatTime(progress)}</span>
            <div className="flex-1 relative h-1.5 group cursor-pointer flex items-center">
              <input 
                type="range" 
                min={0} 
                max={duration || 100} 
                value={progress}
                onChange={(e) => seek(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
              />
              {/* Custom Glowing Track */}
              <div className="absolute left-0 right-0 h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              {/* Glow effect */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 h-1 bg-blue-500 blur-sm rounded-full"
                style={{ width: `${percentage}%`, opacity: isPlaying ? 0.8 : 0.4 }}
              />
            </div>
            <span className="w-10 text-left">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right: Volume */}
        <div className="flex items-center justify-end gap-4 w-[30%] min-w-[220px]">
                    <button 
            onClick={() => {
              if (!currentTrack) return;
              const downloadUrl = `/api/download/${currentTrack.id}?title=${encodeURIComponent(currentTrack.title)}`;
              window.open(downloadUrl, '_blank');
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 border border-transparent text-zinc-400 hover:text-white hover:bg-white/5"
            title="Download FLAC/MP3 (SpotiFLAC Engine)"
          >
            <Download className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setShowLyrics(!showLyrics)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all duration-300 border ${showLyrics ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border-blue-500/30' : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/5'}`}
            title="Lyrics"
          >
            <Mic2 className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Lyrics</span>
          </button>
          <button 
            onClick={() => { setShowQueue(!showQueue); setShowLyrics(false); }}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all duration-300 border ${showQueue ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border-blue-500/30' : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/5'}`}
            title="Queue"
          >
            <ListMusic className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 w-32 group">
            <button 
              onClick={() => setVolume(volume === 0 ? 1 : 0)} 
              className="text-zinc-400 hover:text-white transition-colors p-1"
            >
              <VolumeIcon size={18} />
            </button>
            <input 
              type="range" 
              min={0} 
              max={1} 
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="flex-1 opacity-70 group-hover:opacity-100 transition-opacity"
              style={{ background: `linear-gradient(to right, #ffffff 0%, #ffffff ${volumePercentage}%, rgba(255,255,255,0.1) ${volumePercentage}%)` }}
            />
          </div>
        </div>
      </div>
      {showLyrics && <LyricsView onClose={() => setShowLyrics(false)} />}
      {showQueue && <QueueView onClose={() => setShowQueue(false)} />}
    </div>
  );
}
