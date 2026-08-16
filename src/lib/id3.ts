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
        
        let coverArtUrl = undefined;
        if (tags.picture) {
          const { data, format } = tags.picture;
          let base64String = "";
          for (let i = 0; i < data.length; i++) {
            base64String += String.fromCharCode(data[i]);
          }
          const base64 = btoa(base64String);
          coverArtUrl = `data:${format};base64,${base64}`;
        }

        resolve({
          title: tags.title || fallback.title,
          artist: tags.artist || fallback.artist,
          album: tags.album || fallback.album,
          coverArtUrl
        });
      },
      onError: function(error: any) {
        console.warn('ID3 parsing error:', error.info);
        resolve(fallback);
      }
    });
  });
}
