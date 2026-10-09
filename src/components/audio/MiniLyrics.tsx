import { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { api } from '../../services/api';
import type { Track } from '../../types';

interface MiniLyricsProps {
  currentTrack: Track;
  progress: number;
  onClick: () => void;
}

interface SyncedLine {
  start_time: number;
  text: string;
}

export function MiniLyrics({ currentTrack, progress, onClick }: MiniLyricsProps) {
  const [syncedLines, setSyncedLines] = useState<SyncedLine[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const fetchLyrics = async () => {
      setLoading(true);
      try {
        const res = await api.getLyricaLyrics(currentTrack.title, currentTrack.artist);
        if (res?.status === 'success' && isMounted) {
          if (res.data.syncedLyrics) {
            const lines = res.data.syncedLyrics.split('\n');
            const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;
            const parsed: SyncedLine[] = [];
            
            for (const line of lines) {
              const match = line.match(regex);
              if (match) {
                const minutes = parseInt(match[1], 10);
                const seconds = parseInt(match[2], 10);
                const ms = parseInt(match[3], 10) * (match[3].length === 2 ? 10 : 1);
                const timeInSeconds = minutes * 60 + seconds + ms / 1000;
                const text = match[4].trim();
                if (text) {
                  parsed.push({ start_time: timeInSeconds, text });
                }
              }
            }
            setSyncedLines(parsed);
          } else if (res.data.plainLyrics) {
            const firstLine = res.data.plainLyrics.split('\n').find((l: string) => l.trim().length > 0) || "Lyrics available";
            setSyncedLines([{ start_time: 0, text: firstLine }]);
          } else {
            setSyncedLines([]);
          }
        } else if (isMounted) {
          setSyncedLines([]);
        }
      } catch {
        if (isMounted) setSyncedLines([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchLyrics();
    return () => { isMounted = false; };
  }, [currentTrack]);

  if (loading) {
    return (
      <div 
        className="w-full h-[64px] bg-white/[0.03] rounded-2xl px-4 py-3 flex flex-col justify-center cursor-pointer border border-white/[0.06] shadow-lg relative overflow-hidden backdrop-blur-xl"
        onClick={onClick}
      >
        <div className="w-3/4 h-4 bg-white/[0.05] rounded-md animate-pulse mb-1.5" />
        <div className="w-1/2 h-3 bg-white/[0.03] rounded-md animate-pulse" />
      </div>
    );
  }

  if (syncedLines.length === 0) {
    return null;
  }

  // Find current line
  const activeIndex = syncedLines.findIndex((line, index) => {
    const nextLine = syncedLines[index + 1];
    return progress >= line.start_time && (!nextLine || progress < nextLine.start_time);
  });
  
  const currentLine = activeIndex >= 0 ? syncedLines[activeIndex].text : null;
  const nextLine = activeIndex >= 0 && activeIndex + 1 < syncedLines.length ? syncedLines[activeIndex + 1].text : '';

  return (
    <div 
      className="w-full bg-white/[0.035] hover:bg-white/[0.06] active:scale-[0.98] rounded-2xl px-4 py-3 flex items-center justify-between cursor-pointer border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.36)] relative overflow-hidden transition-all duration-300 group"
      onClick={onClick}
    >
      {/* Dynamic Cover Artwork Glow */}
      {currentTrack.coverArtUrl && (
        <>
          <div 
            className="absolute inset-0 scale-[1.5] pointer-events-none transition-all duration-1000 ease-out opacity-25 group-hover:opacity-40"
            style={{ 
              backgroundImage: `url(${currentTrack.coverArtUrl})`,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
              filter: 'blur(30px) saturate(200%) brightness(0.7)'
            }}
          />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xl pointer-events-none" />
        </>
      )}

      <div className="w-full flex items-center justify-between z-10 relative gap-3">
        <div className="flex flex-col min-w-0 flex-1">
          {currentLine ? (
            <>
              <span className="text-[15px] font-bold text-white tracking-tight leading-snug line-clamp-1 drop-shadow-sm">
                {currentLine}
              </span>
              {nextLine && (
                <span className="text-[12px] font-medium text-white/50 mt-0.5 truncate">
                  {nextLine}
                </span>
              )}
            </>
          ) : (
            <span className="text-[14px] font-semibold text-white/80 truncate">
              {syncedLines[0]?.text || 'Tap to view full lyrics'}
            </span>
          )}
        </div>
        <ChevronRight size={16} className="text-white/30 group-hover:text-white/80 group-hover:translate-x-0.5 transition-all shrink-0" />
      </div>
    </div>
  );
}
