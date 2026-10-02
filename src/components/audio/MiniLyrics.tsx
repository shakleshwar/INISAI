import { useState, useEffect } from 'react';
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
      } catch (_err) {
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
        className="w-full h-[88px] bg-[var(--color-bg-card)] rounded-2xl p-4 flex flex-col justify-center cursor-pointer border border-white/[0.04] shadow-lg relative overflow-hidden"
        onClick={onClick}
      >
        <div className="w-3/4 h-5 bg-white/[0.04] rounded-md animate-pulse mb-2" />
        <div className="w-1/2 h-4 bg-white/[0.02] rounded-md animate-pulse" />
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
  
  const currentLine = activeIndex >= 0 ? syncedLines[activeIndex].text : '...';
  const nextLine = activeIndex >= 0 && activeIndex + 1 < syncedLines.length ? syncedLines[activeIndex + 1].text : '';

  return (
    <div 
      className="w-full h-[88px] bg-[#030304] rounded-2xl px-4 py-3 flex flex-col justify-center cursor-pointer border border-white/[0.06] shadow-xl relative overflow-hidden transition-all duration-300 active:scale-[0.98] group"
      onClick={onClick}
    >
      {/* Premium Dynamic Background */}
      {currentTrack.coverArtUrl && (
        <>
          <div 
            className="absolute inset-0 scale-[1.5] pointer-events-none transition-all duration-1000 ease-out opacity-60 group-hover:opacity-80 group-hover:scale-[1.6]"
            style={{ 
              backgroundImage: `url(${currentTrack.coverArtUrl})`,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
              filter: 'blur(24px) saturate(200%) brightness(0.8)'
            }}
          />
          {/* Frosted material for readability */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xl pointer-events-none transition-all duration-300 group-hover:bg-black/40" />
        </>
      )}
      <div className="w-full flex flex-col z-10 relative">
        <span className="text-lg font-bold text-white w-full tracking-tight leading-snug line-clamp-2">
          {currentLine}
        </span>
        <span className="text-sm font-medium text-white/50 w-full mt-0.5 truncate">
          {nextLine}
        </span>
      </div>
    </div>
  );
}
