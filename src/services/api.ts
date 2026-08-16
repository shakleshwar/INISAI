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
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
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

  async getLyricaLyrics(title: string, artist: string, targetLang?: string) {
    try {
      let url = `/lyrica/lyrics/?song=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}&word=true&timestamps=true`;
      if (targetLang) {
        url += `&translate=true&language=${encodeURIComponent(targetLang)}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Lyrica lyrics fetch failed');
      return await response.json();
    } catch (error) {
      console.error('Lyrica lyrics error:', error);
      return null;
    }
  },

  async getLyricaMetadata(title: string, artist: string) {
    try {
      const url = `/lyrica/lyrics/?song=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}&metadata=true&mood=true`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Lyrica metadata fetch failed');
      return await response.json();
    } catch (error) {
      console.error('Lyrica metadata error:', error);
      return null;
    }
  },

  // --- AllMusic SDK ---
  
  async searchAllMusic(query: string, type: 'artists' | 'albums' | 'songs' = 'artists', limit = '10') {
    try {
      const res = await fetch(`/api/allmusic/search?q=${encodeURIComponent(query)}&type=${type}&limit=${limit}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error('AllMusic search error:', err);
      return null;
    }
  },

  async getAllMusicAlbum(albumId: string) {
    try {
      const res = await fetch(`/api/allmusic/album/${encodeURIComponent(albumId)}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error('AllMusic album error:', err);
      return null;
    }
  },

  async getAllMusicSong(songId: string) {
    try {
      const res = await fetch(`/api/allmusic/song/${encodeURIComponent(songId)}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error('AllMusic song error:', err);
      return null;
    }
  },

  async getAllMusicArtist(artistId: string) {
    try {
      const res = await fetch(`/api/allmusic/artist/${encodeURIComponent(artistId)}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error('AllMusic artist error:', err);
      return null;
    }
  },

  async getAllMusicReleases(limit = '10') {
    try {
      const res = await fetch(`/api/allmusic/releases?limit=${limit}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error('AllMusic releases error:', err);
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
