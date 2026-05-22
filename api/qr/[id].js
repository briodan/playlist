const QRCode = require('qrcode');

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { id } = req.query;
  if (!id || !/^[A-Za-z0-9]+$/.test(id)) {
    return res.status(400).send('Invalid event ID');
  }

  const appUrl = process.env.APP_URL || `https://${req.headers.host}`;
  const guestUrl = `${appUrl}/e/${id}`;

  try {
    const svg = await QRCode.toString(guestUrl, {
      type: 'svg',
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    });

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.status(200).send(svg);
  } catch (err) {
    console.error(err);
    return res.status(500).send('QR generation failed');
  }
}
