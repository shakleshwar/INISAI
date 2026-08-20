const fs = require("fs");
const file = "src/services/api.ts";
let c = fs.readFileSync(file, "utf8");
const targetRegex = /async getLyricaLyrics[\s\S]*?console.error\('Lyrica metadata error:', error\);\n\si+return null;\n\si+\}\n\si+\},/;
const newContent = `async getLyricaLyrics(title: string, artist: string, targetLang?: string) {
    try {
      const url = \`https://lrclib.net/api/search?track_name=${title}&artist_name=${artist}\`;
      const response = await fetch(url)<
      if (!response.ok) throw new Error('LRCLib fetch failed');
      const data = await response.json();
      if (data && data.length > 0) return { status: 'success', data: data[0] };
      return { status: 'error', message: 'No lyrics found' };
    } catch (error) {
      console.error('LRCLib lyrics error:', error);
      return null;
    }
  },

  async getLyricaMetadata(title: string, artist: string) {
    return null;
  },`;
c = c.replace(targetRegex, newContent);
fs.writeFileSync(file, c);
console.log("Updated api.ts");
