import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Volume1, Shuffle, Repeat, Repeat1, Heart, Music, Mic2, ListMusic, Download } from 'lucide-react';
import { useAudioStore } from '../../store/useAudioStore';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LyricsView } from '../audio/LyricsView';
import { QueueView } from '../audio/QueueView';
import { createPortal } from 'react-dom';

function formatTime(seconds: number) {
  if (isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function BottomPlayer() {
  const navigate = useNavigate();
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
      <div className="hidden md:flex relative z-50 shrink-0 w-full h-[96px] glass-surface-elevated items-center justify-center">
        <div className="flex items-center gap-4 px-6 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] opacity-70">
          <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center relative">
            <Music size={16} className="text-white relative z-10" />
          </div>
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.18em]">Select a track to start playing</span>
        </div>
      </div>
    );
  }

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const percentage = duration ? (progress / duration) * 100 : 0;
  const volumePercentage = volume * 100;

  return (
    <div className="hidden md:block relative z-50 shrink-0 w-full glass-surface-elevated transition-all duration-300">
      
      {/* Background artwork leak (subtle blur behind player) */}
      {currentTrack.coverArtUrl && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 saturate-150">
          <div 
            className="absolute -inset-20 bg-cover bg-center blur-[60px]"
            style={{ backgroundImage: `url(${currentTrack.coverArtUrl})` }}
          />
        </div>
      )}

      <div className="h-[96px] flex items-center justify-between px-8 relative z-10">
        
        {/* Left: Track Info */}
        <div className="flex items-center w-[30%] min-w-[240px] max-w-[400px]">
          <div className="flex items-center gap-4 group cursor-pointer w-full pr-4 rounded-2xl hover:bg-white/[0.02] transition-colors p-1.5 -ml-1.5">
            <div className="relative shrink-0 w-[60px] h-[60px] rounded-xl bg-zinc-900 overflow-hidden shadow-md border border-white/[0.06] group-hover:border-white/10 transition-colors">
              {currentTrack.coverArtUrl ? (
                <img src={currentTrack.coverArtUrl} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-900"><Music size={20} className="text-zinc-600" /></div>
              )}
              {/* Image inner glare */}
              <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 pointer-events-none" />
            </div>
            
            <div className="flex flex-col overflow-hidden flex-1 justify-center min-w-0">
              <span className="text-[14px] font-semibold text-zinc-100 truncate group-hover:text-white transition-colors tracking-tight">{currentTrack.title}</span>
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  if (currentTrack.artist) {
                    navigate('/albums', { state: { artist: currentTrack.artist } });
                  }
                }}
                className="text-[12px] font-medium text-zinc-500 hover:text-white hover:underline transition-colors truncate mt-0.5 cursor-pointer inline-block"
              >
                {currentTrack.artist}
              </span>
            </div>
            
            <button 
              className={`p-2.5 rounded-full transition-all duration-300 shrink-0 ${
                (likedSongs || []).some(t => t.id === currentTrack.id) 
                  ? 'text-white bg-white/10' 
                  : 'text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.04]'
              }`} 
              onClick={(e) => { e.stopPropagation(); toggleLikedSong(currentTrack); }}
            >
              <Heart size={18} className={(likedSongs || []).some(t => t.id === currentTrack.id) ? 'fill-white' : ''} />
            </button>
          </div>
        </div>

        {/* Center: Controls + Seekbar */}
        <div className="flex flex-col items-center justify-center flex-1 max-w-[700px] gap-2 px-8">
          
          <div className="flex items-center gap-6">
            <button 
              onClick={toggleShuffle} 
              className={`p-2 rounded-full transition-all duration-300 ${isShuffled ? 'text-white relative after:content-[""] after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-white after:rounded-full' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'}`}
            >
              <Shuffle size={18} />
            </button>
            
            <div className="flex items-center gap-4">
              <button onClick={prev} className="w-10 h-10 flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all duration-300 active:scale-95">
                <SkipBack size={20} fill="currentColor" />
              </button>
              
              <button 
                onClick={togglePlay} 
                className="group relative w-12 h-12 rounded-full flex items-center justify-center text-white bg-transparent hover:bg-white/5 hover:scale-105 active:scale-[0.97] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-[0_0_24px_rgba(255,255,255,0.25)] hover:shadow-[0_0_32px_rgba(255,255,255,0.35)]"
              >
                {/* Micro-interaction on hover */}
                <div className="absolute inset-0 rounded-full border border-white opacity-0 group-hover:opacity-100 scale-110 group-hover:scale-125 transition-all duration-500 pointer-events-none" />
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
              </button>
              
              <button onClick={next} className="w-10 h-10 flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all duration-300 active:scale-95">
                <SkipForward size={20} fill="currentColor" />
              </button>
            </div>

            <button 
              onClick={toggleLoop} 
              className={`p-2 rounded-full transition-all duration-300 ${loopMode !== 'off' ? 'text-white relative after:content-[""] after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-white after:rounded-full' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'}`}
            >
              {loopMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
            </button>
          </div>
          
          <div className="flex items-center gap-4 w-full group">
            <span className="w-10 text-right text-[11px] font-mono-nums font-semibold text-zinc-500 tracking-wider">
              {formatTime(progress)}
            </span>
            
            <div className="flex-1 relative h-6 cursor-pointer flex items-center touch-none">
              {/* The invisible range input with larger hit area */}
              <input 
                type="range" 
                min={0} 
                max={duration || 100} 
                value={progress}
                onChange={(e) => seek(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
              />
              
              {/* Background Track */}
              <div className="absolute left-0 right-0 h-1 bg-white/[0.06] rounded-full overflow-hidden transition-all duration-300 group-hover:h-1.5 group-hover:bg-white/[0.08]" />
              
              {/* Filled Track */}
              <div 
                className="absolute left-0 h-1 bg-white rounded-full pointer-events-none transition-all duration-300 group-hover:h-1.5"
                style={{ width: `${percentage}%` }}
              />
              
              {/* Outer Glow on Fill */}
              <div 
                className="absolute left-0 h-1 bg-white blur-sm rounded-full pointer-events-none opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                style={{ width: `${percentage}%` }}
              />
              
              {/* Draggable Knob (visible on hover) */}
              <div 
                className="absolute h-3 w-3 bg-white rounded-full shadow-md pointer-events-none opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all duration-300 ease-out -ml-1.5"
                style={{ left: `${percentage}%` }}
              />
            </div>
            
            <span className="w-10 text-left text-[11px] font-mono-nums font-semibold text-zinc-500 tracking-wider">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Right: Volume & Tools */}
        <div className="flex items-center justify-end gap-3 w-[30%] min-w-[240px]">
          <button 
            onClick={() => {
              if (!currentTrack) return;
              const downloadUrl = `/api/download/${currentTrack.id}?title=${encodeURIComponent(currentTrack.title)}`;
              window.open(downloadUrl, '_blank');
            }}
            className="w-9 h-9 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-white/[0.04] transition-all duration-300 active:scale-95"
            title="Download FLAC/MP3"
          >
            <Download size={16} />
          </button>
          
          <button 
            onClick={() => setShowLyrics(!showLyrics)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 active:scale-[0.97] border ${showLyrics ? 'bg-white/10 text-white border-white/20' : 'bg-white/[0.02] border-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.06] hover:border-white/[0.08]'}`}
            title="Lyrics"
          >
            <Mic2 size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Lyrics</span>
          </button>
          
          <button 
            onClick={() => { setShowQueue(!showQueue); setShowLyrics(false); }}
            className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-300 active:scale-95 border ${showQueue ? 'bg-white/10 text-white border-white/20' : 'bg-transparent border-transparent text-zinc-500 hover:text-white hover:bg-white/[0.04]'}`}
            title="Queue"
          >
            <ListMusic size={16} />
          </button>
          
          {/* Volume Control */}
          <div className="flex items-center gap-2 w-28 group relative pl-2">
            <button 
              onClick={() => setVolume(volume === 0 ? 1 : 0)} 
              className="text-zinc-500 hover:text-white transition-colors p-1"
            >
              <VolumeIcon size={16} />
            </button>
            <div className="flex-1 relative h-6 cursor-pointer flex items-center">
              <input 
                type="range" 
                min={0} 
                max={1} 
                step={0.01}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
              />
              <div className="absolute left-0 right-0 h-1 bg-white/[0.06] rounded-full transition-all duration-300 group-hover:h-1.5 group-hover:bg-white/[0.08]" />
              <div 
                className="absolute left-0 h-1 bg-white/70 group-hover:bg-white rounded-full pointer-events-none transition-all duration-300 group-hover:h-1.5"
                style={{ width: `${volumePercentage}%` }}
              />
              <div 
                className="absolute h-3 w-3 bg-white rounded-full shadow-md pointer-events-none opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all duration-300 ease-out -ml-1.5"
                style={{ left: `${volumePercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      {showLyrics && createPortal(<LyricsView onClose={() => setShowLyrics(false)} />, document.body)}
      {showQueue && createPortal(<QueueView onClose={() => setShowQueue(false)} />, document.body)}
    </div>
  );
}
