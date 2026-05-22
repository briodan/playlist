# Party Playlist

Guests scan a QR code, search for songs, and add them to your Spotify playlist — no Spotify account required for guests.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbriodan%2Fplaylist&env=SPOTIFY_CLIENT_ID,SPOTIFY_CLIENT_SECRET,HOST_PASSWORD,APP_URL&envDescription=See%20the%20setup%20guide%20below%20for%20where%20to%20find%20these%20values&project-name=party-playlist&repository-name=party-playlist&stores=%5B%7B%22type%22%3A%22kv%22%7D%5D)

## Setup after deploying

1. **Add Spotify redirect URI** — The `/host` page shows you the exact URL to paste into your [Spotify app settings](https://developer.spotify.com/dashboard) (one copy-paste)
2. **Connect Spotify** — Click **Connect Spotify** on `/host` — you're redirected back automatically, no token copying
3. **Create an event** — A Spotify playlist and QR code are generated instantly
4. **Share the QR code** — Guests scan it and add songs. No Spotify account required for guests.

> The KV store is provisioned automatically by the deploy button — no manual setup needed.

## Environment variables

| Variable | Description |
|---|---|
| `SPOTIFY_CLIENT_ID` | From [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) |
| `SPOTIFY_CLIENT_SECRET` | From Spotify Developer Dashboard |
| `HOST_PASSWORD` | Password to protect the `/host` dashboard |
| `APP_URL` | Your Vercel deployment URL, e.g. `https://party-playlist.vercel.app` |
