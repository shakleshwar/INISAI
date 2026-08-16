export interface Track {
  id: string;
  videoId?: string;
  title: string;
  artist: string;
  coverArtUrl?: string;
  audioSrc?: string; // Optional since online tracks will derive it from videoId
  duration?: number;
  source: 'local' | 'online';
  isLocal?: boolean; // Legacy property, kept for compatibility with existing DB if needed
}

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
  createdAt: number;
}
