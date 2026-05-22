const { spotifyFetch } = require('./_spotify');
const { getEventHost } = require('./_kv');

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const eventId = (req.query.eventId || '').trim();
  if (!eventId) return res.status(400).json({ error: 'Missing eventId' });

  const hostId = await getEventHost(eventId);
  if (!hostId) return res.status(404).json({ error: 'Event not found' });

  try {
    const r = await spotifyFetch(hostId, '/me/player/currently-playing');
    if (r.status === 204 || r.status === 404) return res.status(200).json({ playing: false });
    if (!r.ok) return res.status(200).json({ playing: false });

    const data = await r.json();
    if (!data?.item) return res.status(200).json({ playing: false });

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      playing: data.is_playing,
      progress_ms: data.progress_ms,
      track: {
        id: data.item.id,
        name: data.item.name,
        artists: data.item.artists.map(a => a.name).join(', '),
        album: data.item.album.name,
        image: data.item.album.images[1]?.url || data.item.album.images[0]?.url || null,
        duration_ms: data.item.duration_ms,
        uri: data.item.uri,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(200).json({ playing: false });
  }
}
