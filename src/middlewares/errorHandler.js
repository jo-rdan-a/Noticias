const notFound = (req, res, next) => {
  const err = new Error('Rota não encontrada: ' + req.originalUrl);
  err.statusCode = 404;
  next(err);
};

const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || err.status || 500;
  let message = err.message || 'Erro interno';

  if (err.name === 'SequelizeValidationError') {
    status = 400;
    message = (err.errors || []).map(e => e.message).join(', ') || message;
  }
  if (err.name === 'SequelizeUniqueConstraintError') {
    status = 409;
    message = (err.errors && err.errors[0] && err.errors[0].path) ? err.errors[0].path + ' já existe' : 'Registro duplicado';
  }
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token inválido ou expirado';
  }

  if (status >= 500) console.error(status, message, err);

  if (req.originalUrl.startsWith('/api/')) {
    return res.status(status).json({ success: false, message });
  }
  res.status(status).render('error', {
    title: 'Erro ' + status,
    statusCode: status,
    message,
    layout: 'layouts/main'
  });
};

module.exports = { notFound, errorHandler };
