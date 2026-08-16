import { useState, useEffect } from 'react';
import { Play, Pause, Music, Heart } from 'lucide-react';
import { api } from '../services/api';
import type { Track } from '../types';
import { useAudioStore } from '../store/useAudioStore';
import { TrackContextMenu } from '../components/ui/TrackContextMenu';
import { Carousel3D } from '../components/ui/Carousel3D';

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '3:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function Home() {
  const { 
    queue, currentIndex, isPlaying, setQueue, playTrack, togglePlay,
    cachedTrending, cachedReleases, setCachedData,
    likedSongs, toggleLikedSong,
    trendingRegion, setTrendingRegion
  } = useAudioStore();

  const [trending, setTrending] = useState<Track[]>(cachedTrending[trendingRegion] || []);
  const [newReleases, setNewReleases] = useState<any[]>(cachedReleases || []);
  const [isLoading, setIsLoading] = useState(!cachedTrending[trendingRegion] || !cachedReleases);
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

    const fetchData = async () => {
      try {
        // Fetch Releases if we don't have them
        if (!cachedReleases && active) {
          const releasesData = await api.getAllMusicReleases('5');
          if (releasesData && Array.isArray(releasesData)) {
            setNewReleases(releasesData);
            setCachedData(trendingRegion, cachedTrending[trendingRegion] || [], releasesData);
          }
        }

        // Fetch Trending for current region if not cached
        if (!cachedTrending[trendingRegion]) {
          setIsTrendingLoading(true);
          const trendingData = await api.getTrending(trendingRegion);
          if (active) {
            setTrending(trendingData);
            setCachedData(trendingRegion, trendingData, null); // passing null to keep releases unchanged in store implementation
            setIsTrendingLoading(false);
          }
        } else if (active) {
          setTrending(cachedTrending[trendingRegion]);
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

    fetchData();

    return () => { active = false; };
  }, [trendingRegion, cachedTrending, cachedReleases, setCachedData]);

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
          <p className="text-[11px] uppercase tracking-widest text-zinc-500 font-bold">Tuning in…</p>
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

      <div className="px-6 md:px-10 space-y-12 pb-32 md:pb-10 -mt-6">

        {/* ─── AllMusic New Releases ─── */}
      {newReleases.length > 0 && (
        <section className="mt-12 px-6 md:px-10">
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-2xl font-bold text-white tracking-tight">New Releases <span className="text-sm font-normal text-zinc-400 ml-2">from AllMusic</span></h2>
            <button className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors">See all</button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {newReleases.map((release, i) => (
              <div key={i} className="group bg-white/[0.02] p-4 rounded-2xl border border-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.08] transition-all cursor-pointer hover:-translate-y-1 shadow-lg hover:shadow-xl">
                <div className="relative aspect-square rounded-xl overflow-hidden bg-[#050505] shadow-inner mb-4 border border-white/5">
                  {release.cover_url || release.image ? (
                    <img src={release.cover_url || release.image} alt={release.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Music className="text-zinc-600 w-10 h-10" /></div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-xl scale-75 group-hover:scale-110 transition-transform duration-300">
                      <Play size={20} fill="currentColor" className="ml-0.5" />
                    </div>
                  </div>
                </div>
                <h3 className="font-bold text-white truncate text-sm">{release.title}</h3>
                <p className="text-xs text-zinc-500 truncate mt-1">{release.artist}</p>
                {release.rating && (
                  <p className="text-[9px] text-blue-400 mt-2 uppercase tracking-widest font-bold">Score: {release.rating}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

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
                      <span className="text-sm font-medium text-zinc-500 tabular-nums w-10 text-right group-hover:text-zinc-300 transition-colors hidden sm:block">{formatDuration(0)}</span>
                      <div onClick={e => e.stopPropagation()} className="md:opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <TrackContextMenu track={track} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
