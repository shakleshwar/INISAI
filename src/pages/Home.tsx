import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Music, Heart, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
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
  { name: 'Pop', artist: 'Taylor Swift', album: '1989' },
  { name: 'Hip-Hop', artist: 'Kendrick Lamar', album: 'DAMN.' },
  { name: 'Rock', artist: 'AC/DC', album: 'Back in Black' },
  { name: 'Lo-fi', artist: 'J Dilla', album: 'Donuts' },
  { name: 'Anime', artist: 'Radwimps', album: 'Your Name' },
  { name: 'Jazz', artist: 'Miles Davis', album: 'Kind of Blue' },
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
    const hasTrending = cachedTrending[trendingRegion] && cachedTrending[trendingRegion].length > 0;
    return !hasTrending;
  });
  const [isTrendingLoading, setIsTrendingLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -400, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 400, behavior: 'smooth' });
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (scrollRef.current && e.deltaY !== 0) {
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };
  
  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

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
        
        if (!store.cachedReleases) {
          const releasesData = await api.getNewReleases('10');
          if (releasesData && Array.isArray(releasesData) && active) {
            const currentTrending = useAudioStore.getState().cachedTrending[trendingRegion];
            setCachedData(trendingRegion, currentTrending || [], releasesData);
          }
        }

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
          <div className="flex items-end gap-1.5 h-12">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="eq-bar w-2.5 bg-white rounded-full h-full shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
            ))}
          </div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500 font-bold">Tuning in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      
      {/* ─── Hero Greeting & Carousel ─── */}
      {trending.length > 0 && (
        <section className="pt-10 px-6 md:px-10">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2 flex items-center gap-3">
              {greeting}
            </h1>
            <p className="text-sm font-medium text-zinc-400">Here's what's trending right now</p>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-[12px] font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
              Featured Releases
            </h2>
            
            {/* Region Selection Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar -mx-2 px-2 md:mx-0 md:px-0">
              {REGIONS.map((region) => (
                <button
                  key={region.id}
                  onClick={() => handleRegionChange(region.id)}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[12px] font-bold transition-all duration-300 active:scale-95 ${
                    trendingRegion === region.id
                      ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-105'
                      : 'bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-white border border-white/[0.02] hover:border-white/[0.08]'
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
              onClick={() => {}}
            />
          </div>
        </section>
      )}

      {/* Mobile Artists Row */}
      <div className="md:hidden space-y-8 mt-6 mb-8">
        {trending.length > 0 && (
          <section>
            <div className="flex items-center justify-between px-6 mb-5">
              <h2 className="text-[12px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Top Artists</h2>
              <button onClick={() => navigate('/albums')} className="p-2 -mr-2 text-zinc-500 hover:text-white transition-colors">
                <ArrowRight size={18} />
              </button>
            </div>
            <div className="flex overflow-x-auto hide-scrollbar px-6 gap-4 snap-x pb-4">
              {Array.from(new Set(trending.map(t => t.artist))).filter(Boolean).slice(0, 10).map((artistName, i) => (
                <div key={i} className="snap-start shrink-0 w-[96px] flex flex-col items-center text-center group cursor-pointer" onClick={() => navigate('/albums', { state: { artist: artistName as string } })}>
                  <div className="w-[96px] h-[96px] rounded-full overflow-hidden bg-zinc-900 mb-3 shadow-[0_8px_16px_rgba(0,0,0,0.4)] border border-white/[0.04] group-hover:border-white/10 transition-colors">
                    <ArtImage artist={artistName as string} album={artistName as string} type="artist" className="w-full h-full object-cover group-active:scale-95 transition-transform duration-300" />
                  </div>
                  <h3 className="text-[13px] text-zinc-300 font-semibold truncate w-full group-hover:text-white transition-colors">{artistName as string}</h3>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
        
      {/* Desktop Top Artists */}
      <section className="hidden md:block px-6 md:px-10 mt-12 mb-12 relative group">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[12px] font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
            Top Artists
          </h2>
          <button onClick={() => navigate('/albums')} className="text-zinc-500 hover:text-white transition-colors p-2 rounded-full hover:bg-white/[0.04]">
            <ArrowRight size={20} />
          </button>
        </div>
        
        {/* Scroll Buttons */}
        <button 
          onClick={scrollLeft}
          className="absolute left-2 top-[60%] -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-black/80 hover:scale-105"
        >
          <ChevronLeft size={24} />
        </button>
        <button 
          onClick={scrollRight}
          className="absolute right-2 top-[60%] -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-black/80 hover:scale-105"
        >
          <ChevronRight size={24} />
        </button>

        <div 
          ref={scrollRef}
          onWheel={handleWheel}
          className="flex gap-6 overflow-x-auto hide-scrollbar pb-6 scroll-smooth"
        >
          {Array.from(new Set(trending.map(t => t.artist))).filter(Boolean).slice(0, 10).map((artistName, i) => (
            <div key={i} className="flex flex-col items-center shrink-0 w-[140px] cursor-pointer group/artist" onClick={() => navigate('/albums', { state: { artist: artistName as string } })}>
              <div className="w-[140px] h-[140px] rounded-full overflow-hidden bg-zinc-900 mb-4 shadow-[0_12px_24px_rgba(0,0,0,0.5)] border border-white/[0.04] relative group-hover/artist:border-white/30 transition-all duration-500">
                <ArtImage artist={artistName as string} album={artistName as string} type="artist" className="w-full h-full object-cover group-hover/artist:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-white/10 opacity-0 group-hover/artist:opacity-100 transition-opacity duration-300 rounded-full" />
              </div>
              <h3 className="text-[15px] text-zinc-200 font-bold truncate w-full text-center group-hover/artist:text-white transition-colors tracking-tight">{artistName as string}</h3>
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-1">Artist</p>
            </div>
          ))}
        </div>
      </section>
        
      <div className="px-6 md:px-10 space-y-12 pb-32 md:pb-12">
        <div className="max-w-[1200px]">
          {/* Top Global — Ranked List */}
          <section className={`transition-opacity duration-500 ${isTrendingLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            <h2 className="text-[12px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
              Top {REGIONS.find(r => r.id === trendingRegion)?.label || 'Global'}
            </h2>
            <div className="space-y-1">
              {rankedTracks.map((track, index) => {
                const playing = isTrackPlaying(index);
                return (
                  <div 
                    key={track.id + 'rank' + index}
                    onClick={() => handlePlayTrack(index)}
                    className={`group flex items-center gap-4 px-3 py-2.5 md:py-3 rounded-2xl cursor-pointer transition-all duration-300 library-card-appear ${
                      playing 
                        ? 'bg-white/10 border border-white/20 shadow-[0_4px_20px_rgba(255,255,255,0.1)]' 
                        : 'hover:bg-white/[0.03] border border-transparent hover:border-white/[0.04]'
                    }`}
                    style={{ animationDelay: `${index * 15}ms` }}
                  >
                    {/* Rank Number or Equalizer */}
                    <div className="w-8 flex justify-center shrink-0">
                      {playing ? (
                        <div className="flex items-end justify-center gap-[2px] h-4 mx-auto">
                          {[0,1,2].map(i => (
                            <div key={i} className="w-[2px] rounded-full bg-white eq-bar" style={{ height: '100%' }} />
                          ))}
                        </div>
                      ) : (
                        <span className={`text-[15px] font-mono-nums font-semibold ${index < 3 ? 'text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.5)]' : 'text-zinc-600 group-hover:text-zinc-400'} transition-colors`}>
                          {index + 1}
                        </span>
                      )}
                    </div>
                    
                    {/* Artwork */}
                    <div className="w-[52px] h-[52px] md:w-14 md:h-14 rounded-xl overflow-hidden bg-zinc-900 shrink-0 shadow-md border border-white/[0.06] relative">
                      {track.coverArtUrl ? (
                        <img src={track.coverArtUrl} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music size={20} className="text-zinc-700" />
                        </div>
                      )}
                      <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 backdrop-blur-[2px] ${playing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        {playing ? <Pause size={20} fill="white" className="drop-shadow-lg" /> : <Play size={20} fill="white" className="ml-1 drop-shadow-lg scale-90 group-hover:scale-100 transition-transform duration-300" />}
                      </div>
                    </div>

                    {/* Track Info */}
                    <div className="flex-1 min-w-0 pr-4">
                      <p className={`font-bold text-[15px] tracking-tight truncate transition-colors ${playing ? 'text-white' : 'text-zinc-100 group-hover:text-white'}`}>
                        {track.title}
                      </p>
                      <p className="text-[13px] font-medium text-zinc-500 truncate mt-0.5 group-hover:text-zinc-400 transition-colors">
                        {track.artist}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 md:gap-3">
                      <button 
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 md:opacity-0 group-hover:opacity-100 ${
                          (likedSongs || []).some(t => t.id === track.id) 
                            ? 'text-white bg-white/10 md:opacity-100' 
                            : 'text-zinc-500 hover:text-white hover:bg-white/[0.06]'
                        }`}
                        onClick={(e) => { e.stopPropagation(); toggleLikedSong?.(track); }}
                      >
                        <Heart size={18} className={(likedSongs || []).some(t => t.id === track.id) ? "fill-white" : ""} />
                      </button>
                      <span className="text-[12px] font-medium font-mono-nums text-zinc-600 tabular-nums w-10 text-right group-hover:text-zinc-400 transition-colors hidden sm:block">{formatDuration(track.duration || 0)}</span>
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
          <section className="md:hidden mt-12">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[12px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Genres</h2>
              <button onClick={() => navigate('/genres')} className="p-2 -mr-2 text-zinc-500 hover:text-white transition-colors">
                <ArrowRight size={18} />
              </button>
            </div>
            <div className="flex overflow-x-auto hide-scrollbar gap-4 snap-x">
              {HOME_GENRES.map((genre, i) => (
                <div 
                  key={i} 
                  className="snap-start shrink-0 w-[200px] h-[110px] rounded-2xl relative overflow-hidden bg-zinc-900 shadow-[0_12px_24px_rgba(0,0,0,0.5)] cursor-pointer group border border-white/[0.04]"
                  onClick={() => navigate('/genres')}
                >
                  <ArtImage 
                    artist={genre.artist} 
                    album={genre.album} 
                    type="album" 
                    className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay scale-110 group-active:scale-100 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/40 to-transparent" />
                  <div className="absolute inset-0 p-4 flex flex-col justify-end">
                    <h3 className="font-bold text-white text-[18px] drop-shadow-md tracking-tight">{genre.name}</h3>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.15em] drop-shadow-md truncate mt-0.5">{genre.artist}</p>
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
