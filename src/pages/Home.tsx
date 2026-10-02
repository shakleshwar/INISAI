import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Track } from '../types';
import { useAudioStore } from '../store/useAudioStore';

// Components
import { HeroSection } from '../components/home/HeroSection';
import { TopArtists } from '../components/home/TopArtists';
import { TopTracksList } from '../components/home/TopTracksList';
import { MobileGenres } from '../components/home/MobileGenres';

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
  const setCachedData = useAudioStore(state => state.setCachedData);

  const [trending, setTrending] = useState<Track[]>(cachedTrending[trendingRegion] || []);
  const [isLoading, setIsLoading] = useState(() => {
    const hasTrending = cachedTrending[trendingRegion] && cachedTrending[trendingRegion].length > 0;
    return !hasTrending;
  });
  const [isTrendingLoading, setIsTrendingLoading] = useState(false);
  
  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

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
    <div className="animate-fade-in pb-12">
      <HeroSection 
        greeting={greeting}
        trending={trending}
        trendingRegion={trendingRegion}
        isTrendingLoading={isTrendingLoading}
        onRegionChange={handleRegionChange}
        onPlayTrack={handlePlayTrack}
      />

      <TopArtists trending={trending} />
      
      <div className="px-6 md:px-10 space-y-12">
        <div className="max-w-[1200px]">
          <TopTracksList 
            regionLabel={regionLabel}
            isTrendingLoading={isTrendingLoading}
            rankedTracks={rankedTracks}
            likedSongs={likedSongs}
            onPlayTrack={handlePlayTrack}
            isTrackPlaying={isTrackPlaying}
            toggleLikedSong={toggleLikedSong}
          />
          <MobileGenres />
        </div>
      </div>
    </div>
  );
}
