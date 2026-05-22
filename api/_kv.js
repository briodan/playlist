const { kv } = require('@vercel/kv');

// Host token — keyed by hostId (UUID)
async function getHostToken(hostId) {
  return kv.get(`host:${hostId}:token`);
}
async function setHostToken(hostId, token) {
  return kv.set(`host:${hostId}:token`, token);
}

// Spotify userId → hostId mapping (so re-authing restores the same hostId)
async function getHostIdBySpotifyUser(spotifyUserId) {
  return kv.get(`spotify:${spotifyUserId}:hostId`);
}
async function setHostIdBySpotifyUser(spotifyUserId, hostId) {
  return kv.set(`spotify:${spotifyUserId}:hostId`, hostId);
}

// Event (playlist) → hostId mapping (so guest APIs know which token to use)
async function getEventHost(playlistId) {
  return kv.get(`event:${playlistId}:hostId`);
}
async function setEventHost(playlistId, hostId) {
  return kv.set(`event:${playlistId}:hostId`, hostId);
}

module.exports = {
  getHostToken, setHostToken,
  getHostIdBySpotifyUser, setHostIdBySpotifyUser,
  getEventHost, setEventHost,
};
