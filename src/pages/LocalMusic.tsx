import { useState, useRef, useEffect } from 'react';
import { Upload, Play, Pause, Music, Trash2, FolderOpen } from 'lucide-react';
import { db } from '../lib/db';
import { parseID3Tags } from '../lib/id3';
import { useAudioStore } from '../store/useAudioStore';
import { TrackContextMenu } from '../components/ui/TrackContextMenu';
import type { Track } from '../types';

export function LocalMusic() {
  const [localTracks, setLocalTracks] = useState<Track[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { setQueue, playTrack, queue, isPlaying, currentIndex, play, pause } = useAudioStore();

  useEffect(() => {
    db.loadAllLocalTracks().then(tracks => {
      setLocalTracks(tracks);
    }).catch(e => console.error("Failed to load tracks", e));
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsImporting(true);
    
    const newTracks: Track[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('audio/')) continue;
      
      try {
        const metadata = await parseID3Tags(file);
        
        const trackMetadata = {
          id: crypto.randomUUID(),
          title: metadata.title,
          artist: metadata.artist,
          coverArtUrl: metadata.coverArtUrl,
        };
        
        const savedTrack = await db.saveTrack(file, trackMetadata);
        newTracks.push(savedTrack);
      } catch (err) {
        console.error("Error processing file", file.name, err);
      }
    }
    
    setLocalTracks(prev => [...prev, ...newTracks]);
    setIsImporting(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePlay = (index: number) => {
    const isSameQueue = queue.length === localTracks.length && queue.every((t, i) => t.id === localTracks[i].id);
    
    if (!isSameQueue) {
      setQueue(localTracks);
    }
    
    if (currentIndex === index && isPlaying) {
      pause();
    } else if (currentIndex === index && !isPlaying) {
      play();
    } else {
      playTrack(index);
    }
  };

  const clearAll = async () => {
    if (confirm("Are you sure you want to remove all local tracks from your device?")) {
      await db.clearLocalTracks();
      setLocalTracks([]);
    }
  };

  return (
    <div className="animate-fade-in pb-32 md:pb-10">
      {/* Header */}
      <div className="px-6 md:px-10 pt-8 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Local Music</h1>
          <p className="text-sm text-zinc-500">Play music stored on your device offline.</p>
        </div>
        
        <div className="flex gap-3">
          {localTracks.length > 0 && (
            <button 
              onClick={clearAll}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 bg-red-400/10 hover:bg-red-400/15 rounded-lg transition-colors font-medium"
            >
              <Trash2 size={15} />
              Clear All
            </button>
          )}
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-zinc-950 font-semibold text-sm rounded-full hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            <Upload size={16} />
            {isImporting ? 'Importing…' : 'Import Files'}
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            multiple 
            accept="audio/*" 
            className="hidden" 
          />
        </div>
      </div>

      <div className="px-6 md:px-10">
        {localTracks.length === 0 && !isImporting ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-white/[0.06] rounded-2xl">
            <div className="w-20 h-20 bg-white/[0.04] rounded-2xl flex items-center justify-center mb-6">
              <FolderOpen size={32} className="text-zinc-600" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-300 mb-2">No local music found</h2>
            <p className="text-sm text-zinc-600 max-w-sm">
              Import MP3, FLAC, or other audio files from your device. Files are securely cached for offline playback.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {localTracks.map((track, idx) => {
              const isCurrentlyPlaying = currentIndex === idx && queue[idx]?.id === track.id && isPlaying;
              
              return (
                <div 
                  key={track.id} 
                  className="group cursor-pointer"
                  onClick={() => handlePlay(idx)}
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-800 shadow-lg mb-3">
                    {track.coverArtUrl ? (
                      <img src={track.coverArtUrl} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="text-zinc-600 w-10 h-10" />
                      </div>
                    )}
                    
                    <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-all duration-300 ${isCurrentlyPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      <div className={`w-11 h-11 rounded-full bg-emerald-500 flex items-center justify-center text-zinc-950 shadow-xl transition-all duration-300 ${isCurrentlyPlaying ? 'scale-100' : 'scale-75 group-hover:scale-100'}`}>
                        {isCurrentlyPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                      </div>
                    </div>
                  </div>
                  
                  
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-zinc-100 truncate text-sm">{track.title}</h3>
                      <p className="text-xs text-zinc-500 truncate mt-0.5">{track.artist}</p>
                    </div>
                    <div onClick={e => e.stopPropagation()} className="shrink-0">
                      <TrackContextMenu track={track} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
