const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware: verify JWT token (API)
const authenticateToken = async (req, res, next) => {
  try {
    let token = null;

    // Check Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check cookie
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Token de autenticação não fornecido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_fallback');
    const user = await User.findByPk(decoded.id);

    if (!user || !user.active) {
      return res.status(401).json({ success: false, message: 'Usuário não encontrado ou inativo' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token inválido ou expirado' });
  }
};

// Middleware: verify session (Web views)
const authenticateSession = async (req, res, next) => {
  if (req.session && req.session.userId) {
    try {
      const user = await User.findByPk(req.session.userId);
      if (user && user.active) {
        req.user = user;
        res.locals.currentUser = user;
        return next();
      }
    } catch (error) {
      req.session.destroy();
    }
  }
  res.locals.currentUser = null;
  next();
};

// Middleware: require authenticated session
const requireAuth = (req, res, next) => {
  if (!req.user) {
    req.flash('error', 'Você precisa estar autenticado para acessar esta página.');
    return res.redirect('/auth/login');
  }
  next();
};

// Middleware: authorize by role(s)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Não autenticado' });
    }
    if (!roles.includes(req.user.role)) {
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(403).json({ success: false, message: 'Permissão insuficiente' });
      }
      req.flash('error', 'Você não tem permissão para realizar esta ação.');
      return res.redirect('/admin');
    }
    next();
  };
};

// Middleware: optional auth session (for public pages)
const optionalAuth = (req, res, next) => {
  res.locals.currentUser = req.user || null;
  next();
};

module.exports = {
  authenticateToken,
  authenticateSession,
  requireAuth,
  authorize,
  optionalAuth
};
