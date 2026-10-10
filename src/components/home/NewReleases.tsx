import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Disc, Play, ArrowRight } from 'lucide-react';

export interface ReleaseItem {
  id: string;
  title: string;
  artist: string;
  cover_url: string;
  rating?: string;
}

interface NewReleasesProps {
  releases: ReleaseItem[] | null;
  isLoading?: boolean;
}

export function NewReleases({ releases, isLoading = false }: NewReleasesProps) {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 4);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 8);
    }
  };

  const scrollByAmount = (amount: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, [releases]);

  if (!isLoading && (!releases || releases.length === 0)) {
    return null;
  }

  const items = releases || [];

  return (
    <section className="relative group/releases">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-5 sm:mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
          <div>
            <h2 className="text-[12px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
              Fresh Drops & New Albums
            </h2>
          </div>
        </div>
        <button
          onClick={() => navigate('/albums')}
          className="flex items-center gap-1.5 text-[11px] sm:text-[12px] font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer group/link py-1 px-2 rounded-lg hover:bg-white/[0.04]"
        >
          <span>Explore Albums</span>
          <ArrowRight
            size={14}
            className="transition-transform duration-200 group-hover/link:translate-x-0.5"
          />
        </button>
      </div>

      {/* Carousel Container */}
      <div className="relative -mx-4 sm:-mx-6 md:-mx-10 px-4 sm:px-6 md:px-10">
        {/* Left Arrow & Edge Gradient */}
        <div
          className={`hidden md:flex absolute left-0 top-0 bottom-4 w-20 bg-gradient-to-r from-[var(--color-surface-0)] via-[var(--color-surface-0)]/80 to-transparent items-center justify-start pl-6 z-10 pointer-events-none transition-opacity duration-300 ${
            canScrollLeft ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <button
            onClick={() => scrollByAmount(-420)}
            className="w-9 h-9 bg-black/85 backdrop-blur-md border border-white/15 rounded-full flex items-center justify-center text-white pointer-events-auto hover:bg-white/10 active:scale-[0.96] transition-all duration-150 shadow-xl cursor-pointer"
            aria-label="Scroll left"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* Right Arrow & Edge Gradient */}
        <div
          className={`hidden md:flex absolute right-0 top-0 bottom-4 w-20 bg-gradient-to-l from-[var(--color-surface-0)] via-[var(--color-surface-0)]/80 to-transparent items-center justify-end pr-6 z-10 pointer-events-none transition-opacity duration-300 ${
            canScrollRight ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <button
            onClick={() => scrollByAmount(420)}
            className="w-9 h-9 bg-black/85 backdrop-blur-md border border-white/15 rounded-full flex items-center justify-center text-white pointer-events-auto hover:bg-white/10 active:scale-[0.96] transition-all duration-150 shadow-xl cursor-pointer"
            aria-label="Scroll right"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Horizontal Scroll Track */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-4 sm:gap-5 overflow-x-auto scrollbar-hide pb-4 snap-x scroll-smooth"
        >
          {items.map((album, idx) => (
            <div
              key={album.id || `release-${idx}`}
              onClick={() =>
                navigate('/albums', {
                  state: { album: album.title, artist: album.artist }
                })
              }
              className="snap-start shrink-0 w-[150px] sm:w-[175px] md:w-[190px] group/card cursor-pointer"
            >
              {/* Outer Shell & Cover Art */}
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-white/[0.06] shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-all duration-500 group-hover/card:shadow-[0_16px_36px_rgba(0,0,0,0.7)] group-hover/card:-translate-y-1">
                {album.cover_url ? (
                  <img
                    src={album.cover_url}
                    alt={album.title}
                    className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/card:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                    <Disc size={32} className="text-zinc-600" />
                  </div>
                )}

                {/* Genre Pill Badge */}
                {album.rating && (
                  <div className="absolute top-2.5 left-2.5 z-10">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-black/70 backdrop-blur-md text-zinc-300 border border-white/10 shadow-sm">
                      {album.rating}
                    </span>
                  </div>
                )}

                {/* Hover Play Button */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-[0_4px_20px_rgba(255,255,255,0.3)] transform scale-80 group-hover/card:scale-100 transition-transform duration-300">
                    <Play size={18} fill="black" className="ml-0.5" />
                  </div>
                </div>

                {/* Inner Highlight Ring */}
                <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/[0.08] pointer-events-none" />
              </div>

              {/* Title & Artist */}
              <div className="mt-2.5 sm:mt-3 px-0.5">
                <h3 className="font-bold text-[13px] sm:text-[14px] text-zinc-200 group-hover/card:text-white transition-colors truncate tracking-tight">
                  {album.title}
                </h3>
                <p className="text-[11px] sm:text-[12px] font-medium text-zinc-500 group-hover/card:text-zinc-400 transition-colors truncate mt-0.5">
                  {album.artist}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
