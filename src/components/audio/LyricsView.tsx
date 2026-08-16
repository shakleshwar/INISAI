import { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, SkipBack, SkipForward, Activity } from 'lucide-react';
import { useAudioStore } from '../../store/useAudioStore';
import { api } from '../../services/api';

interface LyricsViewProps {
  onClose: () => void;
}

interface SyncedLine {
  id: string;
  start_time: number;
  end_time: number;
  text: string;
}

export function LyricsView({ onClose }: LyricsViewProps) {
  const { queue, currentIndex, progress, isPlaying, togglePlay, prev, next, seek } = useAudioStore();
  const currentTrack = queue[currentIndex];
  
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [syncedLines, setSyncedLines] = useState<SyncedLine[]>([]);
  const [metadata, setMetadata] = useState<any>(null);
  const [targetLang] = useState<string>('en');
  const [loading, setLoading] = useState(false);
  
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
          api.getLyricaLyrics(currentTrack.title, currentTrack.artist, targetLang || undefined),
          api.getLyricaMetadata(currentTrack.title, currentTrack.artist)
        ]);
        if (lyricsRes?.status === 'success' && lyricsRes.data) {
          const rawLyrics = lyricsRes.data.lyrics || '';
          const cleanRawLyrics = rawLyrics.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, '').trim();
          setLyrics(cleanRawLyrics);
          
          let parsedSynced: SyncedLine[] = [];
          const syncedData = lyricsRes.data.synced || [];
          
          if (syncedData.length > 0) {
            // Backend provided structured synced data
            const isMilliseconds = syncedData.some((l: any) => l.start_time > 5000);
            parsedSynced = syncedData.map((line: any) => {
              const cleanText = line.text ? line.text.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, '').trim() : '';
              return {
                ...line,
                text: cleanText,
                start_time: isMilliseconds ? line.start_time / 1000 : line.start_time,
                end_time: isMilliseconds ? line.end_time / 1000 : line.end_time
              };
            });
          } else if (rawLyrics.match(/\[\d{2}:\d{2}\.\d{2,3}\]/)) {
            // Fallback: Parse LRC tags directly from the raw lyrics string
            parsedSynced = parseLRC(rawLyrics);
          }
          
          setSyncedLines(parsedSynced.filter((l: any) => l.text !== ''));
        } else {
          setLyrics('No lyrics found.');
          setSyncedLines([]);
        }
        
        if (metaRes?.status === 'success' && metaRes.data) {
          setMetadata(metaRes.data);
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
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [progress, syncedLines]);

  if (!currentTrack) return null;

  // Find active line index based on progress (in seconds)
  const activeIndex = syncedLines.findIndex((line, index) => {
    const nextLine = syncedLines[index + 1];
    return progress >= line.start_time && (!nextLine || progress < nextLine.start_time);
  });

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950/95 backdrop-blur-xl animate-in slide-in-from-bottom">
      {/* Header */}
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
              <p className="text-zinc-400 text-sm md:text-lg truncate">{currentTrack.artist}</p>
            </div>
          </div>
          
          {/* Mini Controller & Mobile Close */}
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <button onClick={prev} className="text-zinc-400 hover:text-white transition-colors p-1">
              <SkipBack size={20} className="md:w-6 md:h-6" fill="currentColor" />
            </button>
            <button 
              onClick={togglePlay} 
              className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 transition-transform shrink-0"
            >
              {isPlaying ? <Pause size={20} className="md:w-6 md:h-6" fill="currentColor" /> : <Play size={20} className="md:w-6 md:h-6 ml-1" fill="currentColor" />}
            </button>
            <button onClick={next} className="text-zinc-400 hover:text-white transition-colors p-1">
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
          
          {/* Close button on desktop right */}
          <button 
            onClick={onClose}
            className="hidden md:block p-2 hover:bg-white/10 rounded-full transition-colors text-white shrink-0"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Lyrics Content */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto px-6 pb-32 pt-10 no-scrollbar relative"
      >
        <div className="max-w-3xl mx-auto flex flex-col items-start gap-8">
          {loading ? (
            <div className="w-full flex justify-center py-20">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
            </div>
          ) : syncedLines.length > 0 ? (
            syncedLines.map((line, i) => {
              const isActive = i === activeIndex;
              const isPast = i < activeIndex;
              
              return (
                <p
                  key={line.id || i}
                  ref={isActive ? activeLineRef : null}
                  className={`text-4xl font-bold transition-all duration-300 transform origin-left cursor-pointer
                    ${isActive 
                      ? 'text-white scale-110 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]' 
                      : isPast 
                        ? 'text-white/40' 
                        : 'text-white/20 hover:text-white/40'
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
            <div className="text-2xl text-zinc-400 font-medium leading-relaxed whitespace-pre-wrap text-center w-full">
              {lyrics || "Instrumental or no lyrics available."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
