import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { ArtImage } from '../../components/ui/ArtImage';

const HOME_GENRES = [
  { name: 'Pop', artist: 'Taylor Swift', album: '1989' },
  { name: 'Hip-Hop', artist: 'Kendrick Lamar', album: 'DAMN.' },
  { name: 'Rock', artist: 'AC/DC', album: 'Back in Black' },
  { name: 'Lo-fi', artist: 'J Dilla', album: 'Donuts' },
  { name: 'Anime', artist: 'Radwimps', album: 'Your Name' },
  { name: 'Jazz', artist: 'Miles Davis', album: 'Kind of Blue' },
];

export function MobileGenres() {
  const navigate = useNavigate();

  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
    }
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, []);

  return (
    <section className="md:hidden mt-12 relative group">
      <div className="flex items-center justify-between mb-5 px-6">
        <h2 className="text-[12px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Genres</h2>
        <button onClick={() => navigate('/genres')} className="p-2 -mr-2 text-zinc-500 hover:text-white transition-colors">
          <ArrowRight size={18} />
        </button>
      </div>

      {/* Left Gradient + Button */}
      <div className={`absolute left-0 top-[52px] bottom-0 w-24 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent flex items-center justify-start pl-4 z-10 pointer-events-none transition-opacity duration-300 ${canScrollLeft ? 'opacity-100' : 'opacity-0'}`}>
        <button 
          onClick={scrollLeft}
          className="w-8 h-8 bg-black/80 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white pointer-events-auto hover:bg-white/10 active:scale-90 transition-all shadow-lg"
        >
          <ChevronLeft size={20} />
        </button>
      </div>
      
      {/* Right Gradient + Button */}
      <div className={`absolute right-0 top-[52px] bottom-0 w-24 bg-gradient-to-l from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent flex items-center justify-end pr-4 z-10 pointer-events-none transition-opacity duration-300 ${canScrollRight ? 'opacity-100' : 'opacity-0'}`}>
        <button 
          onClick={scrollRight}
          className="w-8 h-8 bg-black/80 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white pointer-events-auto hover:bg-white/10 active:scale-90 transition-all shadow-lg"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto scrollbar-hide gap-4 snap-x px-6 pb-4 scroll-smooth"
      >
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
            <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/40 to-transparent"/>
            <div className="absolute inset-0 p-4 flex flex-col justify-end">
              <h3 className="font-bold text-white text-[18px] drop-shadow-md tracking-tight">{genre.name}</h3>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.15em] drop-shadow-md truncate mt-0.5">{genre.artist}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
