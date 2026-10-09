import { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, SkipBack, SkipForward, Activity, Maximize2, Minimize2 } from 'lucide-react';
import { useAudioStore } from '../../store/useAudioStore';
import { api } from '../../services/api';

interface LyricsViewProps {
  onClose: () => void;
}

function formatTime(seconds: number) {
  if (isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface SyncedLine {
  id: string;
  start_time: number;
  end_time: number;
  text: string;
}

export function LyricsView({ onClose }: LyricsViewProps) {
  const { queue, currentIndex, progress, duration, isPlaying, togglePlay, prev, next, seek } = useAudioStore();
  const currentTrack = queue[currentIndex];
  
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [syncedLines, setSyncedLines] = useState<SyncedLine[]>([]);
  const [metadata, setMetadata] = useState<any>(null);
  const [targetLang] = useState<string>('en');
  const [loading, setLoading] = useState(true);
  const [isSynced, setIsSynced] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [isFullMode, setIsFullMode] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLParagraphElement>(null);

  const parseLRC = (lrcText: string): SyncedLine[] => {
    const lines = lrcText.split('\n');
    const parsed: SyncedLine[] = [];
    const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;
    
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(regex);
      if (match) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const ms = parseInt(match[3], 10) * (match[3].length === 2 ? 10 : 1);
        const timeInSeconds = minutes * 60 + seconds + ms / 1000;
        const text = match[4].trim();
        
        if (text) {
          parsed.push({
            id: `lrc-${i}`,
            start_time: timeInSeconds,
            end_time: timeInSeconds + 5,
            text
          });
        }
      }
    }
    
    for (let i = 0; i < parsed.length - 1; i++) {
      parsed[i].end_time = parsed[i+1].start_time;
    }
    
    return parsed;
  };

  useEffect(() => {
    if (!currentTrack) return;
    
    const fetchLyrics = async () => {
      setLoading(true);
      try {
        const [lyricsRes, metaRes] = await Promise.all([
          api.getLyricaLyrics(currentTrack.title, currentTrack.artist),
          api.getLyricaMetadata()
        ]);
        if (lyricsRes?.status === 'success' && lyricsRes.data) {
          const rawLyrics = lyricsRes.data.syncedLyrics || lyricsRes.data.plainLyrics || '';
          const cleanRawLyrics = rawLyrics.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, '').trim();
          setLyrics(cleanRawLyrics);
          
          let parsedSynced: SyncedLine[] = [];
          
          if (lyricsRes.data.syncedLyrics) {
            parsedSynced = parseLRC(lyricsRes.data.syncedLyrics);
          }
          
          setSyncedLines(parsedSynced.filter((l: any) => l.text !== ''));
        } else {
          setLyrics('No lyrics found.');
          setSyncedLines([]);
        }
        
        const metaResAny: any = metaRes;
        if (metaResAny?.status === 'success' && metaResAny?.data) {
          setMetadata(metaResAny.data);
        }
      } catch {
        setLyrics('Error loading lyrics.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLyrics();
  }, [currentTrack, targetLang]);

  useEffect(() => {
    if (isSynced && activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [progress, syncedLines, isSynced]);

  const handleScroll = () => {
    if (isSynced) setIsSynced(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientY);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const diff = touchStart - e.changedTouches[0].clientY;
    if (diff < -80) onClose();
    setTouchStart(null);
  };

  if (!currentTrack) return null;

  const activeIndex = syncedLines.findIndex((line, index) => {
    const nextLine = syncedLines[index + 1];
    return progress >= line.start_time && (!nextLine || progress < nextLine.start_time);
  });

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col bg-[#030304]/95 backdrop-blur-[40px] animate-fade-in"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/10 rounded-full blur-[120px] pointer-events-none library-orb-float" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[100px] pointer-events-none library-orb-float-delayed" />
      <div className="absolute inset-0 bg-noise opacity-[0.02] mix-blend-overlay pointer-events-none" />

      {/* Header */}
      {!isFullMode && (
        <div className="relative flex flex-col md:flex-row md:items-center justify-between p-6 md:px-12 gap-6 shrink-0 z-10 bg-gradient-to-b from-black/40 to-transparent">
          <div className="flex items-center justify-between w-full md:w-auto gap-6">
            <div className="flex items-center gap-4 md:gap-6 min-w-0 group cursor-pointer shrink-0 max-w-[50%]" onClick={onClose}>
              <img 
                src={currentTrack.coverArtUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&q=80'} 
                alt={currentTrack.title}
                className="w-12 h-12 md:w-20 md:h-20 rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.6)] object-cover shrink-0 border border-white/[0.04] group-hover:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
              />
              <div className="min-w-0">
                <h2 className="text-lg md:text-3xl font-black text-white truncate tracking-tight">{currentTrack.title}</h2>
                <p className="text-xs md:text-base font-medium text-zinc-400 truncate mt-1">{currentTrack.artist}</p>
              </div>
            </div>

            {/* In-Header Transport Controls */}
            <div className="flex items-center gap-2 md:gap-6">
              <button onClick={prev} className="p-2 md:p-3 text-zinc-400 hover:text-white transition-colors active:scale-90">
                <SkipBack size={18} fill="currentColor" className="md:w-5 md:h-5" />
              </button>
              <button 
                onClick={togglePlay} 
                className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full text-white bg-transparent hover:bg-white/5 hover:scale-105 transition-all active:scale-95 shrink-0"
              >
                {isPlaying ? <Pause size={18} fill="currentColor" className="md:w-5 md:h-5" /> : <Play size={18} className="ml-1 md:w-5 md:h-5" fill="currentColor" />}
              </button>
              <button onClick={next} className="p-2 md:p-3 text-zinc-400 hover:text-white transition-colors active:scale-90">
                <SkipForward size={18} fill="currentColor" className="md:w-5 md:h-5" />
              </button>
            </div>
            
            {/* Mobile Controls */}
            <div className="flex items-center gap-2 md:hidden shrink-0">
              <button 
                onClick={onClose}
                className="p-3 bg-white/[0.04] hover:bg-white/[0.08] rounded-full transition-colors text-white shrink-0 active:scale-90"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar md:pb-0">
            {metadata?.mood && (
              <div className="flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-1.5 rounded-md shrink-0">
                <Activity className="w-4 h-4 text-white" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-white">
                  {metadata.mood.sentiment || 'Neutral'}
                </span>
              </div>
            )}
            
            <div className="hidden md:flex items-center gap-2 shrink-0">
              <button 
                onClick={onClose}
                className="p-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.04] rounded-full transition-colors text-white shrink-0 active:scale-90"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audio Timeline */}
      {!isFullMode && (
        <div className="w-full shrink-0 mx-auto px-6 md:px-12 pb-4 pt-2 max-w-5xl z-10">
          <div className="relative w-full rounded-full overflow-hidden group cursor-pointer h-1.5 bg-white/[0.06] mb-3">
            <input 
              type="range" 
              min={0} 
              max={duration || 100} 
              value={progress || 0}
              onChange={(e) => seek(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
            />
            <div 
              className="absolute top-0 left-0 h-full rounded-full transition-[width] ease-linear duration-300 bg-white shadow-[0_0_12px_rgba(255,255,255,0.4)]"
              style={{ width: `${(progress / (duration || 1)) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-mono-nums font-bold text-zinc-500 tracking-wider">
            <span className="text-white">{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      )}

      {/* Lyrics Container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto px-6 pb-40 pt-10 custom-scrollbar relative flex flex-col z-10 scroll-smooth"
        onWheel={handleScroll}
        onTouchMove={handleScroll}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        <div className="max-w-4xl w-full mx-auto flex flex-col items-start gap-8 md:gap-10 md:py-20">
          {loading ? (
            <div className="w-full flex justify-center py-32">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-white/[0.05]" />
                <div className="w-12 h-12 rounded-full border-2 border-white border-t-transparent animate-spin absolute inset-0" />
              </div>
            </div>
          ) : syncedLines.length > 0 ? (
            syncedLines.map((line, i) => {
              const isActive = i === activeIndex;
              const isPast = i < activeIndex;
              
              return (
                <p
                  key={line.id || i}
                  ref={isActive ? activeLineRef : null}
                  className={`text-3xl md:text-5xl font-black transition-all duration-500 transform origin-left cursor-pointer tracking-tight
                    ${isActive 
                      ? 'text-white drop-shadow-[0_4px_24px_rgba(255,255,255,0.4)] scale-100 md:scale-105' 
                      : isPast 
                        ? 'text-white/30 hover:text-white/50 scale-95 md:scale-100' 
                        : 'text-white/10 hover:text-white/30 scale-95 md:scale-100'
                    }
                  `}
                  onClick={() => seek(line.start_time)}
                >
                  {line.text}
                </p>
              );
            })
          ) : (
            <div className="text-2xl md:text-3xl font-bold text-zinc-500 leading-relaxed whitespace-pre-wrap w-full tracking-tight">
              {lyrics || "Instrumental or no lyrics available."}
            </div>
          )}
        </div>
      </div>

      {/* Unified Bottom Controls Bar */}
      <div className="absolute bottom-8 left-0 right-0 h-20 z-50 pointer-events-none">
        
        {/* Right side: Sync & Expand */}
        <div className="absolute right-6 md:right-12 inset-y-0 flex items-center justify-end gap-4 pointer-events-auto">
          {!isSynced && syncedLines.length > 0 && (
            <button
              onClick={() => setIsSynced(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-zinc-950 text-[13px] font-black uppercase tracking-wider rounded-md shadow-[0_8px_24px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all"
            >
              Sync Lyrics
            </button>
          )}
          <button 
            onClick={() => setIsFullMode(!isFullMode)}
            className="hidden md:flex p-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.04] text-white/50 hover:text-white rounded-full transition-all active:scale-90 backdrop-blur-md"
            title={isFullMode ? "Exit Full Mode" : "Full Mode"}
          >
            {isFullMode ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
