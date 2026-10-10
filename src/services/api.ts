import type { Track } from '../types';

/**
 * Base URL for all backend API calls.
 * In local dev this is empty (Vite proxy handles it).
 * In production, set VITE_API_URL to your backend URL (e.g. https://inisai-1-5.onrender.com).
 */
export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export interface AudioDBArtist {
  idArtist: string;
  strArtist: string;
  strBiography?: string;
  strBiographyEN?: string;
  intFormedYear: string;
  intMembers: string;
  strStyle: string;
  strGenre: string;
  strWebsite: string;
  strFacebook: string;
  strTwitter: string;
  strArtistThumb: string;
  strArtistLogo: string;
  strArtistBanner?: string;
  strArtistFanart?: string;
  strArtistWideThumb?: string;
  intFollowers?: string;
  strCountry?: string;
  strLabel?: string;
  strMood?: string;
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

const trendingPromises = new Map<string, Promise<Track[]>>();

export const api = {
  async searchOnlineTracks(query: string): Promise<Track[]> {
    const engine = localStorage.getItem('streamingService') || 'youtube';
    const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(query)}&engine=${engine}`);
    if (!res.ok) {
      throw new Error('Failed to fetch search results');
    }
    return res.json();
  },

  async getSuggestions(query: string): Promise<string[]> {
    const res = await fetch(`${API_BASE}/api/suggest?q=${encodeURIComponent(query)}`);
    if (!res.ok) {
      return [];
    }
    return res.json();
  },

  async getRelatedTracks(videoId: string): Promise<Track[]> {
    const res = await fetch(`${API_BASE}/api/related?id=${encodeURIComponent(videoId)}`);
    if (!res.ok) {
      return [];
    }
    return res.json();
  },

  async getTrending(region?: string): Promise<Track[]> {
    const key = region || 'Global';
    const cached = trendingPromises.get(key);
    if (cached) {
      return cached;
    }
    const url = region ? `${API_BASE}/api/trending?region=${encodeURIComponent(region)}` : `${API_BASE}/api/trending`;
    const promise = (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error('Failed to fetch trending charts');
        }
        return await res.json();
      } finally {
        setTimeout(() => {
          trendingPromises.delete(key);
        }, 8000);
      }
    })();
    trendingPromises.set(key, promise);
    return promise;
  },

  getArt: async (artist: string, album?: string) => {
    try {
      const params = new URLSearchParams({ artist });
      if (album) params.append('album', album);
      const res = await fetch(`${API_BASE}/api/art?${params}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.url;
    } catch (err) {
      console.error('getArt Error:', err);
      return null;
    }
  },

  getOnlineStreamUrl(videoId: string): string {
    return `${API_BASE}/api/stream/${videoId}`;
  },

  async getLyricaLyrics(title: string, artist: string) {
    try {
      // Clean title and artist to improve LRCLib match rate for YouTube tracks
      const cleanText = (text: string) => {
        return text
          .replace(/\s*[([].*?[)\]]\s*/g, ' ') // Remove (Official Video), [Lyric Video], etc.
          .replace(/\s*-?\s*official.*$/i, '') // Remove "- Official Video"
          .replace(/\s*(feat\.|ft\.).*$/i, '') // Remove "feat." and "ft."
          .replace(/\s*\|.*$/g, '') // Remove "|" and everything after
          .trim();
      };
      
      const cleanTitle = cleanText(title);
      const cleanArtist = cleanText(artist);

      // Use LRCLib to fetch lyrics directly, bypassing the Lyrica Python backend
      const url = `https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}`;
      
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
      const res = await fetch(`${API_BASE}/api/releases?limit=${limit}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error('iTunes releases error:', err);
      return null;
    }
  },

  getAudioDBArtist: async (name: string): Promise<AudioDBArtist | null> => {
    try {
      const response = await fetch(`${API_BASE}/api/audiodb/artist?name=${encodeURIComponent(name)}`);
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
      const response = await fetch(`${API_BASE}/api/audiodb/track?artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}`);
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
      const response = await fetch(`${API_BASE}/api/audiodb/album?artist=${encodeURIComponent(artist)}&album=${encodeURIComponent(album)}`);
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
      const response = await fetch(`${API_BASE}/api/audiodb/discography?artist=${encodeURIComponent(artist)}`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('API getAudioDBDiscography Error:', error);
      return [];
    }
  }
};
