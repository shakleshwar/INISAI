import express from 'express';
import cors from 'cors';
import YTMusic from 'ytmusic-api';
import ytDlp from 'yt-dlp-exec';
import https from 'https';
// @ts-ignore
import albumArt from 'album-art';
import dotenv from 'dotenv';
import { allMusicService } from './allmusic';
import { audioDBService } from './audiodb';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

const ytmusic = new YTMusic();

// Initialize YTMusic API
ytmusic.initialize().then(() => {
  console.log('YTMusic API Initialized');
}).catch(err => {
  console.error('Failed to initialize YTMusic API:', err);
});

// Search Route — Chosic API + YouTube Music resolution
const CHOSIC_API_BASE = 'https://api.parse.bot/scraper/2d0c0106-75f6-4f45-918d-1633cfa4cf74';

// In-memory cache for chosic search results to avoid redundant API calls
const chosicSearchCache = new Map<string, { data: any[], expiresAt: number }>();

app.get('/api/search', async (req, res) => {
  const query = req.query.q as string;
  if (!query) {
    return res.status(400).send('Missing query parameter');
  }

  try {
    // 1. First, fetch from Chosic for rich metadata (Spotify album art, etc.)
    let chosicResults: any[] = [];
    const cacheKey = query.toLowerCase().trim();
    const cached = chosicSearchCache.get(cacheKey);
    
    if (cached && cached.expiresAt > Date.now()) {
      chosicResults = cached.data;
    } else {
      try {
        const chosicUrl = `${CHOSIC_API_BASE}/search_songs?query=${encodeURIComponent(query)}&limit=20`;
        const chosicRes = await fetch(chosicUrl);
        if (chosicRes.ok) {
          const chosicData = await chosicRes.json();
          chosicResults = Array.isArray(chosicData) ? chosicData : (chosicData?.results || chosicData?.data || []);
          // Cache for 30 minutes
          chosicSearchCache.set(cacheKey, { data: chosicResults, expiresAt: Date.now() + 30 * 60 * 1000 });
        }
      } catch (chosicErr) {
        console.error('Chosic API error (falling back to ytmusic):', chosicErr);
      }
    }

    // 2. If Chosic returned results, resolve YouTube videoIds for playback
    if (chosicResults.length > 0) {
      const tracks: any[] = [];
      
      await Promise.all(chosicResults.map(async (item: any, index: number) => {
        const songTitle = item.title || item.name || '';
        const artistName = item.artist || item.artist_name || '';
        const coverArt = item.thumbnail || item.image || item.cover || '';
        const spotifyId = item.spotify_id || item.id || '';
        
        try {
          // Resolve to a YouTube video ID for playback
          const ytResults = await ytmusic.searchSongs(`${artistName} ${songTitle}`);
          if (ytResults && ytResults.length > 0) {
            const song = ytResults[0];
            tracks[index] = {
              id: song.videoId,
              videoId: song.videoId,
              spotifyId,
              title: songTitle || song.name,
              artist: artistName || song.artist.name,
              duration: song.duration,
              coverArtUrl: coverArt || song.thumbnails?.[1]?.url || song.thumbnails?.[0]?.url || '',
              source: 'online'
            };
          }
        } catch (err) {
          console.error(`Failed to resolve "${songTitle}" on YouTube:`, err);
        }
      }));

      const validTracks = tracks.filter(t => t !== undefined);
      return res.json(validTracks);
    }

    // 3. Fallback: direct YouTube Music search if Chosic failed
    const results = await ytmusic.searchSongs(query);
    const tracks = results.map(song => ({
      id: song.videoId,
      videoId: song.videoId,
      title: song.name,
      artist: song.artist.name,
      duration: song.duration,
      coverArtUrl: song.thumbnails?.[1]?.url || song.thumbnails?.[0]?.url || '',
      source: 'online'
    }));
    
    res.json(tracks);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).send('Search failed');
  }
});

// Search Suggestions Route
app.get('/api/suggest', async (req, res) => {
  const query = req.query.q as string;
  if (!query) {
    return res.json([]);
  }

  try {
    const suggestions = await ytmusic.getSearchSuggestions(query);
    res.json(suggestions);
  } catch (error) {
    console.error('Suggest error:', error);
    res.json([]);
  }
});

// Related/Up Next Tracks Route
app.get('/api/related', async (req, res) => {
  const videoId = req.query.id as string;
  if (!videoId) {
    return res.status(400).send('Missing video ID');
  }

  try {
    const related = await ytmusic.getSongRelated(videoId);
    
    // Map them to match our Track format
    const tracks = related.map(song => ({
      id: song.videoId,
      videoId: song.videoId,
      title: song.name,
      artist: song.artist.name,
      duration: song.duration,
      coverArtUrl: song.thumbnails?.[1]?.url || song.thumbnails?.[0]?.url || '',
      source: 'online'
    }));
    
    res.json(tracks);
  } catch (error) {
    console.error('Related tracks error:', error);
    res.json([]);
  }
});

// Trending Route
import * as cheerio from 'cheerio';

app.get('/api/trending', async (req, res) => {
  try {
    const region = (req.query.region as string) || 'Global';
    
    // Determine Kworb URL based on region
    let url = 'https://kworb.net/ww/';
    if (region !== 'Global') {
      const code = region.toLowerCase();
      // map 'uk' to 'gb' as kworb uses 'gb' for UK
      const kworbCode = code === 'uk' ? 'gb' : code;
      url = `https://kworb.net/charts/itunes/${kworbCode}.html`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch from Kworb: ${response.statusText}`);
    }
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const kworbTracks: { title: string, artist: string }[] = [];
    
    $('table tbody tr').each((i, el) => {
      if (i >= 20) return; // Limit to Top 20 to avoid rate limiting YT Music searches
      // text is inside td.mp.text
      const text = $(el).find('td.mp.text div').text() || $(el).find('td.mp.text').text();
      // Text is usually "Artist - Title" or "Artist & Artist - Title"
      const parts = text.split(' - ');
      if (parts.length >= 2) {
        const artist = parts[0].trim();
        const title = parts.slice(1).join(' - ').trim();
        kworbTracks.push({ title, artist });
      } else if (text) {
        kworbTracks.push({ title: text, artist: 'Unknown' });
      }
    });

    // 2. Resolve YouTube Video IDs for these tracks in parallel
    const trendingTracks: any[] = [];
    
    await Promise.all(kworbTracks.map(async (track, index) => {
      try {
        const searchResults = await ytmusic.searchSongs(`${track.artist} ${track.title}`);
        if (searchResults && searchResults.length > 0) {
          const song = searchResults[0];
          trendingTracks[index] = {
            id: song.videoId,
            videoId: song.videoId,
            title: track.title, // keep the original title from Kworb if preferred, or song.name
            artist: track.artist,
            duration: song.duration,
            coverArtUrl: song.thumbnails?.[1]?.url || song.thumbnails?.[0]?.url || '',
            source: 'online'
          };
        }
      } catch (err) {
        console.error(`Failed to resolve ${track.title}:`, err);
      }
    }));

    // Filter out any undefined elements (failed searches)
    const validTracks = trendingTracks.filter(t => t !== undefined);
    
    // Remove duplicates based on videoId
    const uniqueTracks = Array.from(new Map(validTracks.map(t => [t.videoId, t])).values());
    res.json(uniqueTracks);
  } catch (error) {
    console.error('Trending error:', error);
    res.status(500).send('Failed to fetch trending');
  }
});

// Art Route - Uses album-art to fetch high quality cover art
const artCache = new Map<string, { url: string, expiresAt: number }>();

app.get('/api/art', async (req, res) => {
  const artist = req.query.artist as string;
  const album = req.query.album as string;
  
  if (!artist && !album) {
    return res.status(400).send('Missing artist or album parameter');
  }

  // Create a unique cache key
  const cacheKey = `${artist || ''}|${album || ''}`.toLowerCase().trim();
  const cached = artCache.get(cacheKey);
  
  if (cached && cached.expiresAt > Date.now()) {
    return res.json({ url: cached.url });
  }
  
  try {
    let url;
    if (album) {
      url = await albumArt(artist || '', { album });
    } else {
      url = await albumArt(artist);
    }
    
    if (url) {
      // Cache for 24 hours
      artCache.set(cacheKey, { url, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
      res.json({ url });
    } else {
      res.status(404).json({ error: 'Art not found' });
    }
  } catch (err: any) {
    console.error(`Error fetching art for ${cacheKey}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// In-memory cache for stream URLs to prevent calling yt-dlp on every Range request
const streamUrlCache = new Map<string, { url: string, expiresAt: number }>();

// Stream Route
app.get('/api/stream/:id', async (req, res) => {
  const videoId = req.params.id;
  
  if (!videoId) {
    return res.status(400).send('Missing video ID');
  }

  try {
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36';
    let streamUrl = '';

    // Check cache first (valid for 2 hours)
    const cached = streamUrlCache.get(videoId);
    if (cached && cached.expiresAt > Date.now()) {
      streamUrl = cached.url;
    } else {
      const info = await ytDlp(videoId, {
        dumpJson: true,
        format: 'm4a/bestaudio/best',
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        addHeader: [
          'referer:youtube.com',
          `user-agent:${userAgent}`
        ]
      }) as any;

      streamUrl = info.url;
      if (!streamUrl) {
        return res.status(404).send('Stream URL not found');
      }
      
      // Cache the URL for 2 hours (YouTube links usually expire after 6 hours)
      streamUrlCache.set(videoId, {
        url: streamUrl,
        expiresAt: Date.now() + 2 * 60 * 60 * 1000
      });
    }

    const clientReqHeaders: Record<string, string> = {
      'User-Agent': userAgent,
    };

    if (req.headers.range) {
      clientReqHeaders['Range'] = req.headers.range as string;
    }

    https.get(streamUrl, { headers: clientReqHeaders }, (streamRes) => {
      console.log(`[Stream] YouTube responded with ${streamRes.statusCode} for ${videoId} (Range: ${clientReqHeaders['Range'] || 'none'})`);

      if (streamRes.statusCode === 302 && streamRes.headers.location) {
        https.get(streamRes.headers.location, { headers: clientReqHeaders }, (redirectRes) => {
          res.status(redirectRes.statusCode || 200);
          pipeHeaders(redirectRes, res);
          redirectRes.pipe(res);
        }).on('error', (err) => {
          console.error('Redirect proxy error:', err);
          if (!res.headersSent) res.status(500).send('Stream proxy failed');
        });
        return;
      }

      res.status(streamRes.statusCode || 200);
      pipeHeaders(streamRes, res);
      streamRes.pipe(res);
    }).on('error', (err) => {
      console.error('Stream proxy error:', err);
      if (!res.headersSent) res.status(500).send('Stream proxy failed');
    });

  } catch (error) {
    console.error('Extraction error:', error);
    if (!res.headersSent) res.status(500).send('Failed to extract stream URL');
  }
});

function pipeHeaders(sourceRes: import('http').IncomingMessage, targetRes: express.Response) {
  const headersToForward = [
    'content-type',
    'content-length',
    'accept-ranges',
    'content-range'
  ];

  headersToForward.forEach(header => {
    if (sourceRes.headers[header]) {
      targetRes.setHeader(header, sourceRes.headers[header] as string);
    }
  });
}

// --- AllMusic Routes ---

app.get('/api/allmusic/search', async (req, res) => {
  const query = req.query.q as string;
  const type = (req.query.type as 'artists' | 'albums' | 'songs') || 'artists';
  const limit = (req.query.limit as string) || '10';
  
  if (!query) return res.status(400).send('Missing query parameter');
  
  const results = await allMusicService.search(query, type, limit);
  if (results) res.json(results);
  else res.status(500).send('AllMusic API failed');
});

app.get('/api/allmusic/album/:id', async (req, res) => {
  const results = await allMusicService.getAlbum(req.params.id);
  if (results) res.json(results);
  else res.status(500).send('AllMusic API failed');
});

app.get('/api/allmusic/artist/:id', async (req, res) => {
  const results = await allMusicService.getArtist(req.params.id);
  if (results) res.json(results);
  else res.status(500).send('AllMusic API failed');
});

app.get('/api/allmusic/song/:id', async (req, res) => {
  const results = await allMusicService.getSong(req.params.id);
  if (results) res.json(results);
  else res.status(500).send('AllMusic API failed');
});

app.get('/api/allmusic/releases', async (req, res) => {
  const limit = (req.query.limit as string) || '10';
  const results = await allMusicService.getReleases(limit);
  if (results) res.json(results);
  else res.status(500).send('AllMusic API failed');
});

// AudioDB Endpoints
app.get('/api/audiodb/artist', async (req, res) => {
  try {
    const { name } = req.query;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Missing artist name query parameter' });
    }
    const data = await audioDBService.searchArtist(name);
    res.json(data || {});
  } catch (error) {
    console.error('AudioDB API error:', error);
    res.status(500).json({ error: 'Failed to fetch from AudioDB API' });
  }
});

app.get('/api/audiodb/track', async (req, res) => {
  try {
    const { artist, track } = req.query;
    if (!artist || !track || typeof artist !== 'string' || typeof track !== 'string') {
      return res.status(400).json({ error: 'Missing artist or track query parameters' });
    }
    const data = await audioDBService.searchTrack(artist, track);
    res.json(data || {});
  } catch (error) {
    console.error('AudioDB API error:', error);
    res.status(500).json({ error: 'Failed to fetch from AudioDB API' });
  }
});

app.get('/api/audiodb/album', async (req, res) => {
  try {
    const { artist, album } = req.query;
    if (!artist || !album || typeof artist !== 'string' || typeof album !== 'string') {
      return res.status(400).json({ error: 'Missing artist or album query parameters' });
    }
    const data = await audioDBService.searchAlbum(artist, album);
    res.json(data || {});
  } catch (error) {
    console.error('AudioDB API error:', error);
    res.status(500).json({ error: 'Failed to fetch from AudioDB API' });
  }
});

app.get('/api/audiodb/discography', async (req, res) => {
  try {
    const { artist } = req.query;
    if (!artist || typeof artist !== 'string') {
      return res.status(400).json({ error: 'Missing artist query parameter' });
    }
    const data = await audioDBService.searchDiscography(artist);
    res.json(data || []);
  } catch (error) {
    console.error('AudioDB API error:', error);
    res.status(500).json({ error: 'Failed to fetch from AudioDB API' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Backend API running on http://localhost:${port}`);
});
