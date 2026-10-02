import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import play from 'play-dl';
import * as cheerio from 'cheerio';
import ytDlp from 'yt-dlp-exec';
import https from 'https';
// @ts-ignore
import albumArt from 'album-art';
import dotenv from 'dotenv';
import YTMusic from 'ytmusic-api';
import { audioDBService } from './audiodb';

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '3001', 10);

// --- CORS Configuration ---
const customOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : [];

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://inisai.vercel.app',
  ...customOrigins,
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    const isAllowed =
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.startsWith('http://localhost:');

    if (isAllowed) {
      callback(null, true);
    } else {
      // Allow other web clients gracefully to prevent breaking production
      callback(null, true);
    }
  },
  credentials: true,
}));

// --- Rate Limiters ---
const streamLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // 60 stream requests per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many stream requests, please try again later.',
});

const downloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 downloads per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many download requests, please try again later.',
});

// --- Video ID Validation ---
const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{6,20}$/;
function isValidVideoId(id: string): boolean {
  return VIDEO_ID_REGEX.test(id);
}

const ytmusic = new YTMusic();
ytmusic.initialize().catch(console.error);

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Search Route
app.get('/api/search', async (req, res) => {
  const query = req.query.q as string;

  if (!query) {
    return res.status(400).send('Missing query parameter');
  }

  try {
    const results = await play.search(query, { limit: 20, source: { youtube: 'video' } });
    const validTracks = results.map((song: any) => ({
      id: song.id,
      videoId: song.id,
      title: song.title || query,
      artist: song.channel?.name || 'Unknown Artist',
      duration: song.durationInSec || 0,
      coverArtUrl: song.thumbnails?.length ? song.thumbnails[song.thumbnails.length - 1].url : '',
      source: 'online'
    }));

    res.json(validTracks);
  } catch (error) {
    console.error('Search error with play-dl, falling back to ytmusic-api:', error);
    try {
      const ytResults = await ytmusic.searchSongs(query);
      const validTracks = ytResults.map((song: any) => ({
        id: song.videoId,
        videoId: song.videoId,
        title: song.name || query,
        artist: song.artist?.name || 'Unknown Artist',
        duration: song.duration || 0,
        coverArtUrl: song.thumbnails?.length ? song.thumbnails[song.thumbnails.length - 1].url : '',
        source: 'online'
      }));
      res.json(validTracks);
    } catch (fallbackError) {
      console.error('Fallback search error:', fallbackError);
      res.status(500).send('Failed to fetch search results');
    }
  }
});

// Suggestion Route
app.get('/api/suggest', async (req, res) => {
  const query = req.query.q as string;
  if (!query) {
    return res.json([]);
  }
  try {
    const response = await fetch(`https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`);
    if (response.ok) {
      const data = await response.json();
      const suggestions = Array.isArray(data[1]) ? data[1] : [];
      return res.json(suggestions);
    }
    res.json([]);
  } catch (error) {
    console.error('Suggest error:', error);
    res.json([]);
  }
});

// Related Tracks Route
app.get('/api/related', async (req, res) => {
  const id = req.query.id as string;
  if (!id) return res.json([]);
  
  try {
    res.json([]);
  } catch (err) {
    console.error('Related error:', err);
    res.json([]);
  }
});

app.get('/api/trending', async (req, res) => {
  try {
    const region = (req.query.region as string) || 'Global';
    
    // Determine Kworb URL based on region
    let url = 'https://kworb.net/ww/';
    if (region !== 'Global') {
      const code = region.toLowerCase();
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
      if (i >= 15) return; // Limit to Top 15 for fast response
      const text = $(el).find('td.mp.text div').text() || $(el).find('td.mp.text').text();
      const parts = text.split(' - ');
      if (parts.length >= 2) {
        const artist = parts[0].trim();
        const title = parts.slice(1).join(' - ').trim();
        kworbTracks.push({ title, artist });
      } else if (text) {
        kworbTracks.push({ title: text, artist: 'Unknown' });
      }
    });

    // Resolve YouTube Video IDs for these tracks in parallel using play-dl
    const trendingTracks: any[] = [];
    
    await Promise.all(kworbTracks.map(async (track, index) => {
      try {
        const results = await play.search(`${track.artist} ${track.title}`, { limit: 1, source: { youtube: 'video' } });
        if (results && results.length > 0) {
          const song = results[0];
          trendingTracks[index] = {
            id: song.id,
            videoId: song.id,
            title: track.title || song.title,
            artist: track.artist || song.channel?.name || 'Unknown',
            duration: song.durationInSec || 0,
            coverArtUrl: song.thumbnails?.length ? song.thumbnails[song.thumbnails.length - 1].url : '',
            source: 'online'
          };
        }
      } catch (err) {
        console.error(`Failed to resolve ${track.title}:`, err);
      }
    }));

    const validTracks = trendingTracks.filter(t => t !== undefined);
    const uniqueTracks = Array.from(new Map(validTracks.map(t => [t.videoId, t])).values());
    res.json(uniqueTracks);
  } catch (error: any) {
    console.error('Trending error:', error);
    res.status(500).send('Failed to fetch trending: ' + error.message);
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
app.get('/api/stream/:id', streamLimiter, async (req, res) => {
  const videoId = req.params.id as string;
  const engine = req.query.engine as string;
  const title = req.query.title as string;
  const artist = req.query.artist as string;
  
  if (!videoId || !isValidVideoId(videoId)) {
    return res.status(400).send('Invalid or missing video ID');
  }

  try {
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36';
    let streamUrl = '';

    // Cache key incorporates the engine
    const cacheKey = `${videoId}-${engine || 'youtube'}`;
    const cached = streamUrlCache.get(cacheKey);
    
    if (cached && cached.expiresAt > Date.now()) {
      streamUrl = cached.url;
    } else {
      let ytDlpQuery = videoId;
      
      // If engine is soundcloud, we use yt-dlp's built in scsearch
      if (engine === 'soundcloud' && title && artist) {
        ytDlpQuery = `scsearch1:${artist} ${title}`;
        console.log('Streaming via SoundCloud:', ytDlpQuery);
      }

            let info = await ytDlp(ytDlpQuery, {
        dumpJson: true,
        format: 'm4a/bestaudio/best',
        noCheckCertificate: true,
        noWarnings: true,
        preferFreeFormats: true,
        addHeader: [
          'referer:youtube.com',
          `user-agent:${userAgent}`
        ] as any
      }) as any;
      
      // Auto-fallback: if SoundCloud returns a 30-sec preview (duration <= 35), switch to YouTube
      if (engine === 'soundcloud' && info.duration && info.duration <= 35) {
        console.log('SoundCloud returned a preview. Falling back to YouTube automatically.');
        info = await ytDlp(videoId, {
          dumpJson: true,
          format: 'm4a/bestaudio/best',
          noCheckCertificate: true,
          noWarnings: true,
          preferFreeFormats: true,
          addHeader: [
            'referer:youtube.com',
            `user-agent:${userAgent}`
          ] as any
        }) as any;
      }


      streamUrl = (engine === 'soundcloud' && info.formats) ? (info.formats.find((f: any) => f.url && !f.url.includes('m3u8'))?.url || info.url) : info.url;
      if (!streamUrl) {
        return res.status(404).send('Stream URL not found');
      }
      
      // Cache the URL for 2 hours
      streamUrlCache.set(cacheKey, {
        url: streamUrl,
        expiresAt: Date.now() + 2 * 60 * 60 * 1000
      });
    }

    const clientReqHeaders: Record<string, string> = {
      'User-Agent': userAgent,
      'Accept': '*/*',
      'Range': req.headers.range || 'bytes=0-',
    };

    https.get(streamUrl, { headers: clientReqHeaders }, (streamRes) => {
      res.status(streamRes.statusCode || 200);
      
      const headersToForward = [
        'content-type',
        'content-length',
        'accept-ranges',
        'content-range'
      ];
      
      headersToForward.forEach(header => {
        if (streamRes.headers[header]) {
          res.setHeader(header, streamRes.headers[header] as string);
        }
      });

      streamRes.pipe(res);
    }).on('error', (err) => {
      console.error('HTTPS Proxy error:', err);
      if (!res.headersSent) res.status(500).send('Proxy error');
    });

  } catch (error) {
    console.error('Streaming error:', error);
    if (!res.headersSent) res.status(500).send('Failed to fetch stream');
  }
});


app.get('/api/download/:id', downloadLimiter, async (req, res) => {
  const videoId = req.params.id as string;
  const title = (req.query.title as string) || 'download';
  
  if (!videoId || !isValidVideoId(videoId)) {
    return res.status(400).send('Invalid or missing video ID');
  }

  try {
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36';
    let streamUrl = '';

    const cached = streamUrlCache.get(videoId);
    if (cached && cached.expiresAt > Date.now()) {
      streamUrl = cached.url;
    } else {
      const info = await ytDlp(videoId, {
        dumpJson: true,
        format: 'm4a/bestaudio/best',
        noCheckCertificate: true,
        noWarnings: true,
        preferFreeFormats: true,
        addHeader: [
          'referer:youtube.com',
          `user-agent:${userAgent}`
        ] as any
      }) as any;

      streamUrl = info.url;
      if (!streamUrl) return res.status(404).send('Stream URL not found');
      streamUrlCache.set(videoId, { url: streamUrl, expiresAt: Date.now() + 2 * 60 * 60 * 1000 });
    }

    const clientReqHeaders: Record<string, string> = { 'User-Agent': userAgent };

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(title)}.m4a"`);
    res.setHeader('Content-Type', 'audio/mp4');

    https.get(streamUrl, { headers: clientReqHeaders }, (streamRes) => {
      if (streamRes.statusCode === 302 && streamRes.headers.location) {
        https.get(streamRes.headers.location, { headers: clientReqHeaders }, (redirectRes) => {
          redirectRes.pipe(res);
        }).on('error', (err) => {
          console.error('Download redirect error:', err);
          if (!res.headersSent) res.status(500).send('Redirect error');
        });
        return;
      }
      streamRes.pipe(res);
    }).on('error', (err) => {
      console.error('Download proxy error:', err);
      if (!res.headersSent) res.status(500).send('Proxy error');
    });
  } catch (error) {
    console.error('Download extraction error:', error);
    if (!res.headersSent) res.status(500).send('Failed to extract download URL');
  }
});


// --- AllMusic Routes ---

// --- iTunes API (Free Alternative for New Releases) ---

app.get('/api/releases', async (req, res) => {
  try {
    const limit = req.query.limit || '10';
    const response = await fetch(`https://itunes.apple.com/us/rss/topalbums/limit=${limit}/json`);
    
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch releases' });
    }
    
    const data = await response.json();
    const entries = data.feed.entry || [];
    
    const formattedReleases = entries.map((entry: any) => {
      // Get the highest resolution image available in the array and try to upscale it
      const images = entry['im:image'];
      let coverUrl = images && images.length > 0 ? images[images.length - 1].label : '';
      
      // Upscale Apple Music artwork URL
      if (coverUrl.includes('170x170bb')) {
        coverUrl = coverUrl.replace('170x170bb', '600x600bb');
      }
      
      return {
        id: entry.id.attributes['im:id'],
        title: entry['im:name'].label,
        artist: entry['im:artist'].label,
        cover_url: coverUrl,
        rating: entry.category?.attributes?.label // Use genre as a "rating/category" tag
      };
    });
    
    res.json(formattedReleases);
  } catch (error) {
    console.error('iTunes API error:', error);
    res.status(500).json({ error: 'Failed to fetch releases' });
  }
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
