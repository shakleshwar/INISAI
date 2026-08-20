import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Music, Heart, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import type { Track } from '../types';
import { useAudioStore } from '../store/useAudioStore';
import { TrackContextMenu } from '../components/ui/TrackContextMenu';
import { Carousel3D } from '../components/ui/Carousel3D';
import { ArtImage } from '../components/ui/ArtImage';

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '3:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}


const HOME_GENRES = [
  { name: 'Pop', gradient: 'from-pink-500 to-rose-600', artist: 'Taylor Swift', album: '1989' },
  { name: 'Hip-Hop', gradient: 'from-purple-600 to-violet-500', artist: 'Kendrick Lamar', album: 'DAMN.' },
  { name: 'Rock', gradient: 'from-red-600 to-orange-500', artist: 'AC/DC', album: 'Back in Black' },
  { name: 'Lo-fi', gradient: 'from-violet-500 to-purple-700', artist: 'J Dilla', album: 'Donuts' },
  { name: 'Anime', gradient: 'from-pink-500 to-purple-500', artist: 'Radwimps', album: 'Your Name' },
  { name: 'Jazz', gradient: 'from-amber-600 to-yellow-500', artist: 'Miles Davis', album: 'Kind of Blue' },
];
export function Home() {
  const navigate = useNavigate();
  const { 
    queue, currentIndex, isPlaying, setQueue, playTrack, togglePlay,
    likedSongs, toggleLikedSong,
    trendingRegion, setTrendingRegion
  } = useAudioStore();

  const cachedTrending = useAudioStore(state => state.cachedTrending);
  const setCachedData = useAudioStore(state => state.setCachedData);

  const [trending, setTrending] = useState<Track[]>(cachedTrending[trendingRegion] || []);
  const [isLoading, setIsLoading] = useState(() => {
    // Only show full page loading if we don't have the main trending data yet
    const hasTrending = cachedTrending[trendingRegion] && cachedTrending[trendingRegion].length > 0;
    return !hasTrending;
  });
  const [isTrendingLoading, setIsTrendingLoading] = useState(false);

  const REGIONS = [
    { id: 'Global', label: 'Global' },
    { id: 'US', label: 'US' },
    { id: 'UK', label: 'UK' },
    { id: 'IN', label: 'India' },
    { id: 'CA', label: 'Canada' },
    { id: 'AU', label: 'Australia' },
    { id: 'JP', label: 'Japan' }
  ];

  useEffect(() => {
    let active = true;

    const fetchAllData = async () => {
      try {
        const store = useAudioStore.getState();
        
        // 1. Fetch Releases if needed
        if (!store.cachedReleases) {
          const releasesData = await api.getNewReleases('10');
          if (releasesData && Array.isArray(releasesData) && active) {
            // Avoid overwriting trending with [] if it's fetching in parallel
            const currentTrending = useAudioStore.getState().cachedTrending[trendingRegion];
            setCachedData(trendingRegion, currentTrending || [], releasesData);
          }
        }

        // 2. Fetch Trending if needed
        const currentTrending = useAudioStore.getState().cachedTrending[trendingRegion];
        if (!currentTrending || currentTrending.length === 0) {
          setIsTrendingLoading(true);
          const trendingData = await api.getTrending(trendingRegion);
          if (active && trendingData) {
            setTrending(trendingData);
            setCachedData(trendingRegion, trendingData, useAudioStore.getState().cachedReleases);
          }
        } else if (active) {
          setTrending(currentTrending);
        }
      } catch (error) {
        console.error("Failed to fetch home data:", error);
      } finally {
        if (active) {
          setIsLoading(false);
          setIsTrendingLoading(false);
        }
      }
    };

    fetchAllData();

    return () => { active = false; };
  }, [trendingRegion, setCachedData]); 

  const handleRegionChange = (regionId: string) => {
    if (regionId === trendingRegion) return;
    setTrendingRegion(regionId);
    if (cachedTrending[regionId]) {
      setTrending(cachedTrending[regionId]);
    } else {
      setIsTrendingLoading(true);
    }
  };

  const handlePlayTrack = (index: number) => {
    const isSameQueue = queue.length === trending.length && queue[0]?.id === trending[0]?.id;
    if (!isSameQueue) {
      setQueue(trending);
    }
    
    if (currentIndex === index && queue[index]?.id === trending[index]?.id) {
      togglePlay();
    } else {
      playTrack(index);
    }
  };

  const isTrackPlaying = (index: number) => {
    return currentIndex === index && queue[index]?.id === trending[index]?.id && isPlaying;
  };

  const rankedTracks = trending.slice(0, 8);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-6 animate-fade-in">
          <div className="flex items-end gap-1 h-12">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="eq-bar w-2 bg-gradient-to-t from-blue-500 to-purple-500 rounded-full h-full" />
            ))}
          </div>
          <p className="text-[11px] uppercase tracking-widest text-zinc-500 font-bold">Tuning in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* ─── 3D Carousel Featured Section ─── */}
      {trending.length > 0 && (
        <section className="pt-8 px-6 md:px-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-black text-white tracking-tight">Featured Trending</h2>
            
            {/* Region Selection Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
              {REGIONS.map((region) => (
                <button
                  key={region.id}
                  onClick={() => handleRegionChange(region.id)}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${
                    trendingRegion === region.id
                      ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-105'
                      : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {region.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className={`transition-opacity duration-500 ${isTrendingLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            <Carousel3D 
              items={trending.slice(0, 10).map(t => ({
                id: t.id,
                title: t.title,
                artist: t.artist,
                coverArtUrl: t.coverArtUrl
            }))}
            onPlay={(item) => {
              const idx = trending.findIndex(t => t.id === item.id);
              if (idx !== -1) handlePlayTrack(idx);
            }}
            onClick={() => {
              // Action when a carousel item is clicked but not via play button
            }}
          />
          </div>
        </section>
      )}

      
        {/* Mobile Horizontal Sections (Albums & Artists) */}
        <div className="md:hidden space-y-8 mt-2 mb-8">
          


          {/* Artists Row */}
          {trending.length > 0 && (
            <section>
              <div className="flex items-center justify-between px-6 mb-4">
                <h2 className="text-xl font-bold text-white tracking-tight">Artists</h2>
                <button onClick={() => navigate('/library')}><ArrowRight size={20} className="text-zinc-400" /></button>
              </div>
              <div className="flex overflow-x-auto hide-scrollbar px-6 gap-5 snap-x pb-4">
                {Array.from(new Set(trending.map(t => t.artist))).filter(Boolean).slice(0, 10).map((artistName, i) => (
                  <div key={i} className="snap-start shrink-0 w-[100px] flex flex-col items-center text-center" onClick={() => navigate('/library')}>
                    <div className="w-[100px] h-[100px] rounded-full overflow-hidden bg-zinc-900 mb-3 shadow-md">
                      <ArtImage artist={artistName as string} album={artistName as string} type="artist" className="w-full h-full object-cover" />
                    </div>
                    <h3 className="text-[13px] text-zinc-300 font-medium truncate w-full">{artistName as string}</h3>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
        

          
          
          
        {/* Desktop Top Artists */}
        <section className="hidden md:block px-6 md:px-10 mt-8 mb-8">
          <h2 className="text-2xl font-black text-white mb-6 tracking-tight flex items-center gap-3">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-blue-500 to-purple-500" />
            Top Artists
          </h2>
          <div className="flex gap-6 overflow-x-auto hide-scrollbar pb-6">
            {Array.from(new Set(trending.map(t => t.artist))).filter(Boolean).slice(0, 10).map((artistName, i) => (
              <div key={i} className="flex flex-col items-center shrink-0 w-[160px] cursor-pointer group" onClick={() => navigate('/library')}>
                <div className="w-[160px] h-[160px] rounded-full overflow-hidden bg-zinc-900 mb-4 shadow-lg relative">
                  <ArtImage artist={artistName as string} album={artistName as string} type="artist" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
                </div>
                <h3 className="text-base text-white font-bold truncate w-full text-center group-hover:text-blue-400 transition-colors">{artistName as string}</h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Artist</p>
              </div>
            ))}
          </div>
        </section>
        
<div className="px-6 md:px-10 space-y-12 pb-32 md:pb-10 -mt-2">




      {/* ─── Bottom Grid: Top Global ─── */}
        <div className="max-w-4xl">

          {/* Top Global — Ranked List */}
          <section className={`transition-opacity duration-500 ${isTrendingLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            <h2 className="text-2xl font-black text-white mb-6 tracking-tight flex items-center gap-3">
              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-blue-500 to-purple-500" />
              Top {REGIONS.find(r => r.id === trendingRegion)?.label || 'Global'}
            </h2>
            <div className="space-y-2">
              {rankedTracks.map((track, index) => {
                const playing = isTrackPlaying(index);
                return (
                  <div 
                    key={track.id + 'rank' + index}
                    onClick={() => handlePlayTrack(index)}
                    className={`group flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 hover:-translate-y-0.5 library-card-appear ${
                      playing 
                        ? 'bg-blue-500/[0.08] border border-blue-500/20 shadow-[0_4px_20px_rgba(59,130,246,0.1)]' 
                        : 'hover:bg-white/[0.04] border border-transparent hover:shadow-lg'
                    }`}
                    style={{ animationDelay: `${index * 20}ms` }}
                  >
                    {/* Rank Number or Equalizer */}
                    <div className="w-8 flex justify-center shrink-0">
                      {playing ? (
                        <div className="flex items-end justify-center gap-[2px] h-4 mx-auto">
                          {[0,1,2].map(i => (
                            <div key={i} className="w-[2px] rounded-full bg-blue-400 eq-bar" style={{ height: '100%' }} />
                          ))}
                        </div>
                      ) : (
                        <span className={`text-base font-medium tabular-nums ${index < 3 ? 'text-blue-400' : 'text-zinc-500 group-hover:text-white'} transition-colors`}>
                          {index + 1}
                        </span>
                      )}
                    </div>
                    
                    {/* Artwork */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-800 shrink-0 shadow-md border border-white/[0.04] relative">
                      {track.coverArtUrl ? (
                        <img src={track.coverArtUrl} alt={track.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music size={20} className="text-zinc-700" />
                        </div>
                      )}
                      <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-300 backdrop-blur-[2px] ${playing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        {playing ? <Pause size={20} fill="white" className="drop-shadow-md" /> : <Play size={20} fill="white" className="ml-1 drop-shadow-md" />}
                      </div>
                    </div>

                    {/* Track Info */}
                    <div className="flex-1 min-w-0 pr-4">
                      <p className={`font-bold text-base truncate transition-colors ${playing ? 'text-blue-400' : 'text-white group-hover:text-blue-400'}`}>
                        {track.title}
                      </p>
                      <p className="text-sm font-medium text-zinc-400 truncate mt-0.5 group-hover:text-zinc-300 transition-colors">
                        {track.artist}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 md:gap-4">
                      <button 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-500 hover:text-purple-400 hover:bg-purple-500/10 transition-colors md:opacity-0 group-hover:opacity-100"
                        onClick={(e) => { e.stopPropagation(); toggleLikedSong?.(track); }}
                      >
                        <Heart size={20} className={(likedSongs || []).some(t => t.id === track.id) ? "fill-purple-500 text-purple-500" : ""} />
                      </button>
                      <span className="text-sm font-medium text-zinc-500 tabular-nums w-10 text-right group-hover:text-zinc-300 transition-colors hidden sm:block">{formatDuration(track.duration || 0)}</span>
                      <div onClick={e => e.stopPropagation()} className="md:opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <TrackContextMenu track={track} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          {/* Mobile Genres Row */}
          <section className="md:hidden mt-12 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white tracking-tight">Genres</h2>
              <button onClick={() => navigate('/genres')}>
                <ArrowRight size={20} className="text-zinc-400" />
              </button>
            </div>
            <div className="flex overflow-x-auto hide-scrollbar gap-4 snap-x pb-4">
              {HOME_GENRES.map((genre, i) => (
                <div 
                  key={i} 
                  className="snap-start shrink-0 w-[180px] h-[100px] rounded-2xl relative overflow-hidden bg-zinc-900 shadow-lg cursor-pointer"
                  onClick={() => navigate('/genres')}
                >
                  <ArtImage 
                    artist={genre.artist} 
                    album={genre.album} 
                    type="album" 
                    className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay scale-110" 
                  />
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="absolute inset-0 p-3 flex flex-col justify-between">
                    <h3 className="font-bold text-white text-lg drop-shadow-md">{genre.name}</h3>
                    <p className="text-[10px] text-white/70 font-medium uppercase tracking-wider drop-shadow-md truncate">{genre.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
