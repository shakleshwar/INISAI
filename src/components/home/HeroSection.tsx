import { useNavigate } from 'react-router-dom';
import { Carousel3D } from '../../components/ui/Carousel3D';
import type { Track } from '../../types';

interface HeroSectionProps {
  greeting: string;
  trending: Track[];
  trendingRegion: string;
  isTrendingLoading: boolean;
  onRegionChange: (regionId: string) => void;
  onPlayTrack: (index: number) => void;
}

const REGIONS = [
  { id: 'Global', label: 'Global' },
  { id: 'US', label: 'US' },
  { id: 'UK', label: 'UK' },
  { id: 'IN', label: 'India' },
  { id: 'CA', label: 'Canada' },
  { id: 'AU', label: 'Australia' },
  { id: 'JP', label: 'Japan' }
];

export function HeroSection({
  greeting,
  trending,
  trendingRegion,
  isTrendingLoading,
  onRegionChange,
  onPlayTrack
}: HeroSectionProps) {
  const navigate = useNavigate();

  if (trending.length === 0) return null;

  return (
    <section className="pt-10 px-6 md:px-10">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2 flex items-center gap-3">
          {greeting}
        </h1>
        <p className="text-sm font-medium text-zinc-400">Here's what's trending right now</p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="text-[12px] font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.5)]"/>
          Featured Releases
        </h2>
        
        {/* Region Selection Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide -mx-2 px-2 md:mx-0 md:px-0">
          {REGIONS.map((region) => (
            <button
              key={region.id}
              onClick={() => onRegionChange(region.id)}
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
            if (idx !== -1) onPlayTrack(idx);
          }}
          onClick={(item) => {
            navigate('/albums', { state: { artist: item.artist } });
          }}
        />
      </div>
    </section>
  );
}
