import YTMusic from "ytmusic-api";

async function test() {
  const ytmusic = new YTMusic();
  await ytmusic.initialize();
  const results = await ytmusic.searchSongs("Jazz music hits");
  console.log(JSON.stringify(results.slice(0, 2), null, 2));
}

test().catch(console.error);
