import { createClient } from "@vercel/kv";

// Create KV client for storing tokens
const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export async function refreshSpotifyToken() {
  const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  });

  try {
    const data = await spotifyApi.refreshAccessToken();
    const newAccessToken = data.body.access_token;

    // Store the new access token in Vercel KV
    await kv.set("spotify_access_token", newAccessToken);

    return newAccessToken;
  } catch (error) {
    console.error("Error refreshing access token:", error);
    throw error;
  }
}

export async function getValidAccessToken() {
  try {
    // Try to get token from KV first
    let accessToken = await kv.get("spotify_access_token");

    if (!accessToken) {
      // If no token in KV, refresh and store new one
      accessToken = await refreshSpotifyToken();
    }

    return accessToken;
  } catch (error) {
    console.error("Error getting valid access token:", error);
    throw error;
  }
}
