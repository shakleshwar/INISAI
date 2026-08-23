import { useState, useEffect } from 'react';
import { Mic2, Maximize2 } from 'lucide-react';
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
        className="w-full bg-white/[0.02] rounded-2xl p-5 mt-4 flex flex-col items-start gap-3 cursor-pointer border border-white/[0.04] shadow-lg relative overflow-hidden group"
        onClick={onClick}
      >
        <div className="flex items-center gap-2 mb-2 bg-white/[0.04] px-3 py-1.5 rounded-full border border-white/[0.04]">
          <Mic2 size={14} className="text-white" />
          <span className="text-[11px] font-bold text-white uppercase tracking-widest">Lyrics</span>
        </div>
        <div className="w-3/4 h-6 bg-white/[0.04] rounded-md animate-pulse" />
        <div className="w-1/2 h-5 bg-white/[0.02] rounded-md animate-pulse" />
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
      className="w-full bg-white/[0.02] rounded-2xl p-5 mt-4 flex flex-col items-start gap-2 cursor-pointer border border-white/[0.06] shadow-xl relative overflow-hidden transition-all duration-500 hover:border-white/[0.12] hover:shadow-[0_8px_32px_rgba(0,0,0,0.6)] active:scale-[0.98] group"
      onClick={onClick}
    >
      {/* Dynamic Blurred Background */}
      {currentTrack.coverArtUrl && (
        <>
          <div 
            className="absolute inset-0 opacity-40 blur-2xl scale-125 transition-transform duration-1000 group-hover:scale-150 mix-blend-screen"
            style={{ 
              backgroundImage: `url(${currentTrack.coverArtUrl})`,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
              filter: 'saturate(150%) blur(30px)'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#030304]/90 via-[#030304]/60 to-[#030304]/40 pointer-events-none" />
        </>
      )}
      
      <div className="flex items-center gap-2 mb-2 z-10 w-full justify-between">
        <span className="text-[11px] font-bold text-white uppercase tracking-widest flex items-center gap-2 bg-black/40 border border-white/[0.06] px-3 py-1.5 rounded-full backdrop-blur-md shadow-sm">
          <Mic2 size={14} /> Lyrics
        </span>
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-md text-[11px] font-bold text-white uppercase tracking-wider border border-white/20">
          <Maximize2 size={12} /> Expand
        </div>
      </div>
      
      <div className="w-full flex flex-col z-10 pt-1">
        <span className="text-2xl font-black text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] w-full transition-all duration-300 tracking-tight leading-tight">
          {currentLine}
        </span>
        <span className="text-base font-semibold text-white/50 w-full mt-2 truncate">
          {nextLine}
        </span>
      </div>
    </div>
  );
}
