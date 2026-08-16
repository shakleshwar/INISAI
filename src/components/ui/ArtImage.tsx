import { useState, useEffect } from 'react';
import { Music, User } from 'lucide-react';
import { api } from '../../services/api';

interface ArtImageProps {
  artist: string;
  album?: string;
  className?: string;
  type?: 'artist' | 'album' | 'radio' | 'genre';
  fallbackGradient?: string;
  initials?: string;
}

const frontendArtCache = new Map<string, string>();

export function ArtImage({ artist, album, className = '', type = 'album', fallbackGradient = 'from-zinc-700 to-zinc-900', initials }: ArtImageProps) {
  const cacheKey = `${artist}-${album || ''}`;
  const cachedUrl = frontendArtCache.get(cacheKey);

  const [url, setUrl] = useState<string | null>(cachedUrl || null);
  const [loading, setLoading] = useState(!cachedUrl);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const fetchArt = async () => {
      if (cachedUrl) return; // Already have it
      
      setLoading(true);
      setError(false);
      try {
        const artUrl = await api.getArt(artist, album);
        if (mounted) {
          if (artUrl) {
            frontendArtCache.set(cacheKey, artUrl);
            setUrl(artUrl);
          } else {
            setError(true);
          }
        }
      } catch (err) {
        if (mounted) setError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchArt();

    return () => {
      mounted = false;
    };
  }, [artist, album]);

  if (loading) {
    return (
      <div className={`bg-gradient-to-br ${fallbackGradient} animate-pulse flex items-center justify-center ${className}`}>
        {type === 'artist' ? <User className="w-8 h-8 text-white/20" /> : <Music className="w-8 h-8 text-white/20" />}
      </div>
    );
  }

  if (error || !url) {
    return (
      <div className={`bg-gradient-to-br ${fallbackGradient} flex items-center justify-center ${className}`}>
        {initials ? (
          <span className="text-4xl font-bold text-white">{initials}</span>
        ) : type === 'artist' ? (
          <User className="w-12 h-12 text-white/40" />
        ) : (
          <Music className="w-12 h-12 text-white/40" />
        )}
      </div>
    );
  }

  return (
    <img 
      src={url} 
      alt={`${artist} ${album || 'Art'}`} 
      className={`object-cover ${className}`}
      loading="lazy"
    />
  );
}
