const { spotifyFetch } = require('./_spotify');
const { getEventHost } = require('./_kv');

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const eventId = req.query.eventId;
  if (!eventId || !/^[A-Za-z0-9]+$/.test(eventId)) {
    return res.status(400).json({ error: 'Missing or invalid eventId' });
  }

  try {
    const hostId = await getEventHost(eventId);
    if (!hostId) return res.status(404).json({ error: 'Event not found' });

    const [infoRes, tracksRes] = await Promise.all([
      spotifyFetch(hostId, `/playlists/${eventId}`),
      spotifyFetch(hostId, `/playlists/${eventId}/items?limit=50`),
    ]);

    const infoBody = await infoRes.text();
    const tracksBody = await tracksRes.text();

    if (!infoRes.ok || !tracksRes.ok) {
      return res.status(502).json({ error: 'Failed to fetch playlist', infoStatus: infoRes.status, tracksStatus: tracksRes.status, infoBody, tracksBody });
    }

    const info = JSON.parse(infoBody);
    const tracksData = JSON.parse(tracksBody);
    const rawItems = tracksData.items || [];
    const tracks = rawItems
      .filter(i => i.item && i.item.type === 'track')
      .map(i => ({
        id: i.item.id,
        name: i.item.name,
        artists: i.item.artists.map(a => a.name).join(', '),
        album: i.item.album?.name,
        image: i.item.album?.images?.[1]?.url || i.item.album?.images?.[0]?.url || null,
        duration_ms: i.item.duration_ms,
        uri: i.item.uri,
      }));

    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=20');
    return res.status(200).json({
      name: info.name,
      description: info.description,
      image: info.images?.[0]?.url || null,
      url: info.external_urls?.spotify || null,
      tracks,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
