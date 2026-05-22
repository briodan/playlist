const { checkHostAuth } = require('../_auth');
const { getPartyPlaylists } = require('../_spotify');

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  if (!checkHostAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const events = await getPartyPlaylists();
    const appUrl = process.env.APP_URL || '';
    return res.status(200).json({
      events: events.map((e) => ({
        ...e,
        guestUrl: `${appUrl}/e/${e.id}`,
      })),
    });
  } catch (err) {
    console.error(err);
    // Surface "not connected" differently so the host page can show the right CTA.
    if (err.message?.includes('not connected')) {
      return res.status(503).json({ error: 'spotify_not_connected' });
    }
    return res.status(500).json({ error: err.message });
  }
}
