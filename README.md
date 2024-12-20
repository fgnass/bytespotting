# ▶ Bytespotting

Create Spotify playlists based on [ByteFM](https://www.byte.fm/) recommendations.

ByteFM is a German ad-free "author's radio" from Hamburg with high quality music-journalistic contributions. [Each week](https://www.byte.fm/blog/alben-der-woche/) a different album is featured as well as a [daily track](https://www.byte.fm/blog/tracks-des-tages/). Since manually adding these tracks to Spotify is quite time consuming I created Bytespotting to automate the task. As result these two playlists are now populated on a daily basis:

- [Daily tracks](https://open.spotify.com/playlist/3RGUrzI3KludSYbnuxhbxg?si=fe41394ce89140e2)
- [Weekly albumns](https://open.spotify.com/playlist/7yVxheAVcvptuVl8mVgSoH?si=52c69b4e1d134d2f)

## Internals

The sections below describe some of the Bytespotting internals and hopefully are helpful for others who want to implement something similar.

## Scheduling

Bytespotting runs as a Vercel Cron Job which is triggered daily to update the playlists.

## Spotify Authentication

The application uses Spotify's OAuth2 flow for authentication. While there is a flow for [server-to-server authentication](https://developer.spotify.com/documentation/general/guides/authorization/client-credentials/), these tokens can't be used to modify playlists. Instead we need a [personal](https://developer.spotify.com/documentation/general/guides/authorization/code-flow/) access token and a refresh token since access tokens expire.

## Storing the tokens

The access and refresh tokens are stored securely using Vercel's Environment Variables. This provides a secure way to manage sensitive data without exposing it in the codebase.

## Environment Variables

The following environment variables need to be set in your Vercel project:

- `SPOTIFY_CLIENT_ID`: The Client-ID of the Spotify app
- `SPOTIFY_CLIENT_SECRET`: The Client-Secret of the Spotify app
- `ACCESS_TOKEN`: The Spotify access token
- `REFRESH_TOKEN`: The Spotify refresh token
- `DAILY_PLAYLIST`: ID of the "track of the day" playlist
- `WEEKLY_PLAYLIST`: ID of the "album of the week" playlist
- `KV_REST_API_URL`: The URL for your Vercel KV storage (automatically set when you create a KV database)
- `KV_REST_API_TOKEN`: The access token for your Vercel KV storage (automatically set when you create a KV database)

## Initial Setup

1. Create a new project on Vercel and link it to your repository
2. Run `node ./login` locally to get initial Spotify tokens
3. Set up the environment variables in your Vercel project settings
4. Deploy the project to Vercel

## Development

To run the project locally:

1. Clone the repository
2. Create a `.env` file with the required environment variables
3. Run `npm install`
4. Run `npm run dev` to start the development server

## Future improvements

Some planned improvements for the project:

- Create a web interface for easy setup and playlist management
- Add support for custom scheduling intervals
- Implement webhook notifications for successful/failed updates
- Add support for multiple users/playlist combinations
