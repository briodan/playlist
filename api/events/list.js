const { getHostId } = require('../_auth');
const { getPartyPlaylists } = require('../_spotify');

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const hostId = getHostId(req);
  if (!hostId) return res.status(401).json({ error: 'not_authenticated' });

  try {
    const events = await getPartyPlaylists(hostId);
    const appUrl = process.env.APP_URL || '';
    return res.status(200).json({
      events: events.map(e => ({ ...e, guestUrl: `${appUrl}/e/${e.id}` })),
    });
  } catch (err) {
    console.error(err);
    if (err.message?.includes('not connected')) {
      return res.status(503).json({ error: 'spotify_not_connected' });
    }
    return res.status(500).json({ error: err.message });
  }
}
