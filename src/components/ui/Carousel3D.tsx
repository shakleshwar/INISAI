import { useState, useRef } from 'react';
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
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const [isDragging, setIsDragging] = useState(false);

  if (!items || items.length === 0) return null;

  const handleDragStart = (clientX: number) => {
    touchStartX.current = clientX;
    setIsDragging(true);
  };

  const handleDragMove = (clientX: number) => {
    if (!isDragging) return;
    touchEndX.current = clientX;
  };

  const handleDragEnd = () => {
    if (!isDragging || !touchStartX.current || !touchEndX.current) {
      setIsDragging(false);
      return;
    }
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe) {
      setActiveIndex(prev => prev + 1);
    } else if (isRightSwipe) {
      setActiveIndex(prev => prev - 1);
    }
    
    touchStartX.current = 0;
    touchEndX.current = 0;
    setIsDragging(false);
  };

  return (
    <div 
      className="relative w-full h-[450px] flex items-center justify-center perspective-1000 overflow-hidden mb-12 mt-4 select-none"
      onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
      onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
      onTouchEnd={handleDragEnd}
      onMouseDown={(e) => handleDragStart(e.clientX)}
      onMouseMove={(e) => handleDragMove(e.clientX)}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
    >
      {/* Background ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent blur-[100px] -z-10" />
      
      {items.map((item, index) => {
        const n = items.length;
        // Calculate shortest distance in circular array
        let offset = (index - (activeIndex % n)) % n;
        if (offset < 0) offset += n; // Ensure positive modulo
        if (offset > Math.floor(n / 2)) offset -= n;
        
        const isActive = offset === 0;
        
        // Calculate transform based on offset from center
        const absOffset = Math.abs(offset);
        const direction = offset > 0 ? 1 : offset < 0 ? -1 : 0;
        
        // CSS properties for 3D effect (similar to coverflow)
        const zIndex = 50 - absOffset;
        const translateX = offset * 180; // Distance between items
        const translateZ = isActive ? 120 : -150 - (absOffset * 50);
        const rotateY = isActive ? 0 : -direction * 35;
        const scale = isActive ? 1 : 0.85 - (absOffset * 0.05);
        const opacity = isActive ? 1 : Math.max(1 - absOffset * 0.25, 0);

        return (
          <div
            key={item.id + index}
            className={`absolute transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer group rounded-2xl ${isActive ? 'shadow-[0_24px_64px_rgba(0,0,0,0.8)] shadow-white/10' : 'shadow-xl'}`}
            style={{
              transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
              zIndex,
              opacity,
              pointerEvents: opacity > 0 ? 'auto' : 'none'
            }}
            onClick={() => {
              if (isActive) onClick(item);
              else setActiveIndex(prev => prev + offset);
            }}
          >
            {/* Card Content */}
            <div className={`w-[260px] h-[340px] bg-[#030304]/80 backdrop-blur-xl rounded-2xl overflow-hidden relative border ${isActive ? 'border-white/[0.12]' : 'border-white/[0.04]'} flex flex-col`}>
              {/* Cover Art */}
              <div className="h-[260px] w-full bg-zinc-900 shrink-0 relative overflow-hidden [transform:translateZ(0)] rounded-t-2xl">
                <ArtImage 
                  artist={item.artist} 
                  album={item.title} 
                  type="album" 
                  className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#030304] to-transparent opacity-90" />
              </div>
              
              {/* Track Info (Overlay bottom) */}
              <div className="absolute bottom-0 left-0 right-0 p-5 pt-8 bg-gradient-to-t from-[#030304] via-[#030304]/90 to-transparent">
                <h3 className={`font-black text-[22px] tracking-tight truncate ${isActive ? 'text-white' : 'text-zinc-300'}`}>{item.title}</h3>
                <p className="text-zinc-400 text-[13px] font-medium truncate mt-0.5">{item.artist}</p>
                
                {/* Custom Play Button */}
                {isActive && (
                  <div className="flex items-center gap-4 mt-4">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onPlay(item); }}
                      className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black hover:scale-110 active:scale-95 transition-transform shadow-[0_8px_24px_rgba(255,255,255,0.3)]"
                    >
                      <Play size={20} fill="currentColor" className="ml-1" />
                    </button>
                    {/* Decorative timeline */}
                    <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full relative overflow-hidden">
                      <div className="absolute top-0 left-0 h-full w-1/3 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
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
