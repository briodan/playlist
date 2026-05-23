/**
 * Shared Spotify API helper — multi-host aware.
 * Each host has their own refresh token stored in KV under their hostId.
 * Access tokens are cached in KV per hostId.
 */

const { getHostToken, setHostToken, getHostAccessToken, setHostAccessToken } = require('./_kv');

async function getAccessToken(hostId) {
  // Use KV-backed cache so re-auth in any serverless instance invalidates the token
  const cached = await getHostAccessToken(hostId);
  if (cached && Date.now() < cached.expiry - 60_000) {
    return cached.token;
  }

  const refreshToken = await getHostToken(hostId);
  if (!refreshToken) {
    throw new Error('Spotify not connected. Visit /host to connect your Spotify account.');
  }

  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env;
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization:
        'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64'),
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token refresh failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  await setHostAccessToken(hostId, data.access_token, data.expires_in);

  // Spotify occasionally rotates the refresh token — persist the new one.
  if (data.refresh_token) await setHostToken(hostId, data.refresh_token);

  return data.access_token;
}

async function spotifyFetch(hostId, path, options = {}) {
  const token = await getAccessToken(hostId);
  return fetch(`https://api.spotify.com/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
}

/** Creates a new tagged playlist for this host and returns its info. */
async function createPlaylist(hostId, name) {
  const res = await spotifyFetch(hostId, `/me/playlists`, {
    method: 'POST',
    body: JSON.stringify({
      name,
      description: '[PartyQueue] Created by Party Playlist app',
      public: true,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create playlist (${res.status}): ${text}`);
  }
  const data = await res.json();
  return { id: data.id, name: data.name, url: data.external_urls?.spotify || null, image: data.images?.[0]?.url || null };
}

module.exports = { getAccessToken, spotifyFetch, createPlaylist };
