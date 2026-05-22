const { checkHostAuth } = require('../_auth');
const { createPlaylist } = require('../_spotify');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  if (!checkHostAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

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
    const playlist = await createPlaylist(name);
    const appUrl = process.env.APP_URL || '';
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
