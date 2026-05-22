const { spotifyFetch } = require('./_spotify');
const { getEventHost } = require('./_kv');

const rateLimitMap = new Map();
const MAX_ADDS = 3;
const WINDOW_MS = 10 * 60 * 1000;

function checkRateLimit(ip) {
  const now = Date.now();
  let entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    rateLimitMap.set(ip, entry);
  }
  if (entry.count >= MAX_ADDS) return false;
  entry.count += 1;
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, WINDOW_MS);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const ip =
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.socket?.remoteAddress || 'unknown';

  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: `Slow down! You can add up to ${MAX_ADDS} songs every 10 minutes.` });
  }

  let trackUri, eventId;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    trackUri = body?.uri;
    eventId = body?.eventId;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  if (!trackUri || !/^spotify:track:[A-Za-z0-9]+$/.test(trackUri)) {
    return res.status(400).json({ error: 'Invalid or missing Spotify track URI' });
  }
  if (!eventId || !/^[A-Za-z0-9]+$/.test(eventId)) {
    return res.status(400).json({ error: 'Invalid or missing eventId' });
  }

  try {
    const hostId = await getEventHost(eventId);
    if (!hostId) return res.status(404).json({ error: 'Event not found' });

    const checkRes = await spotifyFetch(hostId, `/playlists/${eventId}/items?fields=items(track(uri))&limit=50`);
    if (checkRes.ok) {
      const { items = [] } = await checkRes.json();
      if (items.map(i => i.track?.uri).includes(trackUri)) {
        return res.status(409).json({ error: 'That song is already in the playlist!' });
      }
    }

    const addRes = await spotifyFetch(hostId, `/playlists/${eventId}/items`, {
      method: 'POST',
      body: JSON.stringify({ uris: [trackUri] }),
    });

    if (!addRes.ok) {
      console.error('Spotify add error', addRes.status, await addRes.text());
      return res.status(502).json({ error: 'Failed to add track to playlist' });
    }

    const data = await addRes.json();
    return res.status(200).json({ snapshot_id: data.snapshot_id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
