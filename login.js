require("dotenv").config();

const express = require("express");
const SpotifyWebApi = require("spotify-web-api-node");
const open = require("open");

const PORT = process.env.PORT || 5917;

var spotify = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: `http://localhost:${PORT}/callback`,
});

const app = express();

app.get("/callback", async (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send(`<script>window.close()</script>`);

  const {
    body: { access_token, refresh_token },
  } = await spotify.authorizationCodeGrant(req.query.code);
  console.log("ACCESS_TOKEN", access_token);
  console.log("REFRESH_TOKEN", refresh_token);
  process.exit();
});

app.listen(PORT, () => {
  open(spotify.createAuthorizeURL(["playlist-modify-private"], "", false));
});
