import { Redis } from "@upstash/redis";
import SpotifyWebApi from "spotify-web-api-node";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
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

    // Store the new access token in Upstash
    await redis.set("spotify_access_token", newAccessToken, { ex: 3600 }); // expires in 1 hour

    return newAccessToken;
  } catch (error) {
    console.error("Error refreshing access token:", error);
    throw error;
  }
}

export async function getValidAccessToken() {
  try {
    // Try to get token from Redis first
    let accessToken = await redis.get("spotify_access_token");

    if (!accessToken) {
      // If no token in Redis, refresh and store new one
      accessToken = await refreshSpotifyToken();
    }

    return accessToken;
  } catch (error) {
    console.error("Error getting valid access token:", error);
    throw error;
  }
}
