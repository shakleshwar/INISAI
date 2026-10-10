import { useEffect, useRef, useCallback } from 'react';
import { useAudioStore } from '../store/useAudioStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { API_BASE, api } from '../services/api';
import YouTube from 'react-youtube';

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytPlayerRef = useRef<any | null>(null);
  const currentLoadedVideoIdRef = useRef<string | null>(null);
  const loadIdRef = useRef(0);

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
  const addRecentSong = useAudioStore((state) => state.addRecentSong);

  // Settings subscriptions
  const engine = useSettingsStore((state) => state.streamingService);
  const autoplay = useSettingsStore((state) => state.autoplay);

  const currentTrack = queue[currentIndex];
  const isOnline = currentTrack?.source === 'online';
  const useYTPlayer = isOnline && engine === 'youtube';

  // Handle Track Completion with Autoplay algorithm
  const handleTrackEnd = useCallback(async () => {
    const store = useAudioStore.getState();
    if (store.loopMode === 'one') {
      if (!useYTPlayer && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.error("Loop failed:", e));
      } else if (useYTPlayer && ytPlayerRef.current) {
        ytPlayerRef.current.seekTo(0, true);
        ytPlayerRef.current.playVideo();
      }
      return;
    }

    const isLastTrack = store.currentIndex >= store.queue.length - 1;
    if (isLastTrack && autoplay && currentTrack) {
      try {
        const query = currentTrack.artist || currentTrack.title;
        const results = await api.searchOnlineTracks(query);
        const existingIds = new Set(store.queue.map(t => t.id || t.videoId));
        const newTracks = results.filter(t => !existingIds.has(t.id || t.videoId)).slice(0, 5);
        if (newTracks.length > 0) {
          store.addTracks(newTracks);
          store.next();
          return;
        }
      } catch (e) {
        console.warn("Autoplay fetch notice:", e);
      }
    }

    store.next();
  }, [autoplay, currentTrack, useYTPlayer]);

  // Fast Instant Track Playback Synchronization
  useEffect(() => {
    if (!currentTrack) return;
    
    const thisLoadId = ++loadIdRef.current;
    addRecentSong(currentTrack);
    
    if (!useYTPlayer) {
      // Pause YouTube player if running
      try {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
          ytPlayerRef.current.pauseVideo();
        }
      } catch {}
      
      const audio = audioRef.current;
      if (audio) {
        let targetSrc = currentTrack.audioSrc || '';
        if (isOnline && engine !== 'youtube') {
          targetSrc = `${API_BASE}/api/stream/${currentTrack.videoId}?engine=${engine}&title=${encodeURIComponent(currentTrack.title)}&artist=${encodeURIComponent(currentTrack.artist)}`;
        }
        
        // Only update src if changed, without calling audio.load() which causes reload lag
        if (audio.src !== targetSrc && !audio.src.endsWith(targetSrc)) {
          audio.src = targetSrc;
        }
        
        if (isPlaying) {
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              if (loadIdRef.current !== thisLoadId) {
                audio.pause();
              }
            }).catch(e => {
              if (loadIdRef.current === thisLoadId) {
                console.warn("Audio element play error:", e);
              }
            });
          }
        } else {
          audio.pause();
        }
      }
    } else {
      // Pause HTML5 audio
      if (audioRef.current) audioRef.current.pause();
      
      // Fast YouTube track switching using persistent player instance
      const yt = ytPlayerRef.current;
      const targetVideoId = currentTrack.videoId;

      if (yt && targetVideoId) {
        if (currentLoadedVideoIdRef.current !== targetVideoId) {
          currentLoadedVideoIdRef.current = targetVideoId;
          try {
            if (isPlaying) {
              if (typeof yt.loadVideoById === 'function') {
                yt.loadVideoById(targetVideoId);
              }
            } else {
              if (typeof yt.cueVideoById === 'function') {
                yt.cueVideoById(targetVideoId);
              }
            }
          } catch (e) {
            console.warn("YouTube fast-switch notice:", e);
          }
        } else {
          // Same video ID: simply sync play/pause state
          try {
            if (isPlaying && typeof yt.playVideo === 'function') {
              yt.playVideo();
            } else if (!isPlaying && typeof yt.pauseVideo === 'function') {
              yt.pauseVideo();
            }
          } catch {}
        }
      }
    }
  }, [currentIndex, isPlaying, useYTPlayer, isOnline, engine, currentTrack?.id, currentTrack?.videoId]);

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
            state.seek(Math.min(state.duration, state.progress + skipTime));
          });
        } catch {}
      } catch {}
    }
  }, [currentTrack, play, pause, prev, next]);

  const lastSeekTimeRef = useRef(0);

  // Handle external seeking from store (User scrubbing or tapping the audio progress bar)
  useEffect(() => {
    const unsub = useAudioStore.subscribe((state, prevState) => {
      if (state.seekRequest !== prevState.seekRequest) {
        lastSeekTimeRef.current = Date.now();
        const targetTime = state.progress;

        if (useYTPlayer && ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
          try {
            ytPlayerRef.current.seekTo(targetTime, true);
          } catch (e) {
            console.warn("YouTube seek error:", e);
          }
        }

        if (audioRef.current && (!useYTPlayer || audioRef.current.src)) {
          try {
            audioRef.current.currentTime = targetTime;
          } catch (e) {
            console.warn("HTML5 audio seek error:", e);
          }
        }
      }
    });
    return unsub;
  }, [useYTPlayer]);

  // Poll progress for YouTube playback
  useEffect(() => {
    let interval: any;
    if (useYTPlayer && isPlaying) {
      interval = setInterval(async () => {
        // Skip polling right after a seek to avoid buffer race conditions
        if (Date.now() - lastSeekTimeRef.current < 450) return;

        if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
          const time = await ytPlayerRef.current.getCurrentTime();
          _setProgress(time);
        }
      }, 400);
    }
    return () => clearInterval(interval);
  }, [useYTPlayer, isPlaying, _setProgress]);

  return (
    <>
      {/* HTML5 Audio Player with preloading enabled */}
      <audio
        ref={audioRef}
        preload="auto"
        onTimeUpdate={() => {
          if (Date.now() - lastSeekTimeRef.current < 350) return;
          if (audioRef.current && !useYTPlayer) {
            _setProgress(audioRef.current.currentTime);
          }
        }}
        onDurationChange={() => {
          if (audioRef.current && !useYTPlayer) {
            _setDuration(audioRef.current.duration);
          }
        }}
        onEnded={handleTrackEnd}
        onError={(e) => {
          console.error("Local Audio Player Error:", e);
          pause();
        }}
      />
      
      {/* Persistent Off-Screen YouTube Player (No unmounting between tracks for instant <300ms switching) */}
      <div 
        className="pointer-events-none opacity-0 fixed -top-[9999px] -left-[9999px] w-[200px] h-[200px] overflow-hidden"
        style={{ zIndex: -100 }}
      >
        {useYTPlayer && (
          <YouTube
            videoId={currentTrack?.videoId || ''}
            opts={{
              height: '200',
              width: '200',
              playerVars: {
                autoplay: isPlaying ? 1 : 0,
                controls: 0,
                disablekb: 1,
                fs: 0,
                iv_load_policy: 3,
                rel: 0,
                showinfo: 0,
                playsinline: 1,
                enablejsapi: 1,
              },
            }}
            onReady={(e) => {
              ytPlayerRef.current = e.target;
              e.target.setVolume(volume * 100);
              
              if (currentTrack?.videoId) {
                currentLoadedVideoIdRef.current = currentTrack.videoId;
                if (useAudioStore.getState().isPlaying) {
                  e.target.playVideo();
                }
              }
            }}
            onStateChange={async (e) => {
              // 1 = PLAYING, 2 = PAUSED, 0 = ENDED
              if (e.data === 1) {
                _setIsPlaying(true);
                try {
                  const duration = await e.target.getDuration();
                  if (duration) _setDuration(duration);
                } catch {}
              } else if (e.data === 2) {
                if (useAudioStore.getState().isPlaying) {
                  _setIsPlaying(false);
                }
              } else if (e.data === 0) {
                handleTrackEnd();
              }
            }}
            onError={(e) => {
              console.warn("YouTube Player playback code " + e.data + ", switching to stream fallback...");
              // Automatic instant fallback if embed is restricted
              if (currentTrack && audioRef.current) {
                const fallbackSrc = `${API_BASE}/api/stream/${currentTrack.videoId}?engine=youtube&title=${encodeURIComponent(currentTrack.title)}&artist=${encodeURIComponent(currentTrack.artist)}`;
                audioRef.current.src = fallbackSrc;
                if (useAudioStore.getState().isPlaying) {
                  audioRef.current.play().catch(err => console.error("Audio fallback play failed:", err));
                }
              }
            }}
          />
        )}
      </div>

      {children}
    </>
  );
}

export default AudioProvider;
