export function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  const apiKey = process.env.API_KEY;
  if (scheme !== 'Bearer' || !token || token !== apiKey) {
    return res.status(404).json({ error: 'Unknown user' });
  }

  req.userId = token;
  
  return next();
}
