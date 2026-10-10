import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Play,
  Pause,
  Music,
  ArrowLeft,
  Shuffle,
  Search,
  X,
  Heart,
  ChevronLeft,
  ChevronRight,
  Radio,
  Loader2,
  Users,
  CheckCircle,
  MapPin,
  ExternalLink,
  Globe
} from 'lucide-react';
import { api } from '../services/api';
import type { AudioDBArtist } from '../services/api';
import { useAudioStore } from '../store/useAudioStore';
import type { Track } from '../types';
import { ArtImage } from '../components/ui/ArtImage';
import { TrackContextMenu } from '../components/ui/TrackContextMenu';

function formatDuration(seconds?: number): string {
  if (!seconds || isNaN(seconds)) return '3:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const hashString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

interface ArtistItem {
  name: string;
  query: string;
  genre: string;
  category: 'pop' | 'hiphop' | 'rock' | 'electronic' | 'indie' | 'global';
  listeners: string;
  bioSnippet: string;
}

interface AlbumItem {
  name: string;
  artist: string;
  query: string;
  year: string;
  genre: string;
  category: 'pop' | 'hiphop' | 'rock' | 'electronic' | 'indie' | 'global';
}

interface RadioStationItem {
  id: string;
  name: string;
  artist: string;
  desc: string;
  query: string;
  trackCount: string;
}

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'pop', label: 'Pop & R&B' },
  { id: 'hiphop', label: 'Hip-Hop & Rap' },
  { id: 'rock', label: 'Rock & Alt' },
  { id: 'electronic', label: 'Electronic' },
  { id: 'indie', label: 'Indie & Folk' },
  { id: 'global', label: 'Global Hits' }
];

const POPULAR_ARTISTS: ArtistItem[] = [
  { name: 'The Weeknd', query: 'The Weeknd', genre: 'R&B / Synthwave', category: 'pop', listeners: '112.8M', bioSnippet: 'Grammy-winning pioneer of nocturnal synthwave & dark cinematic pop.' },
  { name: 'Taylor Swift', query: 'Taylor Swift', genre: 'Pop / Country', category: 'pop', listeners: '105.4M', bioSnippet: 'Record-breaking singer-songwriter traversing folk, synthpop and arenas.' },
  { name: 'Kendrick Lamar', query: 'Kendrick Lamar', genre: 'Hip-Hop / West Coast', category: 'hiphop', listeners: '68.4M', bioSnippet: 'Pulitzer Prize-winning lyrical visionary and cultural powerhouse.' },
  { name: 'Drake', query: 'Drake', genre: 'Hip-Hop / Melodic Rap', category: 'hiphop', listeners: '84.2M', bioSnippet: 'Dominant chart-topping icon shaping contemporary rap and R&B.' },
  { name: 'Billie Eilish', query: 'Billie Eilish', genre: 'Alternative / Dark Pop', category: 'pop', listeners: '98.6M', bioSnippet: 'Genre-defying modern superstar known for intimate, whisper-close vocals.' },
  { name: 'Daft Punk', query: 'Daft Punk', genre: 'Electronic / French Touch', category: 'electronic', listeners: '42.1M', bioSnippet: 'Legendary Parisian robot duo who redefined electronic dance music.' },
  { name: 'Arctic Monkeys', query: 'Arctic Monkeys', genre: 'Indie Rock / Post-Punk', category: 'rock', listeners: '51.3M', bioSnippet: 'Sheffield rock legends celebrated for sharp poetic wit and iconic riffs.' },
  { name: 'Dua Lipa', query: 'Dua Lipa', genre: 'Disco Pop / Dance', category: 'pop', listeners: '72.3M', bioSnippet: 'Global dancefloor powerhouse blending vintage disco with modern groove.' },
  { name: 'Bad Bunny', query: 'Bad Bunny', genre: 'Latin Trap / Reggaeton', category: 'global', listeners: '69.5M', bioSnippet: 'Trailblazing Puerto Rican artist driving global Latin urban music.' },
  { name: 'Fleet Foxes', query: 'Fleet Foxes', genre: 'Indie Folk / Harmony', category: 'indie', listeners: '18.2M', bioSnippet: 'Masters of pastoral acoustic harmonies and baroque folk textures.' },
  { name: 'Ed Sheeran', query: 'Ed Sheeran', genre: 'Pop / Acoustic', category: 'pop', listeners: '76.1M', bioSnippet: 'Global acoustic troubadour with monumental stadium-sized melodies.' },
  { name: 'A.R. Rahman', query: 'A.R. Rahman', genre: 'Soundtrack / World', category: 'global', listeners: '41.2M', bioSnippet: 'Academy Award-winning maestro blending Indian classical with world orchestra.' }
];

const POPULAR_ALBUMS: AlbumItem[] = [
  { name: 'After Hours', artist: 'The Weeknd', query: 'The Weeknd After Hours full album', year: '2020', genre: 'Synthwave / R&B', category: 'pop' },
  { name: 'Midnights', artist: 'Taylor Swift', query: 'Taylor Swift Midnights full album', year: '2022', genre: 'Dream Pop', category: 'pop' },
  { name: 'DAMN.', artist: 'Kendrick Lamar', query: 'Kendrick Lamar DAMN full album', year: '2017', genre: 'Hip-Hop', category: 'hiphop' },
  { name: 'Discovery', artist: 'Daft Punk', query: 'Daft Punk Discovery full album', year: '2001', genre: 'French House', category: 'electronic' },
  { name: 'Future Nostalgia', artist: 'Dua Lipa', query: 'Dua Lipa Future Nostalgia full album', year: '2020', genre: 'Disco Pop', category: 'pop' },
  { name: 'AM', artist: 'Arctic Monkeys', query: 'Arctic Monkeys AM full album', year: '2013', genre: 'Indie Rock', category: 'rock' },
  { name: 'WHEN WE ALL FALL ASLEEP', artist: 'Billie Eilish', query: 'Billie Eilish WHEN WE ALL FALL ASLEEP full album', year: '2019', genre: 'Alt Pop', category: 'pop' },
  { name: 'Scorpion', artist: 'Drake', query: 'Drake Scorpion full album', year: '2018', genre: 'Hip-Hop / R&B', category: 'hiphop' },
  { name: 'Un Verano Sin Ti', artist: 'Bad Bunny', query: 'Bad Bunny Un Verano Sin Ti full album', year: '2022', genre: 'Latin / Urban', category: 'global' },
  { name: 'Helplessness Blues', artist: 'Fleet Foxes', query: 'Fleet Foxes Helplessness Blues full album', year: '2011', genre: 'Indie Folk', category: 'indie' },
  { name: 'Divide', artist: 'Ed Sheeran', query: 'Ed Sheeran Divide full album', year: '2017', genre: 'Pop', category: 'pop' },
  { name: 'Rockstar', artist: 'A.R. Rahman', query: 'A.R. Rahman Rockstar full album', year: '2011', genre: 'Soundtrack', category: 'global' }
];

const RADIO_STATIONS: RadioStationItem[] = [
  { id: 'weeknd-radio', name: 'The Weeknd Radio', artist: 'The Weeknd', desc: 'Nocturnal R&B, Synthwave & After Hours vibes', query: 'the weeknd synthwave r&b chill', trackCount: '50+ Tracks' },
  { id: 'taylor-radio', name: 'Taylor Swift Radio', artist: 'Taylor Swift', desc: 'Eras tour favorites, Pop anthems & acoustic cuts', query: 'taylor swift pop hits acoustic', trackCount: '60+ Tracks' },
  { id: 'kendrick-radio', name: 'Kendrick Lamar Radio', artist: 'Kendrick Lamar', desc: 'West Coast rap, West Coast anthems & conscious flow', query: 'kendrick lamar hip hop hits', trackCount: '45+ Tracks' },
  { id: 'daft-radio', name: 'Daft Punk Radio', artist: 'Daft Punk', desc: 'French touch, electro disco & interstellar synth', query: 'daft punk electronic dance hits', trackCount: '50+ Tracks' },
  { id: 'billie-radio', name: 'Billie Eilish Radio', artist: 'Billie Eilish', desc: 'Moody basslines, whisper-pop & alternative gems', query: 'billie eilish alternative pop hits', trackCount: '40+ Tracks' },
  { id: 'indie-radio', name: 'Fleet Foxes & Folk Radio', artist: 'Fleet Foxes', desc: 'Acoustic fingerpicking, golden hour harmonies', query: 'fleet foxes bon iver indie folk', trackCount: '55+ Tracks' }
];

export function Albums() {
  const [selectedItem, setSelectedItem] = useState<{
    name: string;
    query: string;
    type: 'artist' | 'album' | 'radio' | 'search';
  } | null>(null);

  const [tracks, setTracks] = useState<Track[]>([]);
  const [artistMeta, setArtistMeta] = useState<AudioDBArtist | null>(null);
  const [artistDiscography, setArtistDiscography] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [loadingRadioId, setLoadingRadioId] = useState<string | null>(null);
  const [bioExpanded, setBioExpanded] = useState(false);

  const artistScrollRef = useRef<HTMLDivElement>(null);
  const radioScrollRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  const {
    setQueue,
    playTrack,
    queue,
    isPlaying,
    currentIndex,
    play,
    pause,
    likedSongs,
    toggleLikedSong
  } = useAudioStore();

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const timer = setTimeout(() => {
        api.getSuggestions(searchQuery).then(setSuggestions);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      handleItemClick(searchQuery, searchQuery, 'search');
      setShowSuggestions(false);
    }
  };

  const handleItemClick = async (
    name: string,
    query: string,
    type: 'artist' | 'album' | 'radio' | 'search'
  ) => {
    setSelectedItem({ name, query, type });
    setIsLoading(true);
    setBioExpanded(false);
    setArtistMeta(null);
    setArtistDiscography([]);
    try {
      const searchQueryString = type === 'artist' ? `${query} songs` : query;
      const isCandidateArtist = type === 'artist' || type === 'search';

      // Concurrently fetch tracks and check AudioDB for artist metadata
      const [tracksData, initialMeta] = await Promise.all([
        api.searchOnlineTracks(searchQueryString),
        isCandidateArtist ? api.getAudioDBArtist(name) : Promise.resolve(null)
      ]);

      const foundTracks = tracksData || [];
      setTracks(foundTracks);

      let finalMeta = initialMeta;
      // If direct name search didn't match AudioDB artist, check if tracks share a dominant artist
      if (!finalMeta && isCandidateArtist && foundTracks.length > 0) {
        const topArtist = foundTracks[0]?.artist;
        if (topArtist && topArtist.toLowerCase() !== name.toLowerCase()) {
          try {
            finalMeta = await api.getAudioDBArtist(topArtist);
          } catch {
            // ignore
          }
        }
      }

      setArtistMeta(finalMeta);

      // If we identified an artist, fetch their official discography
      const artistNameToUse = finalMeta?.strArtist || (type === 'artist' ? name : null);
      if (artistNameToUse) {
        try {
          const discoData = await api.getAudioDBDiscography(artistNameToUse);
          setArtistDiscography(discoData || []);
        } catch {
          setArtistDiscography([]);
        }
      } else {
        setArtistDiscography([]);
      }
    } catch (err) {
      console.error('Artist/Album search failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayStationDirect = async (station: RadioStationItem) => {
    try {
      setLoadingRadioId(station.id);
      const stationTracks = await api.searchOnlineTracks(station.query);
      if (stationTracks && stationTracks.length > 0) {
        setQueue(stationTracks);
        playTrack(0);
      }
    } catch (err) {
      console.error('Radio play failed:', err);
    } finally {
      setLoadingRadioId(null);
    }
  };

  const scrollContainer = (ref: React.RefObject<HTMLDivElement | null>, amount: number) => {
    if (ref.current) {
      ref.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (location.state?.album) {
      const query = location.state.artist ? `${location.state.artist} ${location.state.album}` : location.state.album;
      handleItemClick(location.state.album, query, 'album');
      window.history.replaceState({}, document.title);
    } else if (location.state?.artist) {
      handleItemClick(location.state.artist, location.state.artist, 'artist');
      window.history.replaceState({}, document.title);
    }
  }, [location.state?.artist, location.state?.album]);

  const handlePlay = (index: number) => {
    const isSameQueue = queue.length === tracks.length && queue[0]?.id === tracks[0]?.id;
    if (!isSameQueue) {
      setQueue(tracks);
    }
    if (currentIndex === index && isPlaying) {
      pause();
    } else if (currentIndex === index && !isPlaying) {
      play();
    } else {
      playTrack(index);
    }
  };

  const handleBack = () => {
    setSelectedItem(null);
    setTracks([]);
    setArtistMeta(null);
    setArtistDiscography([]);
    setBioExpanded(false);
  };

  const filteredArtists = activeCategory === 'all'
    ? POPULAR_ARTISTS
    : POPULAR_ARTISTS.filter(a => a.category === activeCategory);

  const filteredAlbums = activeCategory === 'all'
    ? POPULAR_ALBUMS
    : POPULAR_ALBUMS.filter(a => a.category === activeCategory);

  // ══════════════════════════════════════════════════════════════════════
  // DETAIL VIEW (When an Artist, Album, or Radio is selected)
  // ══════════════════════════════════════════════════════════════════════
  if (selectedItem) {
    const isArtist = selectedItem.type === 'artist' || !!artistMeta;
    const isSearch = selectedItem.type === 'search';

    const artistDisplayName = artistMeta?.strArtist || selectedItem.name;
    const bannerImageUrl = artistMeta?.strArtistFanart || artistMeta?.strArtistBanner || artistMeta?.strArtistWideThumb || artistMeta?.strArtistThumb;
    const listeners = Math.floor((hashString(artistDisplayName) % 80) + 20) * 1000000 + (hashString(artistDisplayName + 'x') % 999999);
    const rawFollowers = artistMeta?.intFollowers ? parseInt(artistMeta.intFollowers, 10) : null;
    const followersDisplay = rawFollowers && !isNaN(rawFollowers)
      ? `${rawFollowers.toLocaleString()} followers`
      : `${listeners.toLocaleString()} monthly listeners`;
    const bioText = artistMeta?.strBiography || artistMeta?.strBiographyEN || '';

    return (
      <div className="animate-fade-in relative pb-2 md:pb-4">
        {/* Navigation Bar */}
        <div className="sticky top-0 z-40 bg-[var(--color-surface-0)]/90 backdrop-blur-xl border-b border-white/[0.04] px-4 md:px-10 py-3.5 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-all duration-150 cursor-pointer py-1.5 px-3 rounded-full hover:bg-white/[0.06] active:scale-[0.96] text-xs font-bold uppercase tracking-wider"
          >
            <ArrowLeft size={16} />
            <span>Back to Artists</span>
          </button>

          {tracks.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setQueue(tracks);
                  playTrack(0);
                }}
                className="flex items-center gap-2 bg-white text-black px-4 py-1.5 rounded-full text-xs font-black hover:bg-zinc-200 active:scale-[0.96] transition-all duration-150 shadow-md cursor-pointer"
              >
                <Play size={13} fill="currentColor" className="ml-0.5" />
                <span>Play All</span>
              </button>
            </div>
          )}
        </div>

        {/* Hero Header */}
        {isArtist ? (
          <div className="relative overflow-hidden pt-28 pb-12 px-6 md:px-12 min-h-[380px] md:min-h-[420px] flex items-end">
            <div className="absolute inset-0 z-0">
              {bannerImageUrl ? (
                <img
                  src={bannerImageUrl}
                  alt={artistDisplayName}
                  className="w-full h-full object-cover transition-transform duration-1000 scale-105 filter brightness-90 contrast-[1.05]"
                />
              ) : (
                <ArtImage
                  artist={artistDisplayName}
                  type="artist"
                  className="w-full h-full object-cover transition-transform duration-1000 scale-105 filter brightness-90 contrast-[1.05]"
                />
              )}
              {/* Cinematic Vignette Gradients */}
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface-0)] via-[var(--color-surface-0)]/65 to-black/40" />
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-surface-0)]/90 via-transparent to-[var(--color-surface-0)]/70 pointer-events-none" />
              <div className="absolute inset-0 bg-radial-gradient pointer-events-none opacity-60" />
            </div>

            <div className="relative z-20 w-full max-w-[1400px] mx-auto">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-blue-500/20 text-blue-300 border border-blue-400/30 backdrop-blur-md shadow-sm">
                  <CheckCircle size={12} className="text-blue-400" />
                  Verified Artist
                </span>
                {artistMeta?.strGenre && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-zinc-300 border border-white/10 backdrop-blur-md">
                    {artistMeta.strGenre}
                  </span>
                )}
                {artistMeta?.strCountry && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-300 bg-black/40 px-2.5 py-1 rounded-full border border-white/[0.08] backdrop-blur-md">
                    <MapPin size={11} className="text-zinc-400" />
                    {artistMeta.strCountry}
                  </span>
                )}
              </div>
              <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-white tracking-tighter mb-4 drop-shadow-2xl leading-none capitalize">
                {artistDisplayName}
              </h1>
              <div className="text-zinc-300 text-xs md:text-sm font-semibold tracking-wide flex items-center flex-wrap gap-2 sm:gap-3">
                <span className="text-white font-bold">{followersDisplay}</span>
                {artistMeta?.intFormedYear && artistMeta.intFormedYear !== '0' && (
                  <span className="text-zinc-400">• Formed {artistMeta.intFormedYear}</span>
                )}
                {artistMeta?.strStyle && (
                  <span className="text-zinc-400">• {artistMeta.strStyle}</span>
                )}
                {artistMeta?.strLabel && (
                  <span className="text-zinc-400 hidden sm:inline">• {artistMeta.strLabel}</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden pt-28 pb-10 px-6 md:px-12 min-h-[300px] flex items-end bg-[var(--color-surface-0)]">
            {tracks[0]?.coverArtUrl && (
              <div className="absolute inset-0 z-0 overflow-hidden">
                <img
                  src={tracks[0].coverArtUrl}
                  alt=""
                  className="w-full h-full object-cover filter blur-3xl scale-150 opacity-30"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface-0)] via-[var(--color-surface-0)]/80 to-transparent" />
              </div>
            )}
            <div className="relative z-20 w-full max-w-[1400px] mx-auto">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2 block">
                {isSearch ? 'Search Result' : 'Album Release'}
              </span>
              <h1 className="text-3xl md:text-6xl font-black text-white tracking-tight">
                {selectedItem.name}
              </h1>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                <span>{tracks.length} tracks available</span>
                {tracks[0]?.artist && (
                  <span>• Featuring {tracks[0].artist}</span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Content Body */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-10 h-10 border-2 border-white/15 border-t-white rounded-full animate-spin mb-4" />
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
              Tuning in to {selectedItem.name}…
            </p>
          </div>
        ) : (
          <div className="px-4 sm:px-6 md:px-12 max-w-[1400px] mx-auto mt-8">
            {/* Quick Action Controls */}
            {tracks.length > 0 && (
              <div className="flex items-center gap-4 mb-8">
                <button
                  onClick={() => {
                    setQueue(tracks);
                    playTrack(0);
                  }}
                  className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-black hover:bg-zinc-200 active:scale-[0.96] transition-all duration-150 shadow-xl cursor-pointer"
                  title="Play"
                >
                  <Play size={24} fill="black" className="ml-0.5" />
                </button>
                <button
                  onClick={() => {
                    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
                    setQueue(shuffled);
                    playTrack(0);
                  }}
                  className="w-11 h-11 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/[0.06]"
                  title="Shuffle"
                >
                  <Shuffle size={18} />
                </button>
              </div>
            )}

            {/* Split Tracklist & Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Left / Main Column: Popular Songs */}
              <div className="lg:col-span-8 space-y-2">
                <h2 className="text-[12px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-4">
                  {isSearch ? 'Top Results' : 'Popular Songs'}
                </h2>

                <div className="space-y-1">
                  {tracks.map((track, idx) => {
                    const isTrackPlaying = currentIndex === idx && queue[idx]?.id === track.id && isPlaying;
                    const isLiked = (likedSongs || []).some((t) => t.id === track.id);
                    const duration = track.duration || ((hashString(track.id) % 180) + 120);

                    return (
                      <div
                        key={track.id + idx}
                        onClick={() => handlePlay(idx)}
                        className={`group flex items-center gap-3 sm:gap-4 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 select-none ${
                          isTrackPlaying
                            ? 'bg-white/[0.09] border border-white/20 shadow-md ring-1 ring-white/10'
                            : 'hover:bg-white/[0.04] border border-transparent'
                        }`}
                      >
                        {/* Rank or Equalizer */}
                        <div className="w-6 flex justify-center shrink-0">
                          {isTrackPlaying ? (
                            <div className="flex items-end justify-center gap-[2px] h-3.5">
                              {[0, 1, 2].map((i) => (
                                <div key={i} className="w-[2px] rounded-full bg-white eq-bar" style={{ height: '100%' }} />
                              ))}
                            </div>
                          ) : (
                            <span className="text-[13px] font-mono font-semibold text-zinc-500 tabular-nums">
                              {idx + 1}
                            </span>
                          )}
                        </div>

                        {/* Cover Art */}
                        <div className="w-11 h-11 rounded-lg overflow-hidden bg-zinc-900 shrink-0 border border-white/[0.06] relative shadow-sm">
                          {track.coverArtUrl ? (
                            <img src={track.coverArtUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Music size={16} className="text-zinc-600" />
                            </div>
                          )}
                          <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isTrackPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            {isTrackPlaying ? <Pause size={14} fill="white" /> : <Play size={14} fill="white" className="ml-0.5" />}
                          </div>
                        </div>

                        {/* Title & Artist */}
                        <div className="flex-1 min-w-0 pr-2">
                          <p className={`font-bold text-[14px] truncate ${isTrackPlaying ? 'text-white' : 'text-zinc-200 group-hover:text-white'}`}>
                            {track.title}
                          </p>
                          <p className="text-[12px] font-medium text-zinc-500 truncate mt-0.5">
                            {track.artist}
                          </p>
                        </div>

                        {/* Duration & Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLikedSong?.(track);
                            }}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                              isLiked ? 'text-white' : 'text-zinc-600 hover:text-white opacity-0 group-hover:opacity-100'
                            }`}
                          >
                            <Heart size={14} className={isLiked ? 'fill-white text-white' : ''} />
                          </button>
                          <span className="text-[11px] font-mono font-medium text-zinc-500 tabular-nums w-10 text-right">
                            {formatDuration(duration)}
                          </span>
                          <div onClick={(e) => e.stopPropagation()} className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <TrackContextMenu track={track} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Artist Discography Row if available */}
                {artistDiscography && artistDiscography.length > 0 && (
                  <div className="mt-12 pt-8 border-t border-white/[0.06]">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[12px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
                        Albums & Releases ({artistDiscography.length})
                      </h3>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        Official Discography
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {artistDiscography.slice(0, 12).map((album, i) => (
                        <div
                          key={i}
                          onClick={() => handleItemClick(album.strAlbum, `${artistDisplayName} ${album.strAlbum}`, 'album')}
                          className="group/album p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] hover:border-white/[0.1] transition-all cursor-pointer"
                        >
                          <div className="aspect-square rounded-lg overflow-hidden bg-zinc-900 mb-2 relative shadow-md">
                            <ArtImage
                              artist={artistDisplayName}
                              album={album.strAlbum}
                              type="album"
                              className="w-full h-full object-cover group-hover/album:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/album:opacity-100 transition-opacity flex items-center justify-center">
                              <Play size={16} fill="white" />
                            </div>
                          </div>
                          <p className="font-bold text-[13px] text-zinc-200 group-hover/album:text-white truncate">
                            {album.strAlbum}
                          </p>
                          {album.intYearReleased && (
                            <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                              {album.intYearReleased}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: About Artist Bio Card */}
              <div className="lg:col-span-4">
                {artistMeta && (bioText || artistMeta.strArtistThumb || bannerImageUrl) ? (
                  <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 relative overflow-hidden shadow-2xl backdrop-blur-md sticky top-20">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
                        About {artistMeta.strArtist}
                      </h3>
                      {artistMeta.strGenre && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-white/[0.06] text-zinc-400 border border-white/[0.08]">
                          {artistMeta.strGenre}
                        </span>
                      )}
                    </div>

                    {/* Artist Photo Card */}
                    {(artistMeta.strArtistThumb || bannerImageUrl) && (
                      <div className="w-full h-48 rounded-xl overflow-hidden mb-4 relative shadow-lg group">
                        <img
                          src={artistMeta.strArtistThumb || bannerImageUrl}
                          alt={artistMeta.strArtist}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3.5">
                          <div>
                            <p className="text-white font-black text-base drop-shadow-md">
                              {artistMeta.strArtist}
                            </p>
                            {artistMeta.strCountry && (
                              <p className="text-zinc-300 text-[11px] font-medium flex items-center gap-1">
                                <MapPin size={10} className="text-zinc-400" />
                                {artistMeta.strCountry}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Biography */}
                    {bioText && (
                      <div className="mb-4">
                        <p
                          className={`text-zinc-300 text-[13px] leading-relaxed font-normal ${
                            bioExpanded ? '' : 'line-clamp-6'
                          }`}
                        >
                          {bioText}
                        </p>
                        {bioText.length > 280 && (
                          <button
                            type="button"
                            onClick={() => setBioExpanded(!bioExpanded)}
                            className="mt-2 text-xs font-bold text-white hover:text-zinc-300 transition-colors uppercase tracking-wider underline cursor-pointer"
                          >
                            {bioExpanded ? 'Show Less' : 'Read Full Bio'}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Key Details Grid */}
                    <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-white/[0.06] text-[12px]">
                      {artistMeta.intFormedYear && artistMeta.intFormedYear !== '0' && (
                        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-0.5">
                            Formed
                          </span>
                          <span className="text-zinc-200 font-semibold">{artistMeta.intFormedYear}</span>
                        </div>
                      )}
                      {artistMeta.strCountry && (
                        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-0.5">
                            Origin
                          </span>
                          <span className="text-zinc-200 font-semibold truncate block" title={artistMeta.strCountry}>
                            {artistMeta.strCountry}
                          </span>
                        </div>
                      )}
                      {artistMeta.strLabel && (
                        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-0.5">
                            Record Label
                          </span>
                          <span className="text-zinc-200 font-semibold truncate block" title={artistMeta.strLabel}>
                            {artistMeta.strLabel}
                          </span>
                        </div>
                      )}
                      {artistMeta.intMembers && artistMeta.intMembers !== '0' && (
                        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-0.5">
                            Members
                          </span>
                          <span className="text-zinc-200 font-semibold">{artistMeta.intMembers} Members</span>
                        </div>
                      )}
                    </div>

                    {/* Links */}
                    <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-white/[0.06]">
                      {artistMeta.strWebsite && (
                        <a
                          href={artistMeta.strWebsite.startsWith('http') ? artistMeta.strWebsite : `https://${artistMeta.strWebsite}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white text-white hover:text-black border border-white/20 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm"
                        >
                          <Globe size={11} />
                          <span>Official Site</span>
                          <ExternalLink size={10} />
                        </a>
                      )}
                      {artistMeta.strFacebook && (
                        <a
                          href={artistMeta.strFacebook.startsWith('http') ? artistMeta.strFacebook : `https://${artistMeta.strFacebook}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-white/[0.04] hover:bg-white/10 text-zinc-300 hover:text-white border border-white/[0.08] rounded-full text-[11px] font-bold uppercase tracking-wider transition-all"
                        >
                          Facebook
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 sticky top-20">
                    <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-3">
                      Search Summary
                    </h3>
                    <div className="space-y-3 text-xs text-zinc-400">
                      <p className="leading-relaxed">
                        Showing results for <span className="text-white font-bold font-mono">"{selectedItem.name}"</span> with high-fidelity lossless streaming.
                      </p>
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1.5">
                        <div className="flex justify-between text-zinc-300">
                          <span>Total Tracks</span>
                          <span className="font-bold text-white">{tracks.length}</span>
                        </div>
                        <div className="flex justify-between text-zinc-300">
                          <span>Streaming Quality</span>
                          <span className="font-bold text-emerald-400">Lossless Master</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setQueue(tracks);
                          playTrack(0);
                        }}
                        className="w-full mt-2 py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                      >
                        <Play size={13} fill="currentColor" />
                        <span>Play All Results</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // MAIN BROWSE HUB (The requested enhanced view)
  // ══════════════════════════════════════════════════════════════════════
  const spotlightArtist = POPULAR_ARTISTS[0]; // The Weeknd

  return (
    <div className="animate-fade-in pb-2 md:pb-4">
      {/* Header & Search Area */}
      <div className="px-4 sm:px-6 md:px-12 pt-10 sm:pt-14 pb-2 sm:pb-4 max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                Music Directory
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-none">
              Artists & Albums
            </h1>
            <p className="text-[13px] sm:text-[14px] font-medium text-zinc-500 mt-2">
              Curated artist discographies, verified profiles, and radio stations
            </p>
          </div>

          {/* Search Form */}
          <div className="w-full md:w-[380px] relative z-30">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setShowSuggestions(false)}
                className="w-full pl-11 pr-10 py-3 bg-white/[0.04] hover:bg-white/[0.06] focus:bg-black border border-white/[0.08] focus:border-white/30 rounded-2xl text-[14px] font-medium text-white placeholder-zinc-500 focus:outline-none transition-all shadow-inner"
                placeholder="Search artists, albums, songs…"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSuggestions([]);
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <X size={15} />
                </button>
              )}
            </form>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 left-0 right-0 mt-2 bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl p-1.5 animate-fade-in">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSearchQuery(suggestion);
                      handleItemClick(suggestion, suggestion, 'search');
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-white/[0.06] text-[13px] font-medium text-zinc-300 hover:text-white transition-colors flex items-center gap-3"
                  >
                    <Search size={14} className="text-zinc-500" />
                    <span className="truncate">{suggestion}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ═══ Editorial Spotlight Banner ═══ */}
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-r from-zinc-950 via-zinc-900 to-black p-6 sm:p-8 md:p-10 mb-10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] group">
          {/* Background Ambient Imagery */}
          <div className="absolute right-0 top-0 bottom-0 w-full md:w-3/5 z-0 pointer-events-none opacity-40 md:opacity-60 overflow-hidden">
            <ArtImage
              artist={spotlightArtist.name}
              type="artist"
              className="w-full h-full object-cover object-top filter brightness-75 group-hover:scale-105 transition-transform duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent md:hidden" />
          </div>

          {/* Banner Content */}
          <div className="relative z-10 max-w-xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-white/10 border border-white/15 text-white backdrop-blur-md">
                Artist Spotlight
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                • {spotlightArtist.genre}
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
              {spotlightArtist.name}
            </h2>

            <p className="text-[13px] sm:text-[14px] text-zinc-300 font-medium leading-relaxed mb-6 line-clamp-2 sm:line-clamp-3">
              {spotlightArtist.bioSnippet}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleItemClick(spotlightArtist.name, spotlightArtist.query, 'artist')}
                className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-full text-[13px] font-bold hover:bg-zinc-200 active:scale-[0.96] transition-all duration-150 shadow-lg cursor-pointer"
              >
                <Users size={15} />
                <span>Explore Artist</span>
              </button>

              <button
                onClick={() => handlePlayStationDirect({
                  id: 'spotlight-hits',
                  name: `${spotlightArtist.name} Hits`,
                  artist: spotlightArtist.name,
                  desc: 'Top Hits',
                  query: `${spotlightArtist.query} top hits`,
                  trackCount: '50+ Tracks'
                })}
                className="flex items-center gap-2 bg-white/[0.08] hover:bg-white/[0.15] text-white border border-white/10 px-4 py-2.5 rounded-full text-[13px] font-bold transition-all duration-150 cursor-pointer active:scale-[0.96]"
              >
                <Play size={14} fill="white" className="ml-0.5" />
                <span>Play Hits</span>
              </button>

              <span className="text-[11px] font-mono text-zinc-500 font-semibold ml-2 hidden sm:inline-block tabular-nums">
                {spotlightArtist.listeners} Listeners
              </span>
            </div>
          </div>
        </div>

        {/* ═══ Category / Genre Filter Chips ═══ */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2 mb-10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[12px] font-bold transition-all duration-150 cursor-pointer active:scale-[0.96] ${
                activeCategory === cat.id
                  ? 'bg-white text-black shadow-md'
                  : 'bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-white border border-white/[0.04]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* ═══ Top Artists Row ═══ */}
        <section className="mb-14">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
              <h2 className="text-[12px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
                Featured Artists
              </h2>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => scrollContainer(artistScrollRef, -320)}
                className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full bg-white/[0.04] hover:bg-white/10 text-white flex items-center justify-center transition-all duration-150 cursor-pointer active:scale-[0.96]"
                aria-label="Scroll left"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => scrollContainer(artistScrollRef, 320)}
                className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full bg-white/[0.04] hover:bg-white/10 text-white flex items-center justify-center transition-all duration-150 cursor-pointer active:scale-[0.96]"
                aria-label="Scroll right"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div
            ref={artistScrollRef}
            className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide pb-4 pt-1 snap-x scroll-smooth"
          >
            {filteredArtists.map((artist) => (
              <div
                key={artist.name}
                onClick={() => handleItemClick(artist.name, artist.query, 'artist')}
                className="snap-start shrink-0 flex flex-col items-center w-28 sm:w-36 md:w-40 group cursor-pointer"
              >
                {/* Circular Avatar with concentric ring */}
                <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full overflow-hidden bg-zinc-900 relative shadow-xl ring-1 ring-white/10 group-hover:ring-white/30 transition-all duration-500 mb-3 group-hover:-translate-y-1">
                  <ArtImage
                    artist={artist.name}
                    type="artist"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[1px]">
                    <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
                      <Play size={16} fill="black" className="ml-0.5" />
                    </div>
                  </div>
                </div>

                <h3 className="font-bold text-[13px] sm:text-[14px] text-zinc-200 group-hover:text-white transition-colors truncate w-full text-center tracking-tight">
                  {artist.name}
                </h3>
                <p className="text-[10px] sm:text-[11px] font-medium text-zinc-500 truncate w-full text-center mt-0.5">
                  {artist.genre}
                </p>
                <span className="text-[9px] font-mono text-zinc-600 font-semibold uppercase tracking-wider mt-1">
                  {artist.listeners}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ Artist Radio & Curated Stations (NO FAKE LIVE PILLS) ═══ */}
        <section className="mb-8 sm:mb-10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
              <h2 className="text-[12px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
                Artist Radio & Stations
              </h2>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => scrollContainer(radioScrollRef, -340)}
                className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full bg-white/[0.04] hover:bg-white/10 text-white flex items-center justify-center transition-all duration-150 cursor-pointer active:scale-[0.96]"
                aria-label="Scroll left"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => scrollContainer(radioScrollRef, 340)}
                className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full bg-white/[0.04] hover:bg-white/10 text-white flex items-center justify-center transition-all duration-150 cursor-pointer active:scale-[0.96]"
                aria-label="Scroll right"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div
            ref={radioScrollRef}
            className="flex gap-4 sm:gap-5 overflow-x-auto scrollbar-hide pb-4 snap-x scroll-smooth"
          >
            {RADIO_STATIONS.map((station) => {
              const isStationLoading = loadingRadioId === station.id;

              return (
                <div
                  key={station.id}
                  onClick={() => handlePlayStationDirect(station)}
                  className="snap-start shrink-0 w-[240px] sm:w-[280px] p-3 sm:p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.15] transition-all duration-300 group cursor-pointer flex flex-col justify-between shadow-md hover:-translate-y-0.5 select-none"
                >
                  <div className="flex items-start gap-3 mb-3">
                    {/* Real Cover Art */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-zinc-900 shrink-0 relative ring-1 ring-white/10 shadow-sm">
                      <ArtImage
                        artist={station.artist}
                        type="artist"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        {isStationLoading ? (
                          <Loader2 size={16} className="animate-spin text-white" />
                        ) : (
                          <Play size={16} fill="white" className="ml-0.5" />
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 pt-0.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.04]">
                        Radio
                      </span>
                      <h3 className="font-bold text-[14px] sm:text-[15px] text-zinc-100 group-hover:text-white transition-colors truncate mt-1">
                        {station.name}
                      </h3>
                      <p className="text-[11px] font-medium text-zinc-500 truncate mt-0.5">
                        {station.artist}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                    <span className="text-[11px] text-zinc-400 truncate max-w-[180px]">
                      {station.desc}
                    </span>
                    <div className="w-6 h-6 rounded-full bg-white/[0.04] group-hover:bg-white text-zinc-400 group-hover:text-black flex items-center justify-center transition-all">
                      <Radio size={12} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ═══ Essential & Trending Albums ═══ */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
              <h2 className="text-[12px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
                Essential & Trending Albums
              </h2>
            </div>
            <span className="text-[11px] font-medium text-zinc-500">
              {filteredAlbums.length} Albums
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-5">
            {filteredAlbums.map((album) => (
              <div
                key={album.name}
                onClick={() => handleItemClick(album.name, album.query, 'album')}
                className="group p-2.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] hover:border-white/[0.12] transition-all duration-300 cursor-pointer flex flex-col justify-between shadow-sm hover:shadow-xl hover:-translate-y-1"
              >
                {/* Album Cover */}
                <div className="aspect-square rounded-xl overflow-hidden bg-zinc-900 mb-2.5 relative shadow-md ring-1 ring-white/10">
                  <ArtImage
                    artist={album.artist}
                    album={album.name}
                    type="album"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  />
                  {/* Floating Play Button */}
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
                      <Play size={16} fill="black" className="ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Album Details */}
                <div className="px-0.5">
                  <h3 className="font-bold text-[13px] sm:text-[14px] text-zinc-200 group-hover:text-white transition-colors truncate tracking-tight">
                    {album.name}
                  </h3>
                  <p className="text-[11px] sm:text-[12px] font-medium text-zinc-400 truncate mt-0.5">
                    {album.artist}
                  </p>
                  <p className="text-[10px] font-mono text-zinc-500 mt-1">
                    {album.year} • {album.genre}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
