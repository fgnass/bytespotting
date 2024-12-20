import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export async function updateStats(dailyTracks = 0, weeklyAlbumTracks = 0) {
  const now = new Date().toISOString();
  await redis.set("last_run", now);

  if (dailyTracks > 0) {
    await redis.set("last_daily_update", {
      date: now,
      count: dailyTracks,
    });
  }

  if (weeklyAlbumTracks > 0) {
    await redis.set("last_weekly_update", {
      date: now,
      count: weeklyAlbumTracks,
    });
  }
}

export async function getStats() {
  const [lastRun, lastDailyUpdate, lastWeeklyUpdate] = await Promise.all([
    redis.get("last_run"),
    redis.get("last_daily_update"),
    redis.get("last_weekly_update"),
  ]);

  return {
    lastRun,
    lastDailyUpdate,
    lastWeeklyUpdate,
  };
}
