const { getHostId } = require('./_auth');
const { getHostToken, getHostAccessToken } = require('./_kv');
const { getAccessToken } = require('./_spotify');

export default async function handler(req, res) {
  const hostId = getHostId(req);
  if (!hostId) return res.status(401).json({ error: 'no_cookie' });

  const refreshToken = await getHostToken(hostId);
  const cachedAccess = await getHostAccessToken(hostId);

  let accessToken, tokenInfo, meInfo, scopesGranted;

  try {
    // Exchange refresh token manually to see scopes returned
    const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env;
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64'),
      },
      body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
    });
    tokenInfo = await tokenRes.json();
    accessToken = tokenInfo.access_token;
    scopesGranted = tokenInfo.scope;
  } catch (e) {
    return res.json({ hostId, error: 'token_refresh_failed: ' + e.message });
  }

  try {
    const meRes = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    meInfo = await meRes.json();
  } catch (e) {
    meInfo = { error: e.message };
  }

  // Test playlist creation
  let playlistTest;
  try {
    const createRes = await fetch(`https://api.spotify.com/v1/users/${meInfo.id}/playlists`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Debug Test', description: 'delete me', public: false }),
    });
    const createBody = await createRes.json();
    playlistTest = { status: createRes.status, body: createBody };
    // Clean up if it worked
    if (createRes.ok && createBody.id) {
      await fetch(`https://api.spotify.com/v1/playlists/${createBody.id}/followers`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    }
  } catch (e) {
    playlistTest = { error: e.message };
  }

  return res.json({
    hostId,
    hasRefreshToken: !!refreshToken,
    hasCachedAccess: !!cachedAccess,
    scopesGranted,
    spotifyUser: meInfo.id,
    product: meInfo.product,
    displayName: meInfo.display_name,
    playlistTest,
  });
}
