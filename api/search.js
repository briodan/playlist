const { spotifyFetch } = require('./_spotify');

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const q = (req.query.q || '').trim();
  if (!q) return res.status(400).json({ error: 'Missing query parameter q' });
  if (q.length > 100) return res.status(400).json({ error: 'Query too long' });

  try {
    const r = await spotifyFetch(
      `/search?q=${encodeURIComponent(q)}&type=track&limit=10&market=from_token`
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
