const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

async function getHostToken(hostId) { return redis.get(`host:${hostId}:token`); }
async function setHostToken(hostId, token) { return redis.set(`host:${hostId}:token`, token); }

async function getHostAccessToken(hostId) {
  const raw = await redis.get(`host:${hostId}:access`);
  if (!raw) return null;
  try { return typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { return null; }
}
async function setHostAccessToken(hostId, token, expiresIn) {
  const expiry = Date.now() + expiresIn * 1000;
  await redis.set(`host:${hostId}:access`, JSON.stringify({ token, expiry }), { ex: expiresIn - 60 });
}
async function clearHostAccessToken(hostId) { return redis.del(`host:${hostId}:access`); }

async function getHostIdBySpotifyUser(id) { return redis.get(`spotify:${id}:hostId`); }
async function setHostIdBySpotifyUser(id, hostId) { return redis.set(`spotify:${id}:hostId`, hostId); }

async function getEventHost(playlistId) { return redis.get(`event:${playlistId}:hostId`); }
async function setEventHost(playlistId, hostId) { return redis.set(`event:${playlistId}:hostId`, hostId); }

async function addHostEvent(hostId, eventId, meta) {
  await redis.lpush(`host:${hostId}:events`, eventId);
  await redis.set(`event:${eventId}:meta`, JSON.stringify(meta));
}

async function getHostEvents(hostId) {
  const ids = await redis.lrange(`host:${hostId}:events`, 0, 99);
  if (!ids || ids.length === 0) return [];
  const metas = await Promise.all(ids.map(id => redis.get(`event:${id}:meta`)));
  return metas
    .map((m, i) => { try { return typeof m === 'string' ? JSON.parse(m) : m; } catch { return null; } })
    .filter(Boolean);
}

module.exports = { getHostToken, setHostToken, getHostAccessToken, setHostAccessToken, clearHostAccessToken, getHostIdBySpotifyUser, setHostIdBySpotifyUser, getEventHost, setEventHost, addHostEvent, getHostEvents };
