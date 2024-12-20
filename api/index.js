import { getStats } from "../lib/stats.js";

export default async function handler(request, response) {
  try {
    const stats = await getStats();
    const dailyPlaylistUrl = `https://open.spotify.com/playlist/${process.env.DAILY_PLAYLIST}`;
    const weeklyPlaylistUrl = `https://open.spotify.com/playlist/${process.env.WEEKLY_PLAYLIST}`;

    const formatDate = (isoString) => {
      if (!isoString) return "Never";
      return new Date(isoString).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    };

    response.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bytespotting</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            :root {
              --spotify-green: #1DB954;
              --spotify-black: #191414;
              --spotify-white: #FFFFFF;
              --spotify-grey: #B3B3B3;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              background: var(--spotify-black);
              color: var(--spotify-white);
              margin: 0;
              padding: 2rem;
              min-height: 100vh;
              box-sizing: border-box;
            }
            
            .container {
              max-width: 800px;
              margin: 0 auto;
            }
            
            h1 {
              font-size: 3rem;
              margin-bottom: 2rem;
              display: flex;
              align-items: center;
              gap: 1rem;
            }
            
            h1::before {
              content: "▶";
              color: var(--spotify-green);
            }
            
            .stats {
              background: rgba(255, 255, 255, 0.1);
              border-radius: 8px;
              padding: 2rem;
              margin-bottom: 2rem;
            }
            
            .stat {
              margin-bottom: 1.5rem;
            }
            
            .stat:last-child {
              margin-bottom: 0;
            }
            
            .stat-label {
              color: var(--spotify-grey);
              font-size: 0.9rem;
              margin-bottom: 0.5rem;
            }
            
            .stat-value {
              font-size: 1.1rem;
            }
            
            .playlists {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
              gap: 1rem;
            }
            
            .playlist {
              background: rgba(255, 255, 255, 0.1);
              border-radius: 8px;
              padding: 1.5rem;
              transition: background-color 0.2s;
            }
            
            .playlist:hover {
              background: rgba(255, 255, 255, 0.2);
            }
            
            a {
              color: inherit;
              text-decoration: none;
            }
            
            .playlist-title {
              color: var(--spotify-green);
              font-size: 1.2rem;
              margin-bottom: 0.5rem;
            }
            
            .playlist-description {
              color: var(--spotify-grey);
              font-size: 0.9rem;
            }

            @media (max-width: 600px) {
              body {
                padding: 1rem;
              }
              
              h1 {
                font-size: 2rem;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Bytespotting</h1>
            
            <div class="stats">
              <div class="stat">
                <div class="stat-label">Last Successful Run</div>
                <div class="stat-value">${formatDate(stats.lastRun)}</div>
              </div>
              
              <div class="stat">
                <div class="stat-label">Last Daily Track Update</div>
                <div class="stat-value">
                  ${
                    stats.lastDailyUpdate
                      ? `${formatDate(stats.lastDailyUpdate.date)} (${
                          stats.lastDailyUpdate.count
                        } tracks)`
                      : "Never"
                  }
                </div>
              </div>
              
              <div class="stat">
                <div class="stat-label">Last Weekly Album Update</div>
                <div class="stat-value">
                  ${
                    stats.lastWeeklyUpdate
                      ? `${formatDate(stats.lastWeeklyUpdate.date)} (${
                          stats.lastWeeklyUpdate.count
                        } tracks)`
                      : "Never"
                  }
                </div>
              </div>
            </div>
            
            <div class="playlists">
              <a href="${dailyPlaylistUrl}" target="_blank" class="playlist">
                <div class="playlist-title">Daily Tracks</div>
                <div class="playlist-description">Track of the day recommendations from ByteFM</div>
              </a>
              
              <a href="${weeklyPlaylistUrl}" target="_blank" class="playlist">
                <div class="playlist-title">Weekly Albums</div>
                <div class="playlist-description">Album of the week recommendations from ByteFM</div>
              </a>
            </div>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Error in index route:", error);
    return response.status(500).json({ error: error.message });
  }
}
