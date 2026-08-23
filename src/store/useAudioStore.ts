import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Track } from '../types';

interface AudioState {
  queue: Track[];
  shuffleOrder: number[];
  currentIndex: number;
  isPlaying: boolean;
  progress: number;
  duration: number;
  seekRequest: number;
  volume: number;
  isShuffled: boolean;
  loopMode: 'off' | 'all' | 'one';
  
  // New States
  recentSongs: Track[];
  likedSongs: Track[];
  // Cached Data
  cachedTrending: Record<string, Track[]>;
  cachedReleases: any[] | null;
  trendingRegion: string;
  isSettingsOpen: boolean;
  
  // Actions
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setQueue: (tracks: Track[]) => void;
  addTracks: (tracks: Track[]) => void;
  playTrack: (index: number) => void;
  toggleShuffle: () => void;
  toggleLoop: () => void;
  setCachedData: (region: string, trending: Track[], releases: any[] | null) => void;
  setTrendingRegion: (region: string) => void;
  setSettingsOpen: (isOpen: boolean) => void;
  // Playlists
  playlists: import('../types').Playlist[];
  
  // New Actions
  addRecentSong: (track: Track) => void;
  toggleLikedSong: (track: Track) => void;
  createPlaylist: (name: string) => string;
  deletePlaylist: (playlistId: string) => void;
  clonePlaylist: (id: string) => void;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  
  // Queue Actions
  playNext: (track: Track) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  reorderNextUp: (sourceIndex: number, destinationIndex: number) => void;
  
  // Internal actions used by AudioProvider
  _setProgress: (progress: number) => void;
  _setDuration: (duration: number) => void;
  _setIsPlaying: (isPlaying: boolean) => void;
}

function generateShuffleOrder(length: number, currentIndex: number): number[] {
  const indices = Array.from({ length }, (_, i) => i);
  if (currentIndex >= 0 && currentIndex < length) indices.splice(currentIndex, 1);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  if (currentIndex >= 0 && currentIndex < length) indices.unshift(currentIndex);
  return indices;
}

export const useAudioStore = create<AudioState>()(
  persist(
    (set) => ({
      queue: [],
      shuffleOrder: [],
      currentIndex: -1,
      isPlaying: false,
      progress: 0,
      duration: 0,
      seekRequest: 0,
      volume: 1, // 0 to 1
      isShuffled: false,
      loopMode: 'off',
      recentSongs: [],
      likedSongs: [],
      cachedTrending: {},
      cachedReleases: null,
      trendingRegion: 'Global',
      isSettingsOpen: false,
      playlists: [],

      setCachedData: (region, trending, releases) => set((state) => ({ 
        cachedTrending: { ...state.cachedTrending, [region]: trending }, 
        ...(releases !== null ? { cachedReleases: releases } : {}) 
      })),
      
      setTrendingRegion: (region) => set({ trendingRegion: region }),
      setSettingsOpen: (isOpen) => set({ isSettingsOpen: isOpen }),

      play: () => set({ isPlaying: true }),
      pause: () => set({ isPlaying: false }),
      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
      
      next: () => set((state) => {
        if (state.queue.length === 0) return state;
        if (state.loopMode === 'one') return { progress: 0, isPlaying: true };

        let nextIndex = state.currentIndex;
        if (state.isShuffled && state.shuffleOrder.length === state.queue.length) {
          const pos = state.shuffleOrder.indexOf(state.currentIndex);
          if (pos >= 0) {
            if (pos + 1 < state.shuffleOrder.length) nextIndex = state.shuffleOrder[pos + 1];
            else if (state.loopMode === 'all') nextIndex = state.shuffleOrder[0];
            else return { isPlaying: false };
          }
        } else {
          if (state.currentIndex + 1 < state.queue.length) nextIndex = state.currentIndex + 1;
          else if (state.loopMode === 'all') nextIndex = 0;
          else return { isPlaying: false };
        }
        return { currentIndex: nextIndex, isPlaying: true };
      }),
      
      prev: () => set((state) => {
        if (state.queue.length === 0) return state;
        let prevIndex = state.currentIndex;
        if (state.isShuffled && state.shuffleOrder.length === state.queue.length) {
          const pos = state.shuffleOrder.indexOf(state.currentIndex);
          if (pos > 0) prevIndex = state.shuffleOrder[pos - 1];
          else if (state.loopMode === 'all') prevIndex = state.shuffleOrder[state.shuffleOrder.length - 1];
          else prevIndex = state.shuffleOrder[0];
        } else {
          if (state.currentIndex - 1 >= 0) prevIndex = state.currentIndex - 1;
          else if (state.loopMode === 'all') prevIndex = state.queue.length - 1;
          else prevIndex = 0;
        }
        return { currentIndex: prevIndex, isPlaying: true };
      }),

      seek: (time: number) => set({ progress: time, seekRequest: Date.now() }),
      setVolume: (volume: number) => set({ volume }),
      
      setQueue: (tracks: Track[]) => set((state) => {
        const shuffleOrder = state.isShuffled ? generateShuffleOrder(tracks.length, tracks.length > 0 ? 0 : -1) : [];
        return { queue: tracks, shuffleOrder, currentIndex: tracks.length > 0 ? 0 : -1, isPlaying: tracks.length > 0 };
      }),
      
      addTracks: (tracks: Track[]) => set((state) => {
        const newQueue = [...state.queue, ...tracks];
        const shuffleOrder = state.isShuffled ? generateShuffleOrder(newQueue.length, state.currentIndex) : [];
        if (state.queue.length === 0 && newQueue.length > 0) {
          return { queue: newQueue, shuffleOrder, currentIndex: 0, isPlaying: true };
        }
        return { queue: newQueue, shuffleOrder };
      }),
      
      playNext: (track: Track) => set((state) => {
        if (state.queue.length === 0) {
          return { queue: [track], shuffleOrder: state.isShuffled ? [0] : [], currentIndex: 0, isPlaying: true };
        }
        const newQueue = [...state.queue];
        newQueue.splice(state.currentIndex + 1, 0, track);
        const shuffleOrder = state.isShuffled ? generateShuffleOrder(newQueue.length, state.currentIndex) : [];
        return { queue: newQueue, shuffleOrder };
      }),
      
      addToQueue: (track: Track) => set((state) => {
        if (state.queue.length === 0) {
          return { queue: [track], shuffleOrder: state.isShuffled ? [0] : [], currentIndex: 0, isPlaying: true };
        }
        const newQueue = [...state.queue, track];
        const shuffleOrder = state.isShuffled ? generateShuffleOrder(newQueue.length, state.currentIndex) : [];
        return { queue: newQueue, shuffleOrder };
      }),

      removeFromQueue: (index: number) => set((state) => {
        if (index < 0 || index >= state.queue.length) return state;
        const newQueue = [...state.queue];
        newQueue.splice(index, 1);
        
        let newIndex = state.currentIndex;
        if (index < state.currentIndex) {
          newIndex -= 1;
        } else if (index === state.currentIndex) {
          if (newQueue.length === 0) {
            return { queue: [], shuffleOrder: [], currentIndex: -1, isPlaying: false, progress: 0 };
          }
          if (newIndex >= newQueue.length) {
            newIndex = 0; // Wrap around if we deleted the last playing track
          }
        }
        
        const shuffleOrder = state.isShuffled ? generateShuffleOrder(newQueue.length, newIndex) : [];
        return { queue: newQueue, currentIndex: newIndex, shuffleOrder };
      }),

      clearQueue: () => set((state) => {
        if (state.currentIndex === -1) return { queue: [], shuffleOrder: [] };
        // Clear everything except the currently playing track
        const currentTrack = state.queue[state.currentIndex];
        return { 
          queue: currentTrack ? [currentTrack] : [], 
          shuffleOrder: state.isShuffled && currentTrack ? [0] : [], 
          currentIndex: currentTrack ? 0 : -1 
        };
      }),
      
      reorderNextUp: (sourceIndex: number, destinationIndex: number) => set((state) => {
        if (state.isShuffled) {
          const newShuffleOrder = [...state.shuffleOrder];
          const currentPos = newShuffleOrder.indexOf(state.currentIndex);
          if (currentPos < 0) return state;
          
          const actualSource = currentPos + 1 + sourceIndex;
          const actualDest = currentPos + 1 + destinationIndex;
          
          if (actualSource < newShuffleOrder.length && actualDest < newShuffleOrder.length) {
            const [removed] = newShuffleOrder.splice(actualSource, 1);
            newShuffleOrder.splice(actualDest, 0, removed);
            return { shuffleOrder: newShuffleOrder };
          }
        } else {
          const newQueue = [...state.queue];
          const actualSource = state.currentIndex + 1 + sourceIndex;
          const actualDest = state.currentIndex + 1 + destinationIndex;
          
          if (actualSource < newQueue.length && actualDest < newQueue.length) {
            const [removed] = newQueue.splice(actualSource, 1);
            newQueue.splice(actualDest, 0, removed);
            return { queue: newQueue };
          }
        }
        return state;
      }),
      
      playTrack: (index: number) => set((state) => {
        const shuffleOrder = state.isShuffled ? generateShuffleOrder(state.queue.length, index) : state.shuffleOrder;
        return { currentIndex: index, shuffleOrder, isPlaying: true };
      }),

      toggleShuffle: () => set((state) => {
        const isShuffled = !state.isShuffled;
        const shuffleOrder = isShuffled ? generateShuffleOrder(state.queue.length, state.currentIndex) : [];
        return { isShuffled, shuffleOrder };
      }),

      toggleLoop: () => set((state) => {
        const modes: ('off' | 'all' | 'one')[] = ['off', 'all', 'one'];
        const nextMode = modes[(modes.indexOf(state.loopMode) + 1) % modes.length];
        return { loopMode: nextMode };
      }),

      addRecentSong: (track: Track) => set((state) => {
        const filtered = state.recentSongs.filter((t) => t.id !== track.id);
        return { recentSongs: [track, ...filtered].slice(0, 50) };
      }),

      toggleLikedSong: (track: Track) => set((state) => {
        const isLiked = state.likedSongs.some((t) => t.id === track.id);
        if (isLiked) {
          return { likedSongs: state.likedSongs.filter((t) => t.id !== track.id) };
        }
        return { likedSongs: [track, ...state.likedSongs] };
      }),

      createPlaylist: (name: string) => {
        const id = crypto.randomUUID();
        set((state) => ({
          playlists: [...state.playlists, { id, name, tracks: [], createdAt: Date.now() }]
        }));
        return id;
      },


      clonePlaylist: (id: string) => {
        set((state) => {
          const playlistToClone = state.playlists.find(p => p.id === id);
          if (!playlistToClone) return state;
          const newId = crypto.randomUUID();
          const cloned = { ...playlistToClone, id: newId, name: `${playlistToClone.name} (Copy)`, createdAt: Date.now() };
          return { playlists: [...state.playlists, cloned] };
        });
      },

      addTrackToPlaylist: (playlistId: string, track: Track) => set((state) => ({
        playlists: state.playlists.map((p) => 
          p.id === playlistId 
            ? { ...p, tracks: p.tracks.some(t => t.id === track.id) ? p.tracks : [...p.tracks, track] }
            : p
        )
      })),

      removeTrackFromPlaylist: (playlistId: string, trackId: string) => set((state) => ({
        playlists: state.playlists.map((p) => 
          p.id === playlistId 
            ? { ...p, tracks: p.tracks.filter(t => t.id !== trackId) }
            : p
        )
      })),

      deletePlaylist: (playlistId: string) => set((state) => ({
        playlists: state.playlists.filter(p => p.id !== playlistId)
      })),

      _setProgress: (progress: number) => set({ progress }),
      _setDuration: (duration: number) => set({ duration }),
      _setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),
    }),
    {
      name: 'auraweb-audio-storage',
      partialize: (state) => ({ 
        recentSongs: state.recentSongs, 
        likedSongs: state.likedSongs,
        playlists: state.playlists
      }),
    }
  )
);
