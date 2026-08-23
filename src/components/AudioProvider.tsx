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
  const engine = localStorage.getItem('streamingService') || 'youtube';
  const isOnline = currentTrack?.source === 'online';
  const useYTPlayer = isOnline && engine === 'youtube';

  // Sync state to players
  useEffect(() => {
    if (!currentTrack) return;
    
    addRecentSong(currentTrack);
    
    if (!useYTPlayer) {
      // Pause YouTube
      try {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
          ytPlayerRef.current.pauseVideo();
        }
      } catch (e) {}
      
      const audio = audioRef.current;
      if (audio) {
        let targetSrc = currentTrack.audioSrc || '';
        if (isOnline && engine !== 'youtube') {
          targetSrc = '/api/stream/' + currentTrack.videoId + '?engine=' + engine + '&title=' + encodeURIComponent(currentTrack.title) + '&artist=' + encodeURIComponent(currentTrack.artist);
        }
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
  }, [currentIndex, queue, isPlaying, useYTPlayer, isOnline, engine, currentTrack, addRecentSong]);

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
        
        try {
          navigator.mediaSession.setActionHandler('seekto', (details) => {
            if (details.seekTime !== undefined) {
              useAudioStore.getState().seek(details.seekTime);
            }
          });
          navigator.mediaSession.setActionHandler('seekbackward', (details) => {
            const state = useAudioStore.getState();
            const skipTime = details.seekOffset || 10;
            state.seek(Math.max(0, state.progress - skipTime));
          });
          navigator.mediaSession.setActionHandler('seekforward', (details) => {
            const state = useAudioStore.getState();
            const skipTime = details.seekOffset || 10;
            state.seek(Math.min(state.duration || 100, state.progress + skipTime));
          });
        } catch (error) {
          console.warn('Warning! The "seekto", "seekbackward", "seekforward" media session action is not supported.');
        }
      } catch (e) {
        console.error("MediaSession error:", e);
      }
    }
  }, [currentIndex, queue, currentTrack, play, pause, prev, next]);

  // Sync MediaSession position
  useEffect(() => {
    const unsub = useAudioStore.subscribe((state, prevState) => {
      // Only update when isPlaying changes, duration changes, or a large seek happens
      if (
        state.isPlaying !== prevState.isPlaying ||
        state.duration !== prevState.duration ||
        Math.abs(state.progress - prevState.progress) > 1.5
      ) {
        if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession) {
          try {
            navigator.mediaSession.setPositionState({
              duration: state.duration || 100,
              playbackRate: state.isPlaying ? 1 : 0,
              position: state.progress || 0
            });
          } catch (e) {}
        }
      }
    });
    return unsub;
  }, []);

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
          if (e.ctrlKey) {
            e.preventDefault();
            useAudioStore.getState().next();
          } else {
            e.preventDefault();
            const state = useAudioStore.getState();
            state.seek(Math.min((state.duration || 100), state.progress + 10));
          }
          break;
        case 'ArrowLeft':
          if (e.ctrlKey) {
            e.preventDefault();
            useAudioStore.getState().prev();
          } else {
            e.preventDefault();
            const state = useAudioStore.getState();
            state.seek(Math.max(0, state.progress - 10));
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay]);

  // Handle external seeking from store (User scrubbing the progress bar)
  useEffect(() => {
    const unsub = useAudioStore.subscribe((state, prevState) => {
      // If seekRequest changed, it was a manual seek by the user
      if (state.seekRequest !== prevState.seekRequest) {
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
          if (audioRef.current && !useYTPlayer) {
            _setProgress(audioRef.current.currentTime);
          }
        }}
        onDurationChange={() => {
          if (audioRef.current && !useYTPlayer) {
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
        {useYTPlayer && currentTrack?.videoId && (
          <YouTube
            key={currentTrack.videoId}
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
