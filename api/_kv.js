const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

async function getHostToken(hostId) { return redis.get(`host:${hostId}:token`); }
async function setHostToken(hostId, token) { return redis.set(`host:${hostId}:token`, token); }

async function getHostIdBySpotifyUser(id) { return redis.get(`spotify:${id}:hostId`); }
async function setHostIdBySpotifyUser(id, hostId) { return redis.set(`spotify:${id}:hostId`, hostId); }

async function getEventHost(playlistId) { return redis.get(`event:${playlistId}:hostId`); }
async function setEventHost(playlistId, hostId) { return redis.set(`event:${playlistId}:hostId`, hostId); }

module.exports = { getHostToken, setHostToken, getHostIdBySpotifyUser, setHostIdBySpotifyUser, getEventHost, setEventHost };
