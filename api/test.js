import { updatePlaylists } from "../lib/index.js";

export default async function handler(request, response) {
  try {
    if (process.env.NODE_ENV === "production") {
      return response.status(404).json({ error: "Not found" });
    }

    await updatePlaylists();
    return response.status(200).json({ success: true });
  } catch (error) {
    console.error("Error updating playlists:", error);
    return response.status(500).json({ error: error.message });
  }
}
