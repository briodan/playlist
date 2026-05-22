export default function handler(req, res) {
  res.setHeader('Set-Cookie', 'hostId=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
  res.redirect('/host');
}
