import jwt from 'jsonwebtoken';
import sql from 'mssql';

function cookieValue(req, name) {
  const cookies = (req.headers.cookie || '').split(';');
  const entry = cookies.find(cookie => cookie.trim().startsWith(`${name}=`));
  if (!entry) return null;
  try { return decodeURIComponent(entry.trim().slice(name.length + 1)); }
  catch { return null; }
}

export function csrfRequired(req, res, next) {
  const csrfCookie = cookieValue(req, 'csrf_token');
  const csrfHeader = req.get('X-CSRF-Token');
  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return res.status(403).json({ message: 'Invalid CSRF token' });
  }
  next();
}

export function authRequired(req, res, next) {
  const auth = req.headers.authorization || '';
  const cookieToken = cookieValue(req, 'access_token');
  const token = cookieToken || (auth.startsWith('Bearer ') ? auth.slice(7) : null);
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      return res.status(500).json({ message: 'Authentication is unavailable' });
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    if (!Number.isInteger(Number(payload.sub)) || Number(payload.sub) <= 0 || !Array.isArray(payload.roles)) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (cookieToken && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      const csrfCookie = cookieValue(req, 'csrf_token');
      const csrfHeader = req.get('X-CSRF-Token');
      if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
        return res.status(403).json({ message: 'Invalid CSRF token' });
      }
    }
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// Keeps object authorization tied to the latest assignment recorded for a sample.
export async function evaluatorOwnsSample(pool, sampleId, userId, allowedStates = null) {
  const result = await pool.request()
    .input('id_muestra', sql.Int, sampleId)
    .input('id_usuario', sql.Int, userId)
    .query(`
      SELECT m.estado_actual
      FROM dbo.Muestra m
      CROSS APPLY (
        SELECT TOP 1 b.id_usuario_responsable
        FROM dbo.BitacoraMuestra b
        WHERE b.id_muestra = m.id_muestra
        ORDER BY b.fecha_asignacion DESC, b.id_bitacora DESC
      ) a
      WHERE m.id_muestra = @id_muestra AND m.eliminada = 0
        AND a.id_usuario_responsable = @id_usuario
    `);
  if (!result.recordset[0]) return false;
  return !allowedStates || allowedStates.includes(result.recordset[0].estado_actual);
}

export function requireRoles(...roles) {
  return (req, res, next) => {
    const userRoles = req.user?.roles || [];
    const ok = roles.some(r => userRoles.includes(r));
    if (!ok) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}

export function rateLimit({ windowMs = 15 * 60 * 1000, max = 10 } = {}) {
  const buckets = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    if (buckets.size > 10000) {
      for (const [ip, entry] of buckets) if (entry.resetAt <= now) buckets.delete(ip);
    }
    res.setHeader('RateLimit-Limit', max);
    res.setHeader('RateLimit-Remaining', Math.max(0, max - bucket.count));
    if (bucket.count > max) {
      res.setHeader('Retry-After', Math.ceil((bucket.resetAt - now) / 1000));
      return res.status(429).json({ message: 'Too many requests; try again later' });
    }
    next();
  };
}
