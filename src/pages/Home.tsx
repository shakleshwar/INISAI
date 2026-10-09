import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Track } from '../types';
import { useAudioStore } from '../store/useAudioStore';

// Components
import { HeroSection } from '../components/home/HeroSection';
import { TopArtists } from '../components/home/TopArtists';
import { QuickPicks } from '../components/home/QuickPicks';
import { TopTracksList } from '../components/home/TopTracksList';
import { VibesAndMoods } from '../components/home/VibesAndMoods';
import { NewReleases } from '../components/home/NewReleases';
import { MoodsAndGenres } from '../components/home/MoodsAndGenres';

const REGIONS = [
  { id: 'Global', label: 'Global' },
  { id: 'US', label: 'US' },
  { id: 'UK', label: 'UK' },
  { id: 'IN', label: 'India' },
  { id: 'CA', label: 'Canada' },
  { id: 'AU', label: 'Australia' },
  { id: 'JP', label: 'Japan' }
];

export function Home() {
  const { 
    queue, currentIndex, isPlaying, setQueue, playTrack, togglePlay,
    likedSongs, toggleLikedSong,
    trendingRegion, setTrendingRegion
  } = useAudioStore();

  const cachedTrending = useAudioStore(state => state.cachedTrending);
  const cachedReleases = useAudioStore(state => state.cachedReleases);
  const setCachedData = useAudioStore(state => state.setCachedData);

  const [trending, setTrending] = useState<Track[]>(cachedTrending[trendingRegion] || []);
  const [releases, setReleases] = useState<any[]>(cachedReleases || []);
  const [isLoading, setIsLoading] = useState(() => {
    const hasTrending = cachedTrending[trendingRegion] && cachedTrending[trendingRegion].length > 0;
    return !hasTrending;
  });
  const [isTrendingLoading, setIsTrendingLoading] = useState(false);
  const [isReleasesLoading, setIsReleasesLoading] = useState(false);
  
  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    let active = true;

    const fetchAllData = async () => {
      try {
        const store = useAudioStore.getState();
        
        // Fetch fresh releases if not cached
        if (!store.cachedReleases || store.cachedReleases.length === 0) {
          setIsReleasesLoading(true);
          const releasesData = await api.getNewReleases('14');
          if (releasesData && Array.isArray(releasesData) && active) {
            setReleases(releasesData);
            const currentTrending = useAudioStore.getState().cachedTrending[trendingRegion];
            setCachedData(trendingRegion, currentTrending || [], releasesData);
          }
        } else if (active) {
          setReleases(store.cachedReleases);
        }

        // Fetch trending for region if not cached
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
          setIsReleasesLoading(false);
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

  const rankedTracks = trending.slice(0, 12);
  const regionLabel = REGIONS.find(r => r.id === trendingRegion)?.label || 'Global';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-6 animate-fade-in">
          <div className="flex items-end gap-1.5 h-12">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="eq-bar w-2.5 bg-white rounded-full h-full shadow-[0_0_10px_rgba(255,255,255,0.3)]"/>
            ))}
          </div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500 font-bold">Tuning in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-32 md:pb-24">
      {/* 3D Coverflow Hero */}
      <HeroSection 
        greeting={greeting}
        trending={trending}
        trendingRegion={trendingRegion}
        isTrendingLoading={isTrendingLoading}
        onRegionChange={handleRegionChange}
        onPlayTrack={handlePlayTrack}
      />

      {/* Top Artists Carousel */}
      <TopArtists trending={trending} />
      
      {/* Main Content Area */}
      <div className="px-4 sm:px-6 md:px-10 max-w-[1400px] mx-auto space-y-10 sm:space-y-12">
        {/* Quick Picks */}
        <QuickPicks 
          tracks={trending}
          likedSongs={likedSongs}
          onPlayTrack={handlePlayTrack}
          isTrackPlaying={isTrackPlaying}
          toggleLikedSong={toggleLikedSong}
        />

        {/* Dual-Column Section on Desktop / Stack on Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-start">
          {/* Top Charts Column */}
          <div>
            <TopTracksList 
              regionLabel={regionLabel}
              isTrendingLoading={isTrendingLoading}
              rankedTracks={rankedTracks}
              likedSongs={likedSongs}
              onPlayTrack={handlePlayTrack}
              isTrackPlaying={isTrackPlaying}
              toggleLikedSong={toggleLikedSong}
            />
          </div>

          {/* Curated Radio Stations Column */}
          <div>
            <VibesAndMoods />
          </div>
        </div>

        {/* Fresh Drops & New Albums Carousel */}
        <NewReleases 
          releases={releases}
          isLoading={isReleasesLoading}
        />

        {/* Genres & Categories Explorer */}
        <MoodsAndGenres />
      </div>
    </div>
  );
}
