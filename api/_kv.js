const { kv } = require('@vercel/kv');

const REFRESH_TOKEN_KEY = 'spotify:refresh_token';

async function getRefreshToken() {
  return kv.get(REFRESH_TOKEN_KEY);
}

async function setRefreshToken(token) {
  return kv.set(REFRESH_TOKEN_KEY, token);
}

module.exports = { getRefreshToken, setRefreshToken };
