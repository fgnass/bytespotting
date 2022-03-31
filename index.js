const fetch = require("node-fetch");
const cheerio = require("cheerio");
const SpotifyWebApi = require("spotify-web-api-node");
const { Octokit } = require("@octokit/rest");
const sodium = require("tweetsodium");

const dailyPlaylist = process.env.DAILY_PLAYLIST;
const weeklyPlaylist = process.env.WEEKLY_PLAYLIST;

var spotify = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

const octokit = new Octokit({ auth: process.env.PAT });

async function run() {
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
  const {
    data: { key_id, key },
  } = await octokit.rest.actions.getRepoPublicKey({ owner, repo });

  async function setSecret(name, value) {
    const messageBytes = Buffer.from(value);
    const keyBytes = Buffer.from(key, "base64");

    const encryptedBytes = sodium.seal(messageBytes, keyBytes);
    const encrypted_value = Buffer.from(encryptedBytes).toString("base64");

    await octokit.rest.actions.createOrUpdateRepoSecret({
      owner,
      repo,
      key_id,
      secret_name: name,
      encrypted_value,
    });
  }

  spotify.setAccessToken(process.env.ACCESS_TOKEN);
  spotify.setRefreshToken(process.env.REFRESH_TOKEN);

  const {
    body: { access_token, refresh_token },
  } = await spotify.refreshAccessToken();

  spotify.setAccessToken(access_token);
  await setSecret("ACCESS_TOKEN", access_token);
  if (refresh_token) await setSecret("REFRESH_TOKEN", refresh_token);
  await getTracks();
  await getAlbums();
}

async function getTracksOnPlaylist(id) {
  const { body } = await spotify.getPlaylistTracks(id);
  return body.items.map((i) => i.track.uri);
}

function tokenMatch(s) {
  // Create a RegExp so that an artist "Foo" would also match "The-Foo-Band"
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
    // The links on the page all have the format '<Artist> – „<Album>“'
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
    // The "Tracks des Tages" page has no fixed format for the artist names.
    // Therefore we search for the track title, go through the first 8 found
    // tracks and check if the track's artist name appears in the link text.
    const res = await spotify.searchTracks(title.toLowerCase(), { limit: 8 });
    let artists;
    const track = res.body.tracks.items.find((t) => {
      artists = t.artists.map((a) => a.name);
      return artists.some((name) =>
        name.split(", ").some((a) => tokenMatch(a).test(text))
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

run();
