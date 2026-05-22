const { spotifyFetch } = require('./_spotify');
const { getEventHost } = require('./_kv');

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const q = (req.query.q || '').trim();
  const eventId = (req.query.eventId || '').trim();

  if (!q) return res.status(400).json({ error: 'Missing query parameter q' });
  if (q.length > 100) return res.status(400).json({ error: 'Query too long' });
  if (!eventId) return res.status(400).json({ error: 'Missing eventId' });

  const hostId = await getEventHost(eventId);
  if (!hostId) return res.status(404).json({ error: 'Event not found' });

  try {
    const r = await spotifyFetch(
      hostId,
      `/search?q=${encodeURIComponent(q)}&type=track&limit=10`
    );

    if (!r.ok) {
      const text = await r.text();
      console.error('Spotify search error', r.status, text);
      return res.status(502).json({ error: 'Spotify search failed' });
    }

    const data = await r.json();
    const tracks = (data.tracks?.items || []).map((t) => ({
      id: t.id,
      name: t.name,
      artists: t.artists.map((a) => a.name).join(', '),
      album: t.album.name,
      image: t.album.images[1]?.url || t.album.images[0]?.url || null,
      duration_ms: t.duration_ms,
      uri: t.uri,
    }));

    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    return res.status(200).json({ tracks });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
