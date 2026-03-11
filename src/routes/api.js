const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const articleController = require('../controllers/articleController');
const categoryTagController = require('../controllers/categoryTagController');
const { authenticateToken, authorize } = require('../middlewares/auth');
const { validateLogin, validateRegister, validateArticle } = require('../middlewares/validators');
const upload = require('../middlewares/upload');

// ==================== AUTH ====================
router.post('/auth/register', validateRegister, authController.apiRegister);
router.post('/auth/login', validateLogin, authController.apiLogin);
router.get('/auth/me', authenticateToken, authController.apiMe);

// ==================== PUBLIC ARTICLES ====================
router.get('/artigos', articleController.apiList);
router.get('/artigos/:slug', articleController.apiShow);

// ==================== PROTECTED ARTICLES ====================
router.get('/admin/artigos', authenticateToken, articleController.apiListAll);
router.use('/artigos', authenticateToken);
router.post('/artigos', upload.single('coverImage'), validateArticle, articleController.apiCreate);
router.put('/artigos/:id', upload.single('coverImage'), articleController.apiUpdate);
router.delete('/artigos/:id', articleController.apiDelete);

// ==================== CATEGORIES & TAGS ====================
router.get('/categorias', categoryTagController.listCategories);
router.get('/tags', categoryTagController.listTags);

router.use(authenticateToken);
router.use(authorize('editor'));
router.post('/categorias', categoryTagController.createCategory);
router.put('/categorias/:id', categoryTagController.updateCategory);
router.delete('/categorias/:id', categoryTagController.deleteCategory);
router.post('/tags', categoryTagController.createTag);
router.delete('/tags/:id', categoryTagController.deleteTag);

module.exports = router;
