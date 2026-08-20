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

  // Helper to parse raw LRC text into SyncedLine objects
  const parseLRC = (lrcText: string): SyncedLine[] => {
    const lines = lrcText.split('\n');
    const parsed: SyncedLine[] = [];
    const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;
    
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(regex);
      if (match) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        // handle both 2 and 3 digit milliseconds
        const ms = parseInt(match[3], 10) * (match[3].length === 2 ? 10 : 1);
        const timeInSeconds = minutes * 60 + seconds + ms / 1000;
        const text = match[4].trim();
        
        if (text) {
          parsed.push({
            id: `lrc-${i}`,
            start_time: timeInSeconds,
            end_time: timeInSeconds + 5, // fallback
            text
          });
        }
      }
    }
    
    // Fix end times based on next line's start time
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
            // Parse LRC tags directly from the raw lyrics string
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
      } catch (err) {
        setLyrics('Error loading lyrics.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLyrics();
  }, [currentTrack, targetLang]);

  // Auto-scroll to active line
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
    if (diff < -80) onClose(); // Swipe down -> close
    setTouchStart(null);
  };

  if (!currentTrack) return null;

  // Find active line index based on progress (in seconds)
  const activeIndex = syncedLines.findIndex((line, index) => {
    const nextLine = syncedLines[index + 1];
    return progress >= line.start_time && (!nextLine || progress < nextLine.start_time);
  });

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col bg-zinc-950/95 md:bg-black backdrop-blur-xl animate-in slide-in-from-bottom"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      {!isFullMode && (
        <div className="flex flex-col md:flex-row md:items-center justify-between p-4 md:p-6 gap-4 shrink-0">
          <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <img 
              src={currentTrack.coverArtUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&q=80'} 
              alt={currentTrack.title}
              className="w-12 h-12 md:w-16 md:h-16 rounded-md shadow-2xl object-cover shrink-0"
            />
            <div className="min-w-0">
              <h2 className="text-lg md:text-2xl font-bold text-white truncate">{currentTrack.title}</h2>
              <p className="text-zinc-400 md:text-zinc-400 text-sm md:text-lg truncate">{currentTrack.artist}</p>
            </div>
          </div>
          
          {/* Mini Controller & Mobile Close */}
          <div className="flex items-center gap-1 md:gap-4 shrink-0">
            <button onClick={prev} className="text-zinc-400 hover:text-white transition-colors p-2 md:p-3 active:scale-95">
              <SkipBack size={20} className="md:w-6 md:h-6" fill="currentColor" />
            </button>
            <button 
              onClick={togglePlay} 
              className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 transition-transform shrink-0 active:scale-95"
            >
              {isPlaying ? <Pause size={20} className="md:w-6 md:h-6" fill="currentColor" /> : <Play size={20} className="md:w-6 md:h-6 ml-1" fill="currentColor" />}
            </button>
            <button onClick={next} className="text-zinc-400 hover:text-white transition-colors p-2 md:p-3 active:scale-95">
              <SkipForward size={20} className="md:w-6 md:h-6" fill="currentColor" />
            </button>

            <button 
              onClick={onClose}
              className="md:hidden p-2 -mr-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white shrink-0"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          {/* Metadata Badges */}
          {metadata?.mood && (
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full shrink-0">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">
                {metadata.mood.sentiment || 'Neutral'}
              </span>
            </div>
          )}
          
          {/* Close & Fullscreen buttons on desktop right */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-white shrink-0"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Audio Timeline */}
      {!isFullMode && (
      <div className="w-full shrink-0 mx-auto px-6 md:px-12 py-2 mb-4 max-w-4xl">
        <div className="relative w-full rounded-full overflow-hidden group cursor-pointer h-1 bg-white/10 mb-2">
          <input 
            type="range" 
            min={0} 
            max={duration || 100} 
            value={progress || 0}
            onChange={(e) => seek(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
          />
          <div 
            className="absolute top-0 left-0 h-full rounded-full transition-[width] ease-linear duration-300 bg-emerald-500"
            style={{ width: `${(progress / (duration || 1)) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-zinc-500 md:text-zinc-400 font-mono tabular-nums font-semibold tracking-wide mt-1">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      )}

      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto px-6 pb-32 pt-10 no-scrollbar relative flex flex-col"
        onWheel={handleScroll}
        onTouchMove={handleScroll}
      >
        <div className="max-w-3xl md:max-w-[400px] w-full mx-auto flex flex-col items-start md:items-stretch gap-8 md:gap-6 md:py-20">
          {loading ? (
            <div className="w-full flex justify-center py-20">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-500 md:border-white border-t-transparent rounded-full"></div>
            </div>
          ) : syncedLines.length > 0 ? (
            syncedLines.map((line, i) => {
              const isActive = i === activeIndex;
              const isPast = i < activeIndex;
              
              return (
                <p
                  key={line.id || i}
                  ref={isActive ? activeLineRef : null}
                  className={`text-4xl md:text-[2.75rem] md:leading-[1.1] font-bold md:font-mono md:font-normal transition-all duration-300 transform origin-left md:origin-center cursor-pointer md:text-justify md:tracking-wide md:lowercase
                    ${isActive 
                      ? 'text-white scale-110 md:scale-100 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]' 
                      : isPast 
                        ? 'text-white/40 md:text-white/20' 
                        : 'text-white/20 md:text-white/10 hover:text-white/40 md:hover:text-white/30'
                    }
                  `}
                  onClick={() => {
                    seek(line.start_time);
                  }}
                >
                  {line.text}
                </p>
              );
            })
          ) : (
            <div className="text-2xl text-zinc-400 font-medium md:font-mono md:font-normal md:lowercase md:tracking-wide leading-relaxed whitespace-pre-wrap md:text-justify w-full">
              {lyrics || "Instrumental or no lyrics available."}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-10 right-6 z-50 flex flex-col md:flex-row items-end md:items-center gap-4">
        {!isSynced && syncedLines.length > 0 && (
          <button
            onClick={() => setIsSynced(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-zinc-950 font-bold rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            Sync
          </button>
        )}

        {/* Full mode toggle */}
        {isFullMode ? (
          <button 
            onClick={() => setIsFullMode(false)}
            className="p-2 text-white/20 hover:text-white/80 transition-colors"
            title="Exit Full Mode"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
        ) : (
          <button 
            onClick={() => setIsFullMode(true)}
            className="hidden md:flex p-2 text-white/20 hover:text-white/80 transition-colors"
            title="Full Mode"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
