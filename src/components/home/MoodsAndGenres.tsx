import { useNavigate } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';
import { ArtImage } from '../../components/ui/ArtImage';

const FEATURED_GENRES = [
  { name: 'Pop', artist: 'Taylor Swift', album: '1989', gradient: 'from-pink-900/60 to-purple-900/30' },
  { name: 'Hip-Hop', artist: 'Kendrick Lamar', album: 'DAMN.', gradient: 'from-amber-900/60 to-red-900/30' },
  { name: 'Rock', artist: 'AC/DC', album: 'Back in Black', gradient: 'from-red-950/60 to-stone-900/30' },
  { name: 'Lo-fi', artist: 'J Dilla', album: 'Donuts', gradient: 'from-teal-950/60 to-emerald-900/30' },
  { name: 'Anime', artist: 'Radwimps', album: 'Your Name', gradient: 'from-sky-950/60 to-indigo-900/30' },
  { name: 'Jazz', artist: 'Miles Davis', album: 'Kind of Blue', gradient: 'from-blue-950/60 to-slate-900/30' },
];

export function MoodsAndGenres() {
  const navigate = useNavigate();

  return (
    <section className="relative group/genres">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 sm:mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
          <h2 className="text-[12px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
            Genres & Categories
          </h2>
        </div>
        <button
          onClick={() => navigate('/genres')}
          className="flex items-center gap-1.5 text-[11px] sm:text-[12px] font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer group/link py-1 px-2 rounded-lg hover:bg-white/[0.04]"
        >
          <span>All 24 Genres</span>
          <ArrowRight
            size={14}
            className="transition-transform duration-200 group-hover/link:translate-x-0.5"
          />
        </button>
      </div>

      {/* Mobile: Horizontal scrollable track with edge buttons */}
      <div className="md:hidden relative -mx-4 px-4">
        <div className="flex overflow-x-auto scrollbar-hide gap-3.5 snap-x pb-2 scroll-smooth">
          {FEATURED_GENRES.map((genre, i) => (
            <div
              key={i}
              className="snap-start shrink-0 w-[180px] h-[105px] rounded-2xl relative overflow-hidden bg-zinc-900 shadow-[0_8px_20px_rgba(0,0,0,0.5)] cursor-pointer group active:scale-[0.98] border border-white/[0.06]"
              onClick={() => navigate('/genres')}
            >
              <ArtImage
                artist={genre.artist}
                album={genre.album}
                type="album"
                className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay scale-105 group-active:scale-100 transition-transform duration-500"
              />
              <div className={`absolute inset-0 bg-gradient-to-br ${genre.gradient}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

              <div className="absolute inset-0 p-3.5 flex flex-col justify-end">
                <h3 className="font-black text-white text-[16px] drop-shadow-md tracking-tight">
                  {genre.name}
                </h3>
                <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider truncate mt-0.5">
                  {genre.artist}
                </p>
              </div>

              <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/[0.08]" />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop: Bento / 6-Card Grid */}
      <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {FEATURED_GENRES.map((genre, i) => (
          <div
            key={i}
            onClick={() => navigate('/genres')}
            className="group relative h-[140px] rounded-2xl overflow-hidden cursor-pointer border border-white/[0.06] hover:border-white/[0.2] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(0,0,0,0.6)] bg-zinc-900 active:scale-[0.98]"
          >
            {/* Background Image */}
            <ArtImage
              artist={genre.artist}
              album={genre.album}
              type="album"
              className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
            />

            {/* Gradient Overlays */}
            <div className={`absolute inset-0 bg-gradient-to-br ${genre.gradient} opacity-70 group-hover:opacity-90 transition-opacity duration-300`} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

            {/* Content & Floating Play Button */}
            <div className="absolute inset-0 p-4 flex flex-col justify-between z-10">
              <div className="flex justify-end">
                <div className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-white text-white group-hover:text-black flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0 shadow-md">
                  <Play size={12} fill="currentColor" className="ml-0.5" />
                </div>
              </div>

              <div>
                <h3 className="font-black text-white text-[17px] tracking-tight group-hover:translate-x-0.5 transition-transform duration-200">
                  {genre.name}
                </h3>
                <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider truncate mt-0.5">
                  {genre.artist}
                </p>
              </div>
            </div>

            {/* Concentric Double-bezel Ring */}
            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/[0.08] group-hover:ring-white/[0.2] transition-colors pointer-events-none" />
          </div>
        ))}
      </div>
    </section>
  );
}
