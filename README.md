# Party Playlist

Guests scan a QR code, search for songs, and add them to your Spotify playlist — no Spotify account required for guests.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbriodan%2Fplaylist&env=SPOTIFY_CLIENT_ID,SPOTIFY_CLIENT_SECRET,HOST_PASSWORD,APP_URL&envDescription=See%20the%20setup%20guide%20below%20for%20where%20to%20find%20these%20values&project-name=party-playlist&repository-name=party-playlist)

## Setup after deploying

1. **Add a KV store** — Vercel dashboard → Storage → Create Database → KV → link to this project → Redeploy
2. **Add Spotify redirect URI** — In your [Spotify app settings](https://developer.spotify.com/dashboard), add `https://your-app.vercel.app/api/auth/callback` as a Redirect URI
3. **Connect Spotify** — Visit `https://your-app.vercel.app/host`, enter your password, click **Connect Spotify**
4. **Create an event** — From the host dashboard, create a named event. A Spotify playlist and QR code are generated instantly.
5. **Share the QR code** — Guests scan it and start adding songs. No login required.

## Environment variables

| Variable | Description |
|---|---|
| `SPOTIFY_CLIENT_ID` | From [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) |
| `SPOTIFY_CLIENT_SECRET` | From Spotify Developer Dashboard |
| `HOST_PASSWORD` | Password to protect the `/host` dashboard |
| `APP_URL` | Your Vercel deployment URL, e.g. `https://party-playlist.vercel.app` |
