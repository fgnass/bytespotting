import SpotifyWebApi from "spotify-web-api-node";

const scopes = ["playlist-modify-public", "playlist-modify-private"];
const redirectUri = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/api/callback`
  : "http://localhost:3000/api/callback";

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri,
});

export default async function handler(request, response) {
  try {
    const authorizeURL = spotifyApi.createAuthorizeURL(scopes);
    return response.redirect(authorizeURL);
  } catch (error) {
    console.error("Error in login:", error);
    return response.status(500).json({ error: error.message });
  }
}
