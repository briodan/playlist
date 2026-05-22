const { getHostId } = require('../_auth');
const { getHostEvents } = require('../_kv');

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const hostId = getHostId(req);
  if (!hostId) return res.status(401).json({ error: 'not_authenticated' });

  try {
    const events = await getHostEvents(hostId);
    return res.status(200).json({ events });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
