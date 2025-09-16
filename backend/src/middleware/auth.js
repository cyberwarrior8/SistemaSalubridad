import jwt from 'jsonwebtoken';

export function authRequired(req, res, next) {
  const auth = req.headers.authorization || '';
  let token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  // Fallback: permitir token en querystring para iframes/links
  if (!token) {
    const q = req.query || {};
    token = q.token || q.access_token || null;
  }
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export function requireRoles(...roles) {
  return (req, res, next) => {
    const userRoles = req.user?.roles || [];
    const ok = roles.some(r => userRoles.includes(r));
    if (!ok) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}
