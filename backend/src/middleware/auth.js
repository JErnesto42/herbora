const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const authorization = req.get('authorization') || '';
  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Faça login para continuar.' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ message: 'Sessão inválida ou expirada.' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Acesso permitido somente a administradores.' });
  }
  return next();
}

function optionalAuth(req, res, next) {
  const authorization = req.get('authorization') || '';
  if (!authorization) return next();

  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Formato de autenticação inválido.' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ message: 'Sessão inválida ou expirada.' });
  }
}

function requireMember(req, res, next) {
  if (!['member', 'admin'].includes(req.user?.role)) {
    return res.status(403).json({ message: 'Entre em uma conta para acessar esta função.' });
  }
  return next();
}

module.exports = { requireAuth, requireAdmin, optionalAuth, requireMember };
