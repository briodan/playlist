# Party Playlist

Guests scan a QR code, search for songs, and add them to your Spotify playlist. No Spotify account required for guests.

**Multi-host:** each person who wants to run their own party connects their own Spotify account — no separate deployment needed.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbriodan%2Fplaylist&env=SPOTIFY_CLIENT_ID,SPOTIFY_CLIENT_SECRET,APP_URL&envDescription=Create%20a%20Spotify%20app%20at%20developer.spotify.com%2Fdashboard%20to%20get%20these%20values&project-name=party-playlist&repository-name=party-playlist&stores=%5B%7B%22type%22%3A%22kv%22%7D%5D)

## After deploying

1. Visit `https://your-app.vercel.app/host`
2. The setup page shows the exact Redirect URI to add in your Spotify app settings (one copy-paste)
3. Click **Connect Spotify** — you're redirected back automatically

That's it. Create events, share QR codes, done.

## Sharing with others

Send people the link to your deployed app. They visit `/host`, connect their own Spotify account, and manage their own events independently — no new deployment, no GitHub needed.

## Environment variables

| Variable | Description |
|---|---|
| `SPOTIFY_CLIENT_ID` | From [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) |
| `SPOTIFY_CLIENT_SECRET` | From Spotify Developer Dashboard |
| `APP_URL` | Your Vercel URL, e.g. `https://party-playlist.vercel.app` |

KV storage is provisioned automatically by the deploy button.
