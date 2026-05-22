const { getHostId } = require('../_auth');
const { createPlaylist } = require('../_spotify');
const { setEventHost } = require('../_kv');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const hostId = getHostId(req);
  if (!hostId) return res.status(401).json({ error: 'not_authenticated' });

  let name;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    name = (body?.name || '').trim();
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  if (!name) return res.status(400).json({ error: 'Event name is required' });
  if (name.length > 100) return res.status(400).json({ error: 'Name too long (max 100 chars)' });

  try {
    const playlist = await createPlaylist(hostId, name);

    // Record which host owns this event so guest APIs can use the right token
    await setEventHost(playlist.id, hostId);

    const appUrl = process.env.APP_URL || `https://${req.headers.host}`;
    return res.status(201).json({
      id: playlist.id,
      name: playlist.name,
      url: playlist.url,
      image: playlist.image,
      guestUrl: `${appUrl}/e/${playlist.id}`,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
