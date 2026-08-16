import { useEffect, useRef } from 'react';
import { useAudioStore } from '../store/useAudioStore';
import YouTube from 'react-youtube';

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytPlayerRef = useRef<any | null>(null);
  
  const queue = useAudioStore((state) => state.queue);
  const currentIndex = useAudioStore((state) => state.currentIndex);
  const isPlaying = useAudioStore((state) => state.isPlaying);
  const volume = useAudioStore((state) => state.volume);
  
  const _setProgress = useAudioStore((state) => state._setProgress);
  const _setDuration = useAudioStore((state) => state._setDuration);
  const _setIsPlaying = useAudioStore((state) => state._setIsPlaying);
  const next = useAudioStore((state) => state.next);
  const prev = useAudioStore((state) => state.prev);
  const play = useAudioStore((state) => state.play);
  const pause = useAudioStore((state) => state.pause);
  const togglePlay = useAudioStore((state) => state.togglePlay);
  const addRecentSong = useAudioStore((state) => state.addRecentSong);

  const currentTrack = queue[currentIndex];
  const isOnline = currentTrack?.source === 'online';

  // Sync state to players
  useEffect(() => {
    if (!currentTrack) return;
    
    addRecentSong(currentTrack);
    
    if (!isOnline) {
      // Pause YouTube
      try {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
          ytPlayerRef.current.pauseVideo();
        }
      } catch (e) {}
      
      const audio = audioRef.current;
      if (audio) {
        const targetSrc = currentTrack.audioSrc || '';
        if (audio.src !== targetSrc && !audio.src.endsWith(targetSrc)) {
          audio.src = targetSrc;
        }
        
        if (isPlaying) {
          audio.play().catch(e => console.error("Local play failed:", e));
        } else {
          audio.pause();
        }
      }
    } else {
      // Pause Local
      if (audioRef.current) audioRef.current.pause();
      
      try {
        const yt = ytPlayerRef.current;
        if (yt && typeof yt.playVideo === 'function') {
          if (isPlaying) {
            yt.playVideo();
          } else {
            yt.pauseVideo();
          }
        }
      } catch (e) {}
    }
  }, [currentIndex, queue, isPlaying, isOnline, currentTrack]);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
      ytPlayerRef.current.setVolume(volume * 100);
    }
  }, [volume]);

  // Media Session API Sync
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentTrack.title || 'Unknown Title',
          artist: currentTrack.artist || 'Unknown Artist',
          album: 'INISAI Player',
          artwork: currentTrack.coverArtUrl ? [
            { src: currentTrack.coverArtUrl, sizes: '512x512', type: 'image/jpeg' }
          ] : []
        });

        navigator.mediaSession.setActionHandler('play', play);
        navigator.mediaSession.setActionHandler('pause', pause);
        navigator.mediaSession.setActionHandler('previoustrack', prev);
        navigator.mediaSession.setActionHandler('nexttrack', next);
      } catch (e) {
        console.error("MediaSession error:", e);
      }
    }
  }, [currentIndex, queue, currentTrack, play, pause, prev, next]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          // Optionally add scrubbing later, for now we can skip track or do nothing
          break;
        case 'ArrowLeft':
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay]);

  // Handle external seeking from store (User scrubbing the progress bar)
  useEffect(() => {
    const unsub = useAudioStore.subscribe((state, prevState) => {
      // If the difference is large, it was a manual seek by the user
      if (Math.abs(state.progress - prevState.progress) > 1.5) {
        if (!isOnline && audioRef.current) {
          audioRef.current.currentTime = state.progress;
        } else if (isOnline && ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
          ytPlayerRef.current.seekTo(state.progress, true);
        }
      }
    });
    return unsub;
  }, [isOnline]);

  // YT Progress Polling
  useEffect(() => {
    let interval: any;
    if (isOnline && isPlaying) {
      interval = setInterval(async () => {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
          const time = await ytPlayerRef.current.getCurrentTime();
          _setProgress(time);
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isOnline, isPlaying, _setProgress]);

  return (
    <>
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          if (audioRef.current && !isOnline) {
            _setProgress(audioRef.current.currentTime);
          }
        }}
        onDurationChange={() => {
          if (audioRef.current && !isOnline) {
            _setDuration(audioRef.current.duration);
          }
        }}
        onEnded={() => {
          if (!isOnline) {
            if (useAudioStore.getState().loopMode === 'one') {
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(e => console.error("Local loop play failed:", e));
              }
            } else {
              next();
            }
          }
        }}
        className="hidden"
      />
      
      {/* Hidden YouTube Player */}
      <div className="hidden pointer-events-none opacity-0 w-0 h-0 absolute overflow-hidden">
        {isOnline && currentTrack?.videoId && (
          <YouTube
            videoId={currentTrack.videoId}
            opts={{
              height: '10',
              width: '10',
              playerVars: {
                autoplay: isPlaying ? 1 : 0,
                controls: 0,
                disablekb: 1,
                fs: 0,
                iv_load_policy: 3,
                rel: 0,
                showinfo: 0,
              },
            }}
            onReady={(e) => {
              ytPlayerRef.current = e.target;
              e.target.setVolume(volume * 100);
              if (isPlaying) {
                e.target.playVideo();
              }
            }}
            onPlay={async (e) => {
              _setIsPlaying(true);
              const duration = await e.target.getDuration();
              _setDuration(duration);
            }}
            onPause={() => {
              // Only update store state if the user didn't manually pause
              if (useAudioStore.getState().isPlaying) {
                _setIsPlaying(false);
              }
            }}
            onEnd={() => {
              if (useAudioStore.getState().loopMode === 'one') {
                if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
                  ytPlayerRef.current.seekTo(0, true);
                  ytPlayerRef.current.playVideo();
                }
              } else {
                next();
              }
            }}
            onError={(e) => {
              console.error("YouTube Player Error:", e.data);
              next(); // Skip to next track on error
            }}
          />
        )}
      </div>

      {children}
    </>
  );
}
