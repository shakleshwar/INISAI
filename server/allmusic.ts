import 'dotenv/config';

const BASE_URL = 'https://api.parse.bot/scraper/d7a9ab92-2f81-4e05-9fcf-ab472eae476c';
const API_KEY = process.env.PARSE_API_KEY || 'YOUR_API_KEY';

async function fetchFromAPI(endpoint: string, params: Record<string, string>) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (!res.ok) {
      console.error(`AllMusic API Error: ${res.status} ${res.statusText}`);
      return null;
    }
    
    return await res.json();
  } catch (err) {
    console.error('AllMusic fetch error:', err);
    return null;
  }
}

export const allMusicService = {
  search: async (query: string, searchType: 'artists' | 'albums' | 'songs' = 'artists', limit = '10') => {
    return fetchFromAPI('/search_results', { query, search_type: searchType, limit });
  },
  
  getAlbum: async (albumId: string) => {
    return fetchFromAPI('/get_album_details', { album_id: albumId });
  },
  
  getArtist: async (artistId: string) => {
    return fetchFromAPI('/get_artist_details', { artist_id: artistId });
  },
  
  getSong: async (songId: string) => {
    return fetchFromAPI('/get_song_details', { song_id: songId });
  },
  
  getReleases: async (limit = '10') => {
    return fetchFromAPI('/get_new_releases', { limit });
  }
};
