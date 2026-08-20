import localforage from 'localforage';
import type { Track } from '../types';

// Store raw File/Blob objects
const audioStore = localforage.createInstance({
  name: 'AuraWebPlayer',
  storeName: 'audio_files'
});

// Store track metadata
const metadataStore = localforage.createInstance({
  name: 'AuraWebPlayer',
  storeName: 'track_metadata'
});

export const db = {
  async saveTrack(file: File, metadata: Omit<Track, 'audioSrc' | 'isLocal' | 'file' | 'source'>): Promise<Track> {
    const id = metadata.id;
    await audioStore.setItem(id, file);
    
    const track: Track = {
      ...metadata,
      audioSrc: URL.createObjectURL(file), // Create temporary URL for immediate use
      isLocal: true,
      source: 'local'
    };
    
    // Don't store audioSrc in DB since it's a temporary Blob URL
    const { audioSrc, ...metaToStore } = track;
    await metadataStore.setItem(id, metaToStore);
    
    return track;
  },

  async loadAllLocalTracks(): Promise<Track[]> {
    const tracks: Track[] = [];
    
    await metadataStore.iterate((meta: Omit<Track, 'audioSrc'>) => {
      // Need to cast correctly
      tracks.push(meta as unknown as Track);
    });

    // Reconstruct Object URLs for all local files
    for (const track of tracks) {
      if (track.isLocal) {
        const file: File | null = await audioStore.getItem(track.id);
        if (file) {
          track.audioSrc = URL.createObjectURL(file);
        }
      }
    }
    
    return tracks;
  },
  
  async clearLocalTracks() {
    await audioStore.clear();
    await metadataStore.clear();
  },
  
  async removeLocalTrack(id: string) {
    await audioStore.removeItem(id);
    await metadataStore.removeItem(id);
  }
};
