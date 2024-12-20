import SpotifyWebApi from "spotify-web-api-node";
import { updateSpotifyTokens } from "../lib/tokenManager.js";

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
    const { code } = request.query;

    if (!code) {
      return response.status(400).json({ error: "No code provided" });
    }

    const data = await spotifyApi.authorizationCodeGrant(code);
    const { access_token, refresh_token } = data.body;
    await updateSpotifyTokens(access_token, refresh_token);
    return response.send(`
      <h1>Setup Complete!</h1>
    `);
  } catch (error) {
    console.error("Error in callback:", error);
    return response.status(500).json({ error: error.message });
  }
}
