const fetch = require("node-fetch");
const cheerio = require("cheerio");
const SpotifyWebApi = require("spotify-web-api-node");
const { getValue, setValue } = require("../../lib/kv");

const dailyPlaylist = process.env.DAILY_PLAYLIST;
const weeklyPlaylist = process.env.WEEKLY_PLAYLIST;

var spotify = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

exports.handler = async function () {
  spotify.setAccessToken(await getValue("access"));
  spotify.setRefreshToken(await getValue("refresh"));

  const {
    body: { access_token, refresh_token },
  } = await spotify.refreshAccessToken();

  spotify.setAccessToken(access_token);
  setValue("access", access_token);
  if (refresh_token) setValue("refresh", refresh_token);
  await getTracks();
  await getAlbums();
};

async function getTracksOnPlaylist(id) {
  const { body } = await spotify.getPlaylistTracks(id);
  return body.items.map((i) => i.track.uri);
}

function regex(s) {
  return new RegExp(s.replace(/\s/g, "[ -]"), "ig");
}

async function getAlbums() {
  console.log("Fetching albums");
  const existingTracks = await getTracksOnPlaylist(weeklyPlaylist);
  const response = await fetch("https://www.byte.fm/blog/alben-der-woche/");
  const body = await response.text();
  const $ = cheerio.load(body);

  const albums = [];
  $(".post-title a").each(async (i, el) => {
    const text = $(el).text();
    const m = /^(.+?) – „(.+?)“/.exec(text);
    if (m) {
      const [, artist, album] = m;
      albums.push({ artist, album });
    }
  });

  for (const { artist, album } of albums) {
    const uris = [];
    const res = await spotify.searchAlbums(`artist:${artist} album:${album}`, {
      limit: 1,
    });
    for (const album of res.body.albums.items) {
      const { body } = await spotify.getAlbumTracks(album.id);
      for (const track of body.items) {
        if (existingTracks.includes(track.uri)) {
          console.log(album.name, "already added, stopping here.");
          return;
        }
        uris.push(track.uri);
      }
    }
    if (uris.length)
      spotify.addTracksToPlaylist(weeklyPlaylist, uris, { position: 0 });
  }
}

async function getTracks() {
  console.log("Fetching tracks");
  const existingTracks = await getTracksOnPlaylist(dailyPlaylist);
  const response = await fetch("https://www.byte.fm/blog/tracks-des-tages/");
  const body = await response.text();
  const $ = cheerio.load(body);

  const tracks = [];
  $(".post-content p").each(async (i, p) => {
    const text = $(p).text();
    const m = /„(.+?)“/.exec(text);
    if (m) {
      const [, title] = m;
      tracks.push({ title, text });
    }
  });

  const uris = [];
  for (const { title, text } of tracks) {
    const res = await spotify.searchTracks(title.toLowerCase(), { limit: 8 });
    let artists;
    const track = res.body.tracks.items.find((t) => {
      artists = t.artists.map((a) => a.name);
      return artists.some((name) =>
        name.split(", ").some((a) => regex(a).test(text))
      );
    });
    if (track) {
      console.log("Found:", title, track.artists[0].name);
      if (existingTracks.includes(track.uri)) {
        console.log(title, "already added, stopping here.");
        break;
      }
      uris.push(track.uri);
    } else {
      console.log("Not found:", title, artists, text);
    }
  }
  if (uris.length) {
    console.log("Adding", uris);
    spotify.addTracksToPlaylist(dailyPlaylist, uris, { position: 0 });
  }
}
