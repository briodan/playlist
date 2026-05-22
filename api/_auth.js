/**
 * Checks the X-Host-Password header against the HOST_PASSWORD env var.
 * Returns true if authorized, false otherwise.
 */
function checkHostAuth(req) {
  const password = process.env.HOST_PASSWORD;
  if (!password) {
    // No password configured — block all access until it's set.
    return false;
  }
  const provided =
    req.headers['x-host-password'] ||
    req.query?.password;
  return provided === password;
}

module.exports = { checkHostAuth };
