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
            const raw = res.data.plainLyrics
              .split('\n')
              .map((l: string) => l.trim())
              .filter((l: string) => l.length > 0);
            
            if (raw.length > 0) {
              const parsed: SyncedLine[] = raw.map((text: string, index: number) => ({
                start_time: index * 4,
                text
              }));
              setSyncedLines(parsed);
            } else {
              setSyncedLines([]);
            }
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

  // Loading skeleton with fixed 2-line structure
  if (loading) {
    return (
      <div 
        className="w-full h-[62px] bg-white/[0.035] rounded-2xl px-4 py-2.5 flex items-center justify-between cursor-pointer border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative overflow-hidden backdrop-blur-xl"
        onClick={onClick}
      >
        <div className="flex flex-col min-w-0 flex-1 justify-center">
          <div className="w-3/5 h-4 bg-white/[0.08] rounded-md animate-pulse mb-1.5" />
          <div className="w-2/5 h-3 bg-white/[0.04] rounded-md animate-pulse" />
        </div>
        <ChevronRight size={16} className="text-white/20 shrink-0" />
      </div>
    );
  }

  // Find active line index based on playback progress
  const activeIndex = syncedLines.findIndex((line, index) => {
    const nextLine = syncedLines[index + 1];
    return progress >= line.start_time && (!nextLine || progress < nextLine.start_time);
  });

  // Always compute TWO lines (Line 1: current active, Line 2: upcoming/continuation)
  let line1 = '';
  let line2 = '';

  if (syncedLines.length >= 2) {
    if (activeIndex < 0) {
      // Before first timed lyric begins (intro): display first and second upcoming lines
      line1 = syncedLines[0].text;
      line2 = syncedLines[1].text;
    } else {
      // Normal playback: current line
      line1 = syncedLines[activeIndex].text;
      if (activeIndex + 1 < syncedLines.length) {
        // Next line
        line2 = syncedLines[activeIndex + 1].text;
      } else {
        // Final line reached: graceful outro continuation so it never collapses to single line
        line2 = currentTrack.artist ? `♪ ${currentTrack.artist}` : '♪ Outro';
      }
    }
  } else if (syncedLines.length === 1) {
    line1 = syncedLines[0].text;
    line2 = currentTrack.artist ? `♪ ${currentTrack.artist}` : 'Tap to view full lyrics';
  } else {
    // If no synced lyrics available from API
    line1 = currentTrack.title || 'Lyrics';
    line2 = currentTrack.artist ? `by ${currentTrack.artist}` : 'Tap to open full lyrics';
  }

  return (
    <div 
      className="w-full min-h-[62px] h-[62px] bg-white/[0.04] hover:bg-white/[0.07] active:scale-[0.985] rounded-2xl px-4 py-2 flex items-center justify-between cursor-pointer border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.36)] relative overflow-hidden transition-all duration-300 group select-none"
      onClick={onClick}
    >
      {/* Dynamic Cover Artwork Ambient Glow */}
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
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xl pointer-events-none" />
        </>
      )}

      <div className="w-full flex items-center justify-between z-10 relative gap-3">
        <div className="flex flex-col min-w-0 flex-1 justify-center py-0.5">
          {/* Always Line 1: Active Lyric */}
          <span className="text-[14px] sm:text-[15px] font-bold text-white tracking-tight leading-snug truncate drop-shadow-sm transition-all duration-200">
            {line1}
          </span>
          {/* Always Line 2: Upcoming Lyric */}
          <span className="text-[12px] sm:text-[12.5px] font-medium text-white/50 leading-snug truncate mt-0.5 transition-all duration-200">
            {line2}
          </span>
        </div>
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white/[0.04] border border-white/[0.06] group-hover:bg-white/[0.08] group-hover:border-white/10 transition-all shrink-0">
          <ChevronRight size={15} className="text-white/40 group-hover:text-white/80 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </div>
  );
}
