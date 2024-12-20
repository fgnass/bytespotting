import { load } from "cheerio";
import SpotifyWebApi from "spotify-web-api-node";
import { getSpotifyToken } from "./tokenManager.js";
import { updateStats } from "./stats.js";

const dailyPlaylist = process.env.DAILY_PLAYLIST;
const weeklyPlaylist = process.env.WEEKLY_PLAYLIST;

const spotify = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

export async function updatePlaylists() {
  try {
    const accessToken = await getSpotifyToken();
    spotify.setAccessToken(accessToken);

    const dailyTracks = await getTracks();
    const weeklyTracks = await getAlbums();

    await updateStats(dailyTracks.length, weeklyTracks.length);
    return { success: true };
  } catch (error) {
    console.error("Error updating playlists:", error);
    throw error;
  }
}

async function getTracksOnPlaylist(id) {
  const { body } = await spotify.getPlaylistTracks(id);
  return body.items.map((i) => i.track.uri);
}

function tokenMatch(s) {
  // Create a RegExp so that an artist "Foo" would also match "The-Foo-Band"
  return new RegExp(
    s.replace(/\s/g, "[ -]").replace(/([*/?+()])/g, "\\$1"),
    "ig"
  );
}

async function getAlbums() {
  console.log("Fetching albums");
  const existingTracks = await getTracksOnPlaylist(weeklyPlaylist);
  const response = await fetch("https://www.byte.fm/blog/alben-der-woche/");
  const body = await response.text();
  const $ = load(body);

  const albums = [];
  $(".post-title a").each(async (i, el) => {
    const text = $(el).text();
    // The links on the page all have the format '<Artist> – „<Album>"'
    const m = /^(.+?) – „(.+?)"/.exec(text);
    if (m) {
      const [, artist, album] = m;
      console.log("Found:", artist, album);
      albums.push({ artist, album });
    }
  });

  const addedTracks = [];
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
          return addedTracks;
        }
        uris.push(track.uri);
        addedTracks.push(track.uri);
      }
    }
    if (uris.length) {
      console.log("Adding", uris);
      spotify.addTracksToPlaylist(weeklyPlaylist, uris, { position: 0 });
    }
  }
  console.log("Done.");
  return addedTracks;
}

async function getTracks() {
  console.log("Fetching tracks");
  const existingTracks = await getTracksOnPlaylist(dailyPlaylist);
  const response = await fetch("https://www.byte.fm/blog/tracks-des-tages/");
  const body = await response.text();
  const $ = load(body);

  const tracks = [];
  $(".post-content p").each(async (i, p) => {
    const text = $(p).text();
    const m = /„(.+?)"/.exec(text);
    if (m) {
      const [, title] = m;
      tracks.push({ title, text });
    }
  });

  const addedTracks = [];
  for (const { title, text } of tracks) {
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
      addedTracks.push(track.uri);
    } else {
      console.log("Not found:", title, artists, text);
    }
  }
  if (addedTracks.length) {
    console.log("Adding", addedTracks);
    spotify.addTracksToPlaylist(dailyPlaylist, addedTracks, { position: 0 });
  }
  return addedTracks;
}
