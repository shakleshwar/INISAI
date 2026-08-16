import axios from 'axios';

const API_KEY = '123';
const BASE_URL = `https://www.theaudiodb.com/api/v1/json/${API_KEY}`;

// Simple in-memory cache to respect the strict 30 req/min rate limit
const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

async function fetchWithCache(url: string) {
  const now = Date.now();
  const cached = cache.get(url);
  
  if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    console.log(`[AudioDB] Cache HIT for ${url}`);
    return cached.data;
  }
  
  console.log(`[AudioDB] Cache MISS for ${url} - Fetching...`);
  try {
    const response = await axios.get(url);
    const data = response.data;
    
    // AudioDB sometimes returns null when not found, cache that too to prevent spamming
    cache.set(url, { data, timestamp: now });
    return data;
  } catch (error) {
    console.error(`[AudioDB] Error fetching ${url}:`, error);
    throw error;
  }
}

export const audioDBService = {
  async searchArtist(name: string) {
    // /search.php?s=coldplay
    const url = `${BASE_URL}/search.php?s=${encodeURIComponent(name)}`;
    const data = await fetchWithCache(url);
    return data.artists ? data.artists[0] : null;
  },
  
  async searchTrack(artistName: string, trackName: string) {
    // /searchtrack.php?s=coldplay&t=yellow
    const url = `${BASE_URL}/searchtrack.php?s=${encodeURIComponent(artistName)}&t=${encodeURIComponent(trackName)}`;
    const data = await fetchWithCache(url);
    return data.track ? data.track[0] : null;
  },

  async searchAlbum(artistName: string, albumName: string) {
    const url = `${BASE_URL}/searchalbum.php?s=${encodeURIComponent(artistName)}&a=${encodeURIComponent(albumName)}`;
    const data = await fetchWithCache(url);
    return data.album ? data.album[0] : null;
  },

  async searchDiscography(artistName: string) {
    const url = `${BASE_URL}/discography.php?s=${encodeURIComponent(artistName)}`;
    const data = await fetchWithCache(url);
    return data.album || [];
  }
};
