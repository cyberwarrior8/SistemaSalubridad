import jwt from 'jsonwebtoken';

export function authRequired(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
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
