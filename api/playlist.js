const { spotifyFetch } = require('./_spotify');

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const eventId = req.query.eventId;
  if (!eventId || !/^[A-Za-z0-9]+$/.test(eventId)) {
    return res.status(400).json({ error: 'Missing or invalid eventId' });
  }

  try {
    const [infoRes, tracksRes] = await Promise.all([
      spotifyFetch(`/playlists/${eventId}?fields=name,description,images,external_urls`),
      spotifyFetch(
        `/playlists/${eventId}/tracks?fields=items(track(id,name,artists,album,duration_ms,uri))&limit=50`
      ),
    ]);

    if (!infoRes.ok || !tracksRes.ok) {
      return res.status(502).json({ error: 'Failed to fetch playlist' });
    }

    const info = await infoRes.json();
    const tracksData = await tracksRes.json();

    const tracks = (tracksData.items || [])
      .filter((i) => i.track)
      .map((i) => ({
        id: i.track.id,
        name: i.track.name,
        artists: i.track.artists.map((a) => a.name).join(', '),
        album: i.track.album.name,
        image: i.track.album.images[1]?.url || i.track.album.images[0]?.url || null,
        duration_ms: i.track.duration_ms,
        uri: i.track.uri,
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
