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

  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env;
  const APP_URL =
    process.env.APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
    `https://${req.headers['x-forwarded-host'] || req.headers.host}`;

  // Step 1: Exchange code for tokens
  let access_token, refresh_token;
  try {
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

    const tokenBody = await tokenRes.text();
    if (!tokenRes.ok) {
      console.error('Token exchange failed', tokenRes.status, tokenBody);
      return res.redirect(`/host?error=${encodeURIComponent('token_exchange: ' + tokenBody.slice(0, 100))}`);
    }

    const tokenData = JSON.parse(tokenBody);
    access_token = tokenData.access_token;
    refresh_token = tokenData.refresh_token;
  } catch (err) {
    console.error('Token exchange error:', err);
    return res.redirect(`/host?error=${encodeURIComponent('token_step: ' + err.message.slice(0, 100))}`);
  }

  // Step 2: Get Spotify user ID
  let spotifyUserId;
  try {
    const meRes = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const meBody = await meRes.text();
    if (!meRes.ok) {
      console.error('Spotify /me failed', meRes.status, meBody);
      return res.redirect(`/host?error=${encodeURIComponent('me_step: ' + meBody.slice(0, 100))}`);
    }
    const meData = JSON.parse(meBody);
    spotifyUserId = meData.id;
  } catch (err) {
    console.error('Spotify /me error:', err);
    return res.redirect(`/host?error=${encodeURIComponent('me_step: ' + err.message.slice(0, 100))}`);
  }

  // Step 3: KV — look up or create hostId
  let hostId;
  try {
    hostId = await getHostIdBySpotifyUser(spotifyUserId);
    if (!hostId) {
      hostId = crypto.randomUUID();
      await setHostIdBySpotifyUser(spotifyUserId, hostId);
    }
    await setHostToken(hostId, refresh_token);
  } catch (err) {
    console.error('KV error:', err);
    return res.redirect(`/host?error=${encodeURIComponent('kv_step: ' + err.message.slice(0, 100))}`);
  }

  res.setHeader('Set-Cookie', hostCookie(hostId));
  return res.redirect('/host?setup=done');
}
