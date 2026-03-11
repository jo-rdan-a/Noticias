const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const { requireAuth } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// All admin routes require auth
router.use(requireAuth);

// Admin dashboard
router.get('/', (req, res) => {
  res.render('admin/dashboard', { title: 'Dashboard', layout: 'layouts/admin' });
});

// Articles CRUD
router.get('/artigos', articleController.adminIndex);
router.get('/artigos/novo', articleController.adminNew);
router.post('/artigos', upload.single('coverImage'), articleController.adminCreate);
router.get('/artigos/:id/editar', articleController.adminEdit);
router.put('/artigos/:id', upload.single('coverImage'), articleController.adminUpdate);
router.delete('/artigos/:id', articleController.adminDelete);

module.exports = router;
