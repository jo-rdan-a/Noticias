const { body, validationResult } = require('express-validator');

// Handle validation results
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }
    req.flash('error', errors.array().map(e => e.msg).join(', '));
    return res.redirect('back');
  }
  next();
};

// Auth validators
const validateRegister = [
  body('name').trim().notEmpty().withMessage('Nome é obrigatório').isLength({ max: 100 }),
  body('email').trim().isEmail().withMessage('Email inválido').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
  body('role').optional().isIn(['journalist', 'editor']).withMessage('Papel inválido'),
  handleValidation
];

const validateLogin = [
  body('email').trim().isEmail().withMessage('Email inválido').normalizeEmail(),
  body('password').notEmpty().withMessage('Senha é obrigatória'),
  handleValidation
];

// Article validators
const validateArticle = [
  body('title').trim().notEmpty().withMessage('Título é obrigatório').isLength({ max: 200 }),
  body('content').trim().notEmpty().withMessage('Conteúdo é obrigatório'),
  body('category').notEmpty().withMessage('Categoria é obrigatória'),
  body('status').optional().isIn(['draft', 'scheduled', 'published']).withMessage('Status inválido'),
  body('publishedAt').optional({ nullable: true }).isISO8601().withMessage('Data inválida'),
  handleValidation
];

module.exports = { validateRegister, validateLogin, validateArticle, handleValidation };
