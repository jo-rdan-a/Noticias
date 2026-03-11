const jwt = require('jsonwebtoken');
const { User } = require('../models');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'secret_fallback', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// ==================== WEB CONTROLLERS ====================

exports.showLogin = (req, res) => {
  if (req.user) return res.redirect('/admin');
  res.render('auth/login', { title: 'Entrar', layout: 'layouts/auth' });
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.scope('withPassword').findOne({ where: { email, active: true } });

    if (!user || !(await user.comparePassword(password))) {
      req.flash('error', 'Email ou senha incorretos.');
      return res.redirect('/auth/login');
    }

    req.session.userId = user.id;
    req.flash('success', `Bem-vindo(a), ${user.name}!`);
    res.redirect('/admin');
  } catch (error) {
    console.error('Login error', error);
    req.flash('error', 'Erro ao fazer login. Tente novamente.');
    res.redirect('/auth/login');
  }
};

exports.logout = (req, res) => {
  req.session.destroy();
  res.clearCookie('connect.sid');
  res.redirect('/');
};

// ==================== API CONTROLLERS ====================

exports.apiRegister = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email já cadastrado' });
    }

    const user = await User.create({ name, email, password, role: role || 'journalist' });
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      data: { user: user.toJSON(), token }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.apiLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.scope('withPassword').findOne({ where: { email, active: true } });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: { user: user.toJSON(), token }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.apiMe = async (req, res) => {
  res.json({ success: true, data: { user: req.user.toJSON ? req.user.toJSON() : req.user } });
};
