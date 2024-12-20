import { Redis } from "@upstash/redis";
import SpotifyWebApi from "spotify-web-api-node";

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export async function getSpotifyToken() {
  const accessToken = await redis.get("spotify_access_token");
  if (accessToken) {
    return accessToken;
  }
  return refreshSpotifyToken();
}

export async function updateSpotifyTokens(accessToken, refreshToken) {
  await redis.set("spotify_access_token", accessToken, { ex: 3600 });
  if (refreshToken) {
    await redis.set("spotify_refresh_token", refreshToken);
  }
}

export async function refreshSpotifyToken() {
  const refreshToken = await redis.get("spotify_refresh_token");
  if (!refreshToken) {
    throw new Error("No refresh token found in Redis");
  }

  const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    refreshToken,
  });

  try {
    const data = await spotifyApi.refreshAccessToken();
    const newAccessToken = data.body.access_token;
    const newRefreshToken = data.body.refresh_token;
    await updateSpotifyTokens(newAccessToken, newRefreshToken);
    return newAccessToken;
  } catch (error) {
    console.error("Error refreshing access token:", error);
    throw error;
  }
}
