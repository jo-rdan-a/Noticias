require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const flash = require('connect-flash');
const cors = require('cors');
const fs = require('fs');

const { connectDB } = require('./config/database');
require('./models');
const { authenticateSession } = require('./middlewares/auth');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const schedulePublisher = require('./jobs/schedulePublisher');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(methodOverride('_method'));

app.use(session({
  secret: process.env.SESSION_SECRET || 'chave_secreta',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 }
}));
app.use(flash());
app.use(authenticateSession);

app.use((req, res, next) => {
  res.locals.messages = { success: req.flash('success'), error: req.flash('error') };
  next();
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use((req, res, next) => {
  const originalRender = res.render.bind(res);
  res.render = function (view, options = {}, callback) {
    const layout = options.layout;
    delete options.layout;
    if (!layout) return originalRender(view, options, callback);
    originalRender(view, options, (err, body) => {
      if (err) return next(err);
      options.body = body;
      originalRender(layout, options, callback);
    });
  };
  next();
});

const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use(express.static(path.join(__dirname, '../public')));
app.get('/favicon.ico', (req, res) => res.redirect(302, '/img/logo.png'));

app.use('/', require('./routes/public'));
app.use('/auth', require('./routes/auth'));
app.use('/admin', require('./routes/admin'));
app.use('/api', require('./routes/api'));

app.use(notFound);
app.use(errorHandler);

schedulePublisher();

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => console.log('Servidor em http://localhost:' + PORT));
    })
    .catch((err) => {
      console.error('Falha ao iniciar:', err);
      process.exit(1);
    });
}

module.exports = app;
