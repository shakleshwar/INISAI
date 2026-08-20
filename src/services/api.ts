import type { Track } from '../types';

export interface AudioDBArtist {
  idArtist: string;
  strArtist: string;
  strBiographyEN: string;
  intFormedYear: string;
  intMembers: string;
  strStyle: string;
  strGenre: string;
  strWebsite: string;
  strFacebook: string;
  strTwitter: string;
  strArtistThumb: string;
  strArtistLogo: string;
}

export interface AudioDBTrack {
  idTrack: string;
  strTrack: string;
  idAlbum: string;
  strAlbum: string;
  idArtist: string;
  strArtist: string;
  intDuration: string;
  strGenre: string;
  strDescriptionEN: string;
  strTrackThumb: string;
  strMusicVid: string;
}

export const api = {
  async searchOnlineTracks(query: string): Promise<Track[]> {
    const engine = localStorage.getItem('streamingService') || 'youtube';
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&engine=${engine}`);
    if (!res.ok) {
      throw new Error('Failed to fetch search results');
    }
    return res.json();
  },

  async getSuggestions(query: string): Promise<string[]> {
    const res = await fetch(`/api/suggest?q=${encodeURIComponent(query)}`);
    if (!res.ok) {
      return [];
    }
    return res.json();
  },

  async getRelatedTracks(videoId: string): Promise<Track[]> {
    const res = await fetch(`/api/related?id=${encodeURIComponent(videoId)}`);
    if (!res.ok) {
      return [];
    }
    return res.json();
  },

  async getTrending(region?: string): Promise<Track[]> {
    const url = region ? `/api/trending?region=${encodeURIComponent(region)}` : '/api/trending';
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error('Failed to fetch trending charts');
    }
    return res.json();
  },

  getArt: async (artist: string, album?: string) => {
    try {
      const params = new URLSearchParams({ artist });
      if (album) params.append('album', album);
      const res = await fetch(`/api/art?${params}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.url;
    } catch (err) {
      console.error('getArt Error:', err);
      return null;
    }
  },

  getOnlineStreamUrl(videoId: string): string {
    return `/api/stream/${videoId}`;
  },

  async getLyricaLyrics(title: string, artist: string) {
    try {
      // Use LRCLib to fetch lyrics directly, bypassing the Lyrica Python backend
      const url = `https://lrclib.net/api/search?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('LRCLib fetch failed');
      const data = await response.json();
      
      if (data && data.length > 0) {
        // Return the first match which is usually the best one
        return { status: 'success', data: data[0] };
      }
      return { status: 'error', message: 'No lyrics found' };
    } catch (error) {
      console.error('LRCLib lyrics error:', error);
      return null;
    }
  },

  async getLyricaMetadata() {
    // LRCLib doesn't provide mood/metadata like Lyrica did, so we safely return null
    return null;
  },

  // --- iTunes API (Free Alternative for New Releases) ---
  
  async getNewReleases(limit = '10') {
    try {
      const res = await fetch(`/api/releases?limit=${limit}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error('iTunes releases error:', err);
      return null;
    }
  },

  getAudioDBArtist: async (name: string): Promise<AudioDBArtist | null> => {
    try {
      const response = await fetch(`/api/audiodb/artist?name=${encodeURIComponent(name)}`);
      if (!response.ok) return null;
      const data = await response.json();
      return Object.keys(data).length === 0 ? null : data;
    } catch (error) {
      console.error('API getAudioDBArtist Error:', error);
      return null;
    }
  },

  getAudioDBTrack: async (artist: string, track: string): Promise<AudioDBTrack | null> => {
    try {
      const response = await fetch(`/api/audiodb/track?artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}`);
      if (!response.ok) return null;
      const data = await response.json();
      return Object.keys(data).length === 0 ? null : data;
    } catch (error) {
      console.error('API getAudioDBTrack Error:', error);
      return null;
    }
  },

  getAudioDBAlbum: async (artist: string, album: string) => {
    try {
      const response = await fetch(`/api/audiodb/album?artist=${encodeURIComponent(artist)}&album=${encodeURIComponent(album)}`);
      if (!response.ok) return null;
      const data = await response.json();
      return Object.keys(data).length === 0 ? null : data;
    } catch (error) {
      console.error('API getAudioDBAlbum Error:', error);
      return null;
    }
  },

  getAudioDBDiscography: async (artist: string) => {
    try {
      const response = await fetch(`/api/audiodb/discography?artist=${encodeURIComponent(artist)}`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('API getAudioDBDiscography Error:', error);
      return [];
    }
  }
};
