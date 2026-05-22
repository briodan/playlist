/**
 * OAuth callback.
 * - Exchanges the code for tokens.
 * - Looks up (or creates) a hostId for this Spotify user so re-authing
 *   always restores the same host identity and events.
 * - Saves the refresh token to KV and sets the hostId cookie.
 * No token copying required.
 */
const { hostCookie } = require('../_auth');
const { setHostToken, getHostIdBySpotifyUser, setHostIdBySpotifyUser } = require('../_kv');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export default async function handler(req, res) {
  const { code, state, error } = req.query;

  if (error) return res.redirect(`/host?error=${encodeURIComponent(error)}`);
  if (!code || !UUID_RE.test(state)) return res.redirect('/host?error=invalid_callback');

  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, APP_URL } = process.env;

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64'),
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${APP_URL}/api/auth/callback`,
      }),
    });

    if (!tokenRes.ok) {
      console.error('Token exchange failed', await tokenRes.text());
      return res.redirect('/host?error=token_exchange_failed');
    }

    const { access_token, refresh_token } = await tokenRes.json();

    // Get the Spotify user ID to look up or create a stable hostId
    const meRes = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const { id: spotifyUserId } = await meRes.json();

    // Reuse existing hostId if this Spotify user has authenticated before
    let hostId = await getHostIdBySpotifyUser(spotifyUserId);
    if (!hostId) {
      hostId = crypto.randomUUID();
      await setHostIdBySpotifyUser(spotifyUserId, hostId);
    }

    await setHostToken(hostId, refresh_token);

    res.setHeader('Set-Cookie', hostCookie(hostId));
    return res.redirect('/host?setup=done');
  } catch (err) {
    console.error(err);
    return res.redirect(`/host?error=${encodeURIComponent(err.message)}`);
  }
}
