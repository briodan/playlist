/**
 * Starts the Spotify OAuth flow.
 * The hostId is passed as the OAuth `state` parameter so the callback
 * can associate the token with the correct host — no cookie timing issues.
 */
export default function handler(req, res) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  if (!clientId) return res.status(500).send('SPOTIFY_CLIENT_ID must be set.');
  const appUrl =
    process.env.APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
    `https://${req.headers['x-forwarded-host'] || req.headers.host}`;

  // Generate a new hostId for this auth attempt (the callback will check
  // if this Spotify user already has one and reuse it if so).
  const hostId = crypto.randomUUID();

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: `${appUrl}/api/auth/callback`,
    scope: 'playlist-modify-public playlist-modify-private user-read-private',
    state: hostId,
    show_dialog: 'true',
  });

  res.redirect(`https://accounts.spotify.com/authorize?${params}`);
}
