import * as jsmediatags from 'jsmediatags';

export interface ID3Metadata {
  title: string;
  artist: string;
  album: string;
  coverArtUrl?: string;
}

export function parseID3Tags(file: File): Promise<ID3Metadata> {
  return new Promise((resolve) => {
    // Fallback metadata if parsing fails
    const fallback: ID3Metadata = {
      title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
      artist: 'Unknown Artist',
      album: 'Unknown Album',
    };

    jsmediatags.read(file, {
      onSuccess: function(tag: any) {
        const tags = tag.tags;
        
        if (tags.picture) {
          try {
            const { data, format } = tags.picture;
            // Handle different variations of jsmediatags data format
            const byteArray = new Uint8Array(data);
            const blob = new Blob([byteArray], { type: format || 'image/jpeg' });
            
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve({
                title: tags.title || fallback.title,
                artist: tags.artist || fallback.artist,
                album: tags.album || fallback.album,
                coverArtUrl: reader.result as string
              });
            };
            reader.onerror = () => {
              console.error("Cover extraction failed during FileReader");
              resolve({
                title: tags.title || fallback.title,
                artist: tags.artist || fallback.artist,
                album: tags.album || fallback.album,
                coverArtUrl: undefined
              });
            };
            reader.readAsDataURL(blob);
            return;
          } catch (e) {
            console.error("Cover extraction failed:", e);
          }
        }

        resolve({
          title: tags.title || fallback.title,
          artist: tags.artist || fallback.artist,
          album: tags.album || fallback.album,
          coverArtUrl: undefined
        });
      },
      onError: function(error: any) {
        console.warn('ID3 parsing error:', error.info);
        resolve(fallback);
      }
    });
  });
}
