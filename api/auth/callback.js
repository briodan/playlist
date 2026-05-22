/**
 * OAuth callback. Exchanges the code for tokens and saves the refresh token
 * to Vercel KV automatically — no manual token copying needed.
 */
const { setRefreshToken } = require('../_kv');

export default async function handler(req, res) {
  const { code, error } = req.query;

  if (error) {
    return res.redirect(`/host?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return res.redirect('/host?error=missing_code');
  }

  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, APP_URL } = process.env;

  try {
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization:
          'Basic ' +
          Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString(
            'base64'
          ),
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${APP_URL}/api/auth/callback`,
      }),
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      console.error('Token exchange failed', tokenRes.status, text);
      return res.redirect('/host?error=token_exchange_failed');
    }

    const data = await tokenRes.json();

    // Save to KV — guests and future API calls will use this automatically.
    await setRefreshToken(data.refresh_token);

    return res.redirect('/host?setup=done');
  } catch (err) {
    console.error(err);
    return res.redirect(`/host?error=${encodeURIComponent(err.message)}`);
  }
}
