/**
 * Shared Spotify API helper.
 * - Access token cached in module scope (refreshed when near-expiry).
 * - Refresh token read from Vercel KV (set automatically by OAuth callback),
 *   with fallback to SPOTIFY_REFRESH_TOKEN env var for local dev.
 */

const { getRefreshToken } = require('./_kv');

let cachedToken = null;
let tokenExpiry = 0;
let cachedUserId = null;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry - 60_000) {
    return cachedToken;
  }

  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env;

  // Prefer KV-stored token (set via OAuth); fall back to env var (local dev).
  const refreshToken =
    (await getRefreshToken()) || process.env.SPOTIFY_REFRESH_TOKEN;

  if (!refreshToken) {
    throw new Error(
      'Spotify is not connected. Visit /host to complete the Spotify setup.'
    );
  }

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization:
        'Basic ' +
        Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString(
          'base64'
        ),
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token refresh failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + data.expires_in * 1000;
  return cachedToken;
}

async function spotifyFetch(path, options = {}) {
  const token = await getAccessToken();
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  return res;
}

/** Returns the authenticated user's Spotify ID (cached). */
async function getMe() {
  if (cachedUserId) return cachedUserId;
  const res = await spotifyFetch('/me');
  if (!res.ok) throw new Error('Failed to fetch Spotify user profile');
  const data = await res.json();
  cachedUserId = data.id;
  return cachedUserId;
}

/**
 * Creates a new Spotify playlist for the authenticated user.
 * Tags it with [PartyQueue] in the description so we can list our playlists.
 */
async function createPlaylist(name) {
  const userId = await getMe();
  const res = await spotifyFetch(`/users/${userId}/playlists`, {
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
  return {
    id: data.id,
    name: data.name,
    url: data.external_urls?.spotify || null,
    image: data.images?.[0]?.url || null,
  };
}

/**
 * Lists all playlists owned by the user that were created by this app
 * (identified by [PartyQueue] in description).
 */
async function getPartyPlaylists() {
  const userId = await getMe();
  // Fetch up to 50 playlists; for most users this covers everything.
  const res = await spotifyFetch(`/users/${userId}/playlists?limit=50`);
  if (!res.ok) throw new Error('Failed to fetch playlists');
  const data = await res.json();
  return (data.items || [])
    .filter((p) => p.description?.includes('[PartyQueue]'))
    .map((p) => ({
      id: p.id,
      name: p.name,
      url: p.external_urls?.spotify || null,
      image: p.images?.[0]?.url || null,
    }));
}

module.exports = { getAccessToken, spotifyFetch, getMe, createPlaylist, getPartyPlaylists };
