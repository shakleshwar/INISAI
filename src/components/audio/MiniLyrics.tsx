import { useState, useEffect } from 'react';
import { Mic2 } from 'lucide-react';
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
        if (res?.status === 'success' && res.data?.syncedLyrics && isMounted) {
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
        } else if (isMounted) {
          setSyncedLines([]);
        }
      } catch (err) {
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
        className="w-full bg-[#1a1a1a] rounded-xl p-4 mt-2 flex flex-col items-start gap-2 cursor-pointer border border-white/5 shadow-lg relative overflow-hidden"
        onClick={onClick}
      >
        <div className="flex items-center gap-2 mb-1">
          <Mic2 size={16} className="text-white" />
          <span className="text-sm font-bold text-white tracking-wide">Lyrics</span>
        </div>
        <div className="w-2/3 h-5 bg-white/5 rounded animate-pulse" />
        <div className="w-1/2 h-5 bg-white/5 rounded animate-pulse" />
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
      className="w-full bg-[#1a1a1a] rounded-xl p-4 mt-2 flex flex-col items-start gap-2 cursor-pointer border border-white/10 shadow-xl relative overflow-hidden transition-transform active:scale-[0.98] group"
      onClick={onClick}
    >
      {/* Dynamic Blurred Background */}
      {currentTrack.coverArtUrl && (
        <div 
          className="absolute inset-0 opacity-60 blur-xl scale-125"
          style={{ 
            backgroundImage: `url(${currentTrack.coverArtUrl})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover'
          }}
        />
      )}
      
      {/* Decorative gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 pointer-events-none" />

      <div className="flex items-center gap-2 mb-1 z-10 w-full justify-between">
        <span className="text-sm font-bold text-white tracking-wide flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full backdrop-blur-md">
          <Mic2 size={16} /> Lyrics
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 px-3 py-1 rounded-full backdrop-blur-md text-xs font-semibold text-white">
          Expand
        </div>
      </div>
      
      <div className="w-full flex flex-col z-10">
        <span className="text-2xl font-bold text-white drop-shadow-md w-full transition-all duration-300">
          {currentLine}
        </span>
        <span className="text-lg font-semibold text-white/60 w-full mt-1">
          {nextLine}
        </span>
      </div>
    </div>
  );
}
