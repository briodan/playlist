/**
 * Host one-time auth flow: redirects to Spotify OAuth consent screen.
 * Visit /api/auth/login in the browser while setting up the app.
 */
export default function handler(req, res) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const appUrl = process.env.APP_URL;

  if (!clientId || !appUrl) {
    return res
      .status(500)
      .send('SPOTIFY_CLIENT_ID and APP_URL must be set in environment variables.');
  }

  const scopes = [
    'playlist-modify-public',
    'playlist-modify-private',
    'playlist-read-private',
  ].join(' ');

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: `${appUrl}/api/auth/callback`,
    scope: scopes,
    show_dialog: 'true',
  });

  res.redirect(`https://accounts.spotify.com/authorize?${params}`);
}
