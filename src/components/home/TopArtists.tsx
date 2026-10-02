import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { ArtImage } from '../../components/ui/ArtImage';
import type { Track } from '../../types';

interface TopArtistsProps {
  trending: Track[];
}

export function TopArtists({ trending }: TopArtistsProps) {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);

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

  const scrollMobileLeft = () => {
    if (mobileScrollRef.current) {
      mobileScrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollMobileRight = () => {
    if (mobileScrollRef.current) {
      mobileScrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (scrollRef.current && e.deltaY !== 0) {
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  const [canScrollMobileLeft, setCanScrollMobileLeft] = useState(false);
  const [canScrollMobileRight, setCanScrollMobileRight] = useState(true);
  
  const [canScrollDesktopLeft, setCanScrollDesktopLeft] = useState(false);
  const [canScrollDesktopRight, setCanScrollDesktopRight] = useState(true);

  const handleMobileScroll = () => {
    if (mobileScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = mobileScrollRef.current;
      setCanScrollMobileLeft(scrollLeft > 0);
      setCanScrollMobileRight(scrollLeft + clientWidth < scrollWidth - 1);
    }
  };

  const handleDesktopScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollDesktopLeft(scrollLeft > 0);
      setCanScrollDesktopRight(scrollLeft + clientWidth < scrollWidth - 1);
    }
  };

  useEffect(() => {
    handleMobileScroll();
    handleDesktopScroll();
    window.addEventListener('resize', handleMobileScroll);
    window.addEventListener('resize', handleDesktopScroll);
    return () => {
      window.removeEventListener('resize', handleMobileScroll);
      window.removeEventListener('resize', handleDesktopScroll);
    };
  }, [trending]);

  const artists = Array.from(new Set(trending.map(t => t.artist))).filter(Boolean).slice(0, 10);

  if (artists.length === 0) return null;

  return (
    <>
      {/* Mobile Artists Row */}
      <div className="md:hidden space-y-8 mt-6 mb-8">
        <section className="relative group">
          <div className="flex items-center justify-between px-6 mb-5">
            <h2 className="text-[12px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Top Artists</h2>
            <button onClick={() => navigate('/albums')} className="p-2 -mr-2 text-zinc-500 hover:text-white transition-colors">
              <ArrowRight size={18} />
            </button>
          </div>
          
          {/* Left Gradient + Button */}
          <div className={`absolute left-0 top-[52px] bottom-0 w-24 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent flex items-center justify-start pl-4 z-10 pointer-events-none transition-opacity duration-300 ${canScrollMobileLeft ? 'opacity-100' : 'opacity-0'}`}>
            <button 
              onClick={scrollMobileLeft}
              className="w-8 h-8 bg-black/80 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white pointer-events-auto hover:bg-white/10 active:scale-90 transition-all shadow-lg"
            >
              <ChevronLeft size={20} />
            </button>
          </div>
          
          {/* Right Gradient + Button */}
          <div className={`absolute right-0 top-[52px] bottom-0 w-24 bg-gradient-to-l from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent flex items-center justify-end pr-4 z-10 pointer-events-none transition-opacity duration-300 ${canScrollMobileRight ? 'opacity-100' : 'opacity-0'}`}>
            <button 
              onClick={scrollMobileRight}
              className="w-8 h-8 bg-black/80 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white pointer-events-auto hover:bg-white/10 active:scale-90 transition-all shadow-lg"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div 
            ref={mobileScrollRef}
            onScroll={handleMobileScroll}
            className="flex overflow-x-auto scrollbar-hide px-6 gap-4 snap-x pb-4 scroll-smooth"
          >
            {artists.map((artistName, i) => (
              <div 
                key={i} 
                className="snap-start shrink-0 w-[96px] flex flex-col items-center text-center group cursor-pointer"
                onClick={() => navigate('/albums', { state: { artist: artistName as string } })}
              >
                <div className="w-[96px] h-[96px] rounded-full overflow-hidden bg-zinc-900 mb-3 shadow-[0_8px_16px_rgba(0,0,0,0.4)] border border-white/[0.04] group-hover:border-white/10 transition-colors">
                  <ArtImage artist={artistName as string} album={artistName as string} type="artist" className="w-full h-full object-cover group-active:scale-95 transition-transform duration-300"/>
                </div>
                <h3 className="text-[13px] text-zinc-300 font-semibold truncate w-full group-hover:text-white transition-colors">{artistName as string}</h3>
              </div>
            ))}
          </div>
        </section>
      </div>
      
      {/* Desktop Top Artists */}
      <section className="hidden md:block mt-12 mb-12 relative group">
        <div className="flex items-center justify-between mb-6 px-6 md:px-10">
          <h2 className="text-[12px] font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.5)]"/>
            Top Artists
          </h2>
          <button onClick={() => navigate('/albums')} className="text-zinc-500 hover:text-white transition-colors p-2 rounded-full hover:bg-white/[0.04]">
            <ArrowRight size={20} />
          </button>
        </div>
        
        {/* Left Gradient + Button */}
        <div className={`absolute left-0 top-[52px] bottom-0 w-32 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent flex items-center justify-start pl-6 md:pl-10 z-10 pointer-events-none transition-opacity duration-300 ${canScrollDesktopLeft ? 'opacity-100' : 'opacity-0'}`}>
          <button 
            onClick={scrollLeft}
            className="w-10 h-10 bg-black/80 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white pointer-events-auto hover:bg-white/10 hover:scale-105 active:scale-95 transition-all shadow-xl"
          >
            <ChevronLeft size={24} />
          </button>
        </div>
        
        {/* Right Gradient + Button */}
        <div className={`absolute right-0 top-[52px] bottom-0 w-32 bg-gradient-to-l from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent flex items-center justify-end pr-6 md:pr-10 z-10 pointer-events-none transition-opacity duration-300 ${canScrollDesktopRight ? 'opacity-100' : 'opacity-0'}`}>
          <button 
            onClick={scrollRight}
            className="w-10 h-10 bg-black/80 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white pointer-events-auto hover:bg-white/10 hover:scale-105 active:scale-95 transition-all shadow-xl"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        <div 
          ref={scrollRef}
          onScroll={handleDesktopScroll}
          onWheel={handleWheel}
          className="flex gap-6 overflow-x-auto scrollbar-hide pb-6 scroll-smooth px-6 md:px-10"
        >
          {artists.map((artistName, i) => (
            <div 
              key={i} 
              className="flex flex-col items-center shrink-0 w-[140px] cursor-pointer group/artist"
              onClick={() => navigate('/albums', { state: { artist: artistName as string } })}
            >
              <div className="w-[140px] h-[140px] rounded-full overflow-hidden bg-zinc-900 mb-4 shadow-[0_12px_24px_rgba(0,0,0,0.5)] border border-white/[0.04] relative group-hover/artist:border-white/30 transition-all duration-500">
                <ArtImage artist={artistName as string} album={artistName as string} type="artist" className="w-full h-full object-cover group-hover/artist:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-white/10 opacity-0 group-hover/artist:opacity-100 transition-opacity duration-300 rounded-full"/>
              </div>
              <h3 className="text-[15px] text-zinc-200 font-bold truncate w-full text-center group-hover/artist:text-white transition-colors tracking-tight">{artistName as string}</h3>
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-1">Artist</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
