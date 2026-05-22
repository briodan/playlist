const { spotifyFetch } = require('../_spotify');

/**
 * Public endpoint: returns basic info about an event playlist.
 * Used by the guest page to display the event name and image.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { id } = req.query;
  if (!id || !/^[A-Za-z0-9]+$/.test(id)) {
    return res.status(400).json({ error: 'Invalid event ID' });
  }

  try {
    const r = await spotifyFetch(
      `/playlists/${id}?fields=id,name,description,images,external_urls`
    );

    if (r.status === 404) {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (!r.ok) {
      return res.status(502).json({ error: 'Failed to fetch event' });
    }

    const data = await r.json();

    // Only expose playlists created by this app.
    if (!data.description?.includes('[PartyQueue]')) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    return res.status(200).json({
      id: data.id,
      name: data.name,
      image: data.images?.[0]?.url || null,
      url: data.external_urls?.spotify || null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
