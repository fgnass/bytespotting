# Bytespotting

Create Spotify playlists based on [ByteFM](https://www.byte.fm/) recommendations.

ByteFM is a German ad-free "author's radio" from Hamburg with high quality music-journalistic contributions. [Each week](https://www.byte.fm/blog/alben-der-woche/) a different album is featured as well as a [daily track](https://www.byte.fm/blog/tracks-des-tages/). Since manually adding these tracks to Spotify is quite time consuming I created Bytespotting to automate the task. As result these two playlists are now populated on a daily basis:

- [Daily tracks](https://open.spotify.com/playlist/3RGUrzI3KludSYbnuxhbxg?si=fe41394ce89140e2)
- [Weekly albumns](https://open.spotify.com/playlist/7yVxheAVcvptuVl8mVgSoH?si=52c69b4e1d134d2f)

## Internals

The sections below describe some of the Bytespotting internals and hopefully are helpful for others who want to implement something similar.

## Scheduling

Bytespotting is run as GitHub action which is daily triggered by a cron expression.

## Spotify Authentication

Unfortunately things are a bit complicated. In order to update a playlist from a cron job, we need an access token from Spotify. And while there is a flow for [server-to-server authentication](https://developer.spotify.com/documentation/general/guides/authorization/client-credentials/), these tokens can't be used to modify playlists. Instead we need a [personal](https://developer.spotify.com/documentation/general/guides/authorization/code-flow/) access token and (since they expire) a refresh token.

## Storing the tokens

The access and refresh tokens need to be stored somewhere between the action runs. Since Bytespotting runs on GitHub it makes sense to use their infrastructure for persistence instead of bringing yet another service into the mix.
Currently Bytespotting uses the [GitHub API](https://docs.github.com/en/rest/reference/actions#create-or-update-a-repository-secret) to store the tokes as repo secrets. Unfortunately the temporary [GITHUB_TOKEN](https://docs.github.com/en/actions/security-guides/automatic-token-authentication) which is created for each worflow run does not have the permission to update secrets. Therefore a [personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) (PAT) has to be created first.
It would probably make sense to explore alternative solutions in future, like using the cache action or maybe build artifacts.

## Acquiring the initial tokens

To kick things off, we need to acquire some initial tokens. This can be done by running `node ./login` which fires up a local web server, starts the authentication flow and logs the tokens to the console.

In order for this to work, a `.env` file must be created that contains these variables:

- `SPOTIFY_CLIENT_ID`: The Client-ID of the Spotify app
- `SPOTIFY_CLIENT_SECRET`: The Client-Secret of the Spotify app

## Setting up the secrets

After that, the following secrets need to be created for the GitHub repo:

- `PAT`: A GitHub personal access token
- `ACCESS_TOKEN`: The Spotify access token
- `REFRESH_TOKEN`: The Spotify refresh token
- `DAILY_PLAYLIST`: ID of the "track of the day" playlist
- `WEEKLY_PLAYLIST`: ID of the "album of the week" playlist
- `SPOTIFY_CLIENT_ID`: The Client-ID of the Spotify app
- `SPOTIFY_CLIENT_SECRET`: The Client-Secret of the Spotify app

## Future improvements

Currently the initial setup requires a lot of manual steps so there's still a lot of room for improvements:

- Let the login script set up the secrets
- Let the login script create the playlists
- Replace the login script by a hosted solution
- Or alternatively, use a setup workflow with user input
- Add GitHub auth flow instead of a PAT
- Let others use my Spotify app without exposing the client secret
