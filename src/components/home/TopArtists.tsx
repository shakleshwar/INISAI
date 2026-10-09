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
      {/* ═══ Mobile Artists Row ═══ */}
      <div className="md:hidden mt-4 mb-6">
        <section className="relative">
          <div className="flex items-center justify-between px-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-1 rounded-full bg-white/60" />
              <h2 className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Top Artists</h2>
            </div>
            <button 
              onClick={() => navigate('/albums')} 
              className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 hover:text-white transition-colors active:scale-[0.96] px-2 py-1.5 rounded-lg"
            >
              <span className="hidden">See all</span>
              <ArrowRight size={16} strokeWidth={2} />
            </button>
          </div>
          
          {/* Edge Fades */}
          <div className={`absolute left-0 top-[40px] bottom-0 w-16 bg-gradient-to-r from-[var(--color-surface-0)] to-transparent z-10 pointer-events-none transition-opacity duration-300 ${canScrollMobileLeft ? 'opacity-100' : 'opacity-0'}`}>
            <button 
              onClick={scrollMobileLeft}
              className="absolute top-1/2 -translate-y-1/2 left-2 w-8 h-8 bg-black/80 backdrop-blur-md border border-white/15 rounded-full flex items-center justify-center text-white pointer-events-auto active:scale-[0.96] transition-all shadow-lg cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>
          </div>
          
          <div className={`absolute right-0 top-[40px] bottom-0 w-16 bg-gradient-to-l from-[var(--color-surface-0)] to-transparent z-10 pointer-events-none transition-opacity duration-300 ${canScrollMobileRight ? 'opacity-100' : 'opacity-0'}`}>
            <button 
              onClick={scrollMobileRight}
              className="absolute top-1/2 -translate-y-1/2 right-2 w-8 h-8 bg-black/80 backdrop-blur-md border border-white/15 rounded-full flex items-center justify-center text-white pointer-events-auto active:scale-[0.96] transition-all shadow-lg cursor-pointer"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div 
            ref={mobileScrollRef}
            onScroll={handleMobileScroll}
            className="flex overflow-x-auto scrollbar-hide px-4 gap-5 snap-x pb-3 scroll-smooth"
          >
            {artists.map((artistName, i) => (
              <div 
                key={i} 
                className="snap-start shrink-0 w-[76px] flex flex-col items-center text-center group cursor-pointer"
                onClick={() => navigate('/albums', { state: { artist: artistName as string } })}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="w-[72px] h-[72px] rounded-full overflow-hidden bg-zinc-900 mb-2.5 shadow-[0_6px_18px_rgba(0,0,0,0.5)] border-2 border-transparent group-active:border-white/30 transition-all duration-300 relative">
                  <ArtImage artist={artistName as string} album={artistName as string} type="artist" className="w-full h-full object-cover group-active:scale-95 transition-transform duration-300"/>
                  {/* Subtle inner ring */}
                  <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/[0.08]" />
                </div>
                <h3 className="text-[12px] text-zinc-400 font-semibold truncate w-full group-active:text-white transition-colors leading-tight">{artistName as string}</h3>
              </div>
            ))}
          </div>
        </section>
      </div>
      
      {/* ═══ Desktop Top Artists ═══ */}
      <section className="hidden md:block mt-8 mb-10 relative group/section">
        <div className="flex items-center justify-between mb-6 px-6 md:px-10">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.5)]"/>
            <h2 className="text-[12px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Top Artists</h2>
          </div>
          <button 
            onClick={() => navigate('/albums')} 
            className="flex items-center gap-2 text-[12px] font-semibold text-zinc-500 hover:text-white transition-colors p-2 rounded-full hover:bg-white/[0.04] cursor-pointer active:scale-[0.96]"
          >
            <ArrowRight size={18} strokeWidth={2} />
          </button>
        </div>
        
        {/* Left Gradient + Button */}
        <div className={`absolute left-0 top-[52px] bottom-0 w-28 bg-gradient-to-r from-[var(--color-surface-0)] via-[var(--color-surface-0)]/80 to-transparent flex items-center justify-start pl-6 md:pl-8 z-10 pointer-events-none transition-opacity duration-300 ${canScrollDesktopLeft ? 'opacity-100' : 'opacity-0'}`}>
          <button 
            onClick={scrollLeft}
            className="w-10 h-10 bg-black/80 backdrop-blur-md border border-white/15 rounded-full flex items-center justify-center text-white pointer-events-auto hover:bg-white/10 hover:scale-105 active:scale-[0.96] transition-all shadow-xl cursor-pointer"
          >
            <ChevronLeft size={22} />
          </button>
        </div>
        
        {/* Right Gradient + Button */}
        <div className={`absolute right-0 top-[52px] bottom-0 w-28 bg-gradient-to-l from-[var(--color-surface-0)] via-[var(--color-surface-0)]/80 to-transparent flex items-center justify-end pr-6 md:pr-8 z-10 pointer-events-none transition-opacity duration-300 ${canScrollDesktopRight ? 'opacity-100' : 'opacity-0'}`}>
          <button 
            onClick={scrollRight}
            className="w-10 h-10 bg-black/80 backdrop-blur-md border border-white/15 rounded-full flex items-center justify-center text-white pointer-events-auto hover:bg-white/10 hover:scale-105 active:scale-[0.96] transition-all shadow-xl cursor-pointer"
          >
            <ChevronRight size={22} />
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
              className="flex flex-col items-center shrink-0 w-[130px] cursor-pointer group/artist stagger-in"
              onClick={() => navigate('/albums', { state: { artist: artistName as string } })}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="w-[120px] h-[120px] rounded-full overflow-hidden bg-zinc-900 mb-3.5 shadow-[0_12px_32px_rgba(0,0,0,0.5)] relative group-hover/artist:shadow-[0_16px_40px_rgba(255,255,255,0.08)] transition-all duration-500">
                <ArtImage artist={artistName as string} album={artistName as string} type="artist" className="w-full h-full object-cover group-hover/artist:scale-110 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"/>
                {/* Ring & Hover Overlay */}
                <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/[0.06] group-hover/artist:ring-white/25 transition-all duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-white/[0.06] opacity-0 group-hover/artist:opacity-100 transition-opacity duration-300 rounded-full"/>
              </div>
              <h3 className="text-[14px] text-zinc-300 font-bold truncate w-full text-center group-hover/artist:text-white transition-colors tracking-tight">{artistName as string}</h3>
              <p className="text-[10px] text-zinc-600 font-semibold uppercase tracking-[0.15em] mt-0.5">Artist</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
