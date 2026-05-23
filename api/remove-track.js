const { spotifyFetch } = require('./_spotify');
const { getEventHost } = require('./_kv');
const { getHostId } = require('./_auth');

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).end();

  const hostId = getHostId(req);
  if (!hostId) return res.status(401).json({ error: 'Not authenticated' });

  let trackUri, eventId;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    trackUri = body?.uri;
    eventId = body?.eventId;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  if (!trackUri || !/^spotify:track:[A-Za-z0-9]+$/.test(trackUri)) {
    return res.status(400).json({ error: 'Invalid or missing track URI' });
  }
  if (!eventId || !/^[A-Za-z0-9]+$/.test(eventId)) {
    return res.status(400).json({ error: 'Invalid or missing eventId' });
  }

  try {
    const eventHostId = await getEventHost(eventId);
    if (!eventHostId) return res.status(404).json({ error: 'Event not found' });
    if (eventHostId !== hostId) return res.status(403).json({ error: 'Not your event' });

    const r = await spotifyFetch(hostId, `/playlists/${eventId}/items`, {
      method: 'DELETE',
      body: JSON.stringify({ tracks: [{ uri: trackUri }] }),
    });

    if (!r.ok) {
      const text = await r.text();
      console.error('Spotify remove error', r.status, text);
      return res.status(502).json({ error: 'Failed to remove track' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
