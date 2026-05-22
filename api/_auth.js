const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function parseCookies(req) {
  const str = req.headers.cookie || '';
  return Object.fromEntries(
    str.split(';')
      .map(c => c.trim())
      .filter(Boolean)
      .map(c => {
        const i = c.indexOf('=');
        return [c.slice(0, i).trim(), decodeURIComponent(c.slice(i + 1))];
      })
  );
}

/** Returns the hostId from the request cookie, or null if absent/invalid. */
function getHostId(req) {
  const { hostId = '' } = parseCookies(req);
  return UUID_RE.test(hostId) ? hostId : null;
}

/** Returns a Set-Cookie header value for the given hostId (1 year). */
function hostCookie(hostId) {
  return `hostId=${hostId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`;
}

module.exports = { getHostId, hostCookie };
