import { updatePlaylists } from "../lib/index.js";

export default async function handler(request, response) {
  try {
    // Only allow POST requests from Vercel Cron
    if (request.method !== "POST") {
      return response.status(405).json({ error: "Method not allowed" });
    }

    // Verify the request is from Vercel Cron
    const authHeader = request.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return response.status(401).json({ error: "Unauthorized" });
    }

    await updatePlaylists();

    return response.status(200).json({ success: true });
  } catch (error) {
    console.error("Error updating playlists:", error);
    return response.status(500).json({ error: error.message });
  }
}
