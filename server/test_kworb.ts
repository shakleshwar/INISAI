import * as cheerio from 'cheerio';

async function test() {
  const res = await fetch('https://kworb.net/charts/itunes/us.html');
  const html = await res.text();
  const $ = cheerio.load(html);
  
  const tracks: any[] = [];
  $('table tbody tr').each((i, el) => {
    if (i >= 5) return;
    const text = $(el).find('td.mp.text div').text() || $(el).find('td.mp.text').text(); // try different selectors
    const parts = text.split(' - ');
    if (parts.length >= 2) {
      tracks.push({ artist: parts[0].trim(), title: parts.slice(1).join(' - ').trim() });
    } else {
      tracks.push({ title: text, artist: 'Unknown' });
    }
  });
  console.log(tracks);
}
test();
