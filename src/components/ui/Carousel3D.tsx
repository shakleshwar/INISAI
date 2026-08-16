import { useState } from 'react';
import { ArtImage } from './ArtImage';
import { Play } from 'lucide-react';

export interface CarouselItem {
  id: string;
  title: string;
  artist: string;
  coverArtUrl?: string;
}

interface Carousel3DProps {
  items: CarouselItem[];
  onPlay: (item: CarouselItem) => void;
  onClick: (item: CarouselItem) => void;
}

export function Carousel3D({ items, onPlay, onClick }: Carousel3DProps) {
  const [activeIndex, setActiveIndex] = useState(Math.floor(items.length / 2));

  if (!items || items.length === 0) return null;

  return (
    <div className="relative w-full h-[450px] flex items-center justify-center perspective-1000 overflow-hidden mb-12 mt-4">
      {/* Background ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 via-purple-900/5 to-transparent blur-3xl -z-10" />
      
      {items.map((item, index) => {
        const isActive = index === activeIndex;
        const offset = index - activeIndex;
        
        // Calculate transform based on offset from center
        const absOffset = Math.abs(offset);
        const direction = offset > 0 ? 1 : offset < 0 ? -1 : 0;
        
        // CSS properties for 3D effect (similar to coverflow)
        const zIndex = 50 - absOffset;
        const translateX = offset * 180; // Distance between items
        const translateZ = isActive ? 100 : -150 - (absOffset * 50);
        const rotateY = isActive ? 0 : -direction * 35;
        const scale = isActive ? 1 : 0.85 - (absOffset * 0.05);
        const opacity = isActive ? 1 : Math.max(1 - absOffset * 0.25, 0);

        return (
          <div
            key={item.id + index}
            className={`absolute transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] cursor-pointer group rounded-2xl ${isActive ? 'shadow-[0_20px_50px_rgba(0,0,0,0.8)] shadow-blue-500/10' : 'shadow-xl'}`}
            style={{
              transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
              zIndex,
              opacity,
              pointerEvents: opacity > 0 ? 'auto' : 'none'
            }}
            onClick={() => {
              if (isActive) onClick(item);
              else setActiveIndex(index);
            }}
          >
            {/* Card Content */}
            <div className={`w-[260px] h-[340px] bg-[#0a0a0f] rounded-2xl overflow-hidden relative border ${isActive ? 'border-white/10' : 'border-white/5'} flex flex-col`}>
              {/* Cover Art */}
              <div className="h-[260px] w-full bg-zinc-900 shrink-0 relative overflow-hidden">
                <ArtImage 
                  artist={item.artist} 
                  album={item.title} 
                  type="album" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] to-transparent opacity-80" />
              </div>
              
              {/* Track Info (Overlay bottom) */}
              <div className="absolute bottom-0 left-0 right-0 p-5 pt-8 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f] to-transparent">
                <h3 className={`font-black text-xl truncate ${isActive ? 'text-white' : 'text-zinc-300'}`}>{item.title}</h3>
                <p className="text-zinc-400 text-sm truncate mt-1">{item.artist}</p>
                
                {/* Custom Play Button (like reference 1) */}
                {isActive && (
                  <div className="flex items-center gap-4 mt-4">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onPlay(item); }}
                      className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black hover:scale-110 transition-transform shadow-lg shadow-white/20"
                    >
                      <Play size={20} fill="currentColor" className="ml-1" />
                    </button>
                    {/* Decorative timeline (from image 1) */}
                    <div className="flex-1 h-1 bg-white/20 rounded-full relative overflow-hidden">
                      <div className="absolute top-0 left-0 h-full w-1/3 bg-white rounded-full" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
